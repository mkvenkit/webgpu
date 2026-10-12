// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for the OIT WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';
import { createSharedResources, createOpaquePipeline, 
         createTransparentPipeline, createBlendPipeline } from './mesh.js';

// main function 
async function main() {

    // get WebGPU adapter 
    const adapter = await navigator.gpu?.requestAdapter();
    // get WebGPU device
    const device = await adapter?.requestDevice();
    if (!device) {
        alert("Couldn't get WebGPU device! Need a browser that supports WebGPU!");
        return;
    }

    // get the canvas from the document
    const canvas = document.querySelector('canvas');
    // get WebGPU rendering context from the canvas
    const context = canvas.getContext('webgpu');
    // configure the context
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    // create a depth texture: written by the opaque pass, 
    // then read by the transparent pass
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    // create a buffer to hold heads of linked lists at every (x, y)
    // index_counter: uint32
    // image: w x h x uint32
    let nElements = (1 + canvas.width * canvas.height);
    let headsBufSize =  nElements * Uint32Array.BYTES_PER_ELEMENT;
    let headsBuffer = device.createBuffer({
        size: headsBufSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // staging buffer for initializing headsBuffer every frame:
    // index_counter starts at 0, and every head starts as
    // 0xffffffff (empty list)
    let initBuffer = device.createBuffer({
        size: headsBufSize,
        usage: GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true
    });
    {
        const buffer = new Uint32Array(initBuffer.getMappedRange());
        buffer.fill(0xffffffff);
        buffer[0] = 0; // index_counter
        initBuffer.unmap();
    }

    // create a storage buffer for the linked list nodes:
    // room for an average of 4 transparent fragments per pixel
    // each node is 12 bytes: next (u32), color (u32), depth (f32)
    const maxNodes = 4 * canvas.width * canvas.height;
    let linkedListBuffer = device.createBuffer({
        size: maxNodes * 12,
        usage: GPUBufferUsage.STORAGE,
    });

    // create the shared vertex buffer and uniform buffers
    const shared = createSharedResources(device);
    // create the render pipelines
    const opaque = await createOpaquePipeline(device, shared);
    const transparent = await createTransparentPipeline(device, shared, depthTexture, 
                                                        headsBuffer, linkedListBuffer);
    const blend = await createBlendPipeline(device, shared, headsBuffer, linkedListBuffer);

    // create the render pass descriptors:
    // opaque pass - clears color and depth, draws the opaque quad
    const opaquePassDescriptor = {
        colorAttachments: [{
          clearValue:  { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: undefined
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };
    // transparent pass - builds the linked lists, writes no color
    const transparentPassDescriptor = {
        colorAttachments: [{
          loadOp: 'load',
          storeOp: 'store',
          view: undefined
        }],
    };
    // blend pass - composites the sorted fragments over the opaque scene
    const blendPassDescriptor = {
        colorAttachments: [{
          loadOp: 'load',
          storeOp: 'store',
          view: undefined
        }],
    };

    // write matrices to camera buffer
    function writeCameraBuffer(device, cameraBuffer, mvMat, projMat) {
        // write mvMat
        device.queue.writeBuffer(
            cameraBuffer,
            0,
            mvMat.buffer,
            mvMat.byteOffset,
            mvMat.byteLength
        );

        // write projMat
        device.queue.writeBuffer(
            cameraBuffer,
            mvMat.byteLength,
            projMat.buffer,
            projMat.byteOffset,
            projMat.byteLength
        );
    }

    // time step
    let timeStep = 0.0;
    let now = 0;

    // Update the uniforms: camera matrices and render parameters
    function updateUniforms() {
        // create lookAt matrix
        const eye = [2, 0, 1];
        const target = [0, 0, 0];
        const up = [0, 0, 1];
        const fov = 45;
        let aspect = canvas.width / canvas.height;

        let lookAtMat = mat4.lookAt(eye, target, up);
        // create projection matrix 
        let projMat = mat4.perspective(
            fov * Math.PI/180,
            aspect,
            1,
            100
        );

        // Is rotate checked?
        let rotate = document.querySelector('#rotate').checked;
        if (rotate) {
            // update time 
            now = Date.now() / 2000;
        }

        let mvMat = mat4.create();
        if (rotate) {
            mat4.rotate(
                lookAtMat,
                vec3.fromValues(Math.sin(now), Math.cos(now), 0),
                1,
                mvMat
            );
        }
        else {
            mvMat = lookAtMat;
        }

        // write to the camera buffer shared by the opaque and transparent pipelines
        writeCameraBuffer(device, shared.cameraBuffer, mvMat, projMat);

        // write render params: window size and the premultiply alpha flag
        let premultAlpha = document.querySelector('#premultAlpha').checked ? 1 : 0;
        const paramsData = new Uint32Array([canvas.width, canvas.height, premultAlpha]);
        device.queue.writeBuffer(shared.renderParamsBuffer, 0, paramsData);
    }

    // define render function 
    function render() {
        // increment time step
        timeStep += 1;

        // update uniforms for frame
        updateUniforms();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'OIT encoder' });

        // reset the linked lists for this frame
        encoder.copyBufferToBuffer(
            initBuffer,
            0, // Source offset
            headsBuffer,
            0, // Destination offset
            initBuffer.size,
        );

        // all three passes render to the canvas texture
        const canvasView = context.getCurrentTexture().createView();
        let pass;

        // Opaque: vertices 0-3

        opaquePassDescriptor.colorAttachments[0].view = canvasView;
        pass = encoder.beginRenderPass(opaquePassDescriptor);
        pass.setBindGroup(0, opaque.bindGroup);
        pass.setVertexBuffer(0, shared.vertexBuffer);
        pass.setPipeline(opaque.pipeline);
        pass.draw(4, 1, 0);
        pass.end();

        // Transparent: quad a is vertices 4-7, quad b is vertices 8-11
        // (the draw order no longer affects the result)

        transparentPassDescriptor.colorAttachments[0].view = canvasView;
        pass = encoder.beginRenderPass(transparentPassDescriptor);
        pass.setBindGroup(0, transparent.bindGroup);
        pass.setVertexBuffer(0, shared.vertexBuffer);
        pass.setPipeline(transparent.pipeline);
        if (document.querySelector('#flipOrder').checked) {
            pass.draw(4, 1, 4);
            pass.draw(4, 1, 8);
        }
        else {
            pass.draw(4, 1, 8);
            pass.draw(4, 1, 4);
        }
        pass.end();

        // Blend: one full-screen quad

        blendPassDescriptor.colorAttachments[0].view = canvasView;
        pass = encoder.beginRenderPass(blendPassDescriptor);
        pass.setBindGroup(0, blend.bindGroup);
        pass.setPipeline(blend.pipeline);
        pass.draw(4);
        pass.end();

        // end commands 
        const commandBuffer = encoder.finish();
        // submit to GPU queue
        device.queue.submit([commandBuffer]);

        // request animation
        requestAnimationFrame(render);
    }

    // request animation
    requestAnimationFrame(render);
}

// call main function 
main();
