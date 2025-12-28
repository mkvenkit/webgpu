// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for the ODT WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';
import {createBlendPipeline, createOpaquePipeline, createTransparentPipeline } from './mesh.js';

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

    // create a depth texture 
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        //  sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    // create a texture to hold heads of linked lists at every (x, y)
    const headTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
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

    // staging buffer for initializing headBuffer
    let initBuffer = device.createBuffer({
        size: headsBufSize,
        usage: GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true
    });
    {
        const buffer = new Uint32Array(initBuffer.getMappedRange());
    
        for (let i = 0; i < buffer.length; ++i) {
          buffer[i] = 0xffffffff;
        }
    
        initBuffer.unmap();
      }

    // create a storage buffer for the linked lists 
    // each element is a vec4u
    // .x -> next
    // .y -> rgba
    // .z -> depth
    // .w -> unused
    let bufSize = 64 * canvas.width * canvas.height;
    let linkedListBuffer = device.createBuffer({
        size: bufSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // create meshes
    const opaque = await createOpaquePipeline(device, depthTexture);
    const transparent = await createTransparentPipeline(device, depthTexture, 
                                                        headsBuffer, linkedListBuffer);
    const blend = await createBlendPipeline(device, headsBuffer, linkedListBuffer);

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

    // Update camera parameters 
    // viewportID is the viewport number (0/1)
    function updateCamera() {
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

        // write to opaque buffer
        writeCameraBuffer(device, opaque.cameraBuffer, mvMat, projMat);

        // write to transparent buffer
        writeCameraBuffer(device, transparent.cameraBuffer, mvMat, projMat);

        // write render params
        const paramsData = new Uint32Array(4);
        // windowSize
        paramsData[0] = canvas.width;
        paramsData[1] = canvas.height;
        // premultiply alpha?
        let premultAlpha = document.querySelector('#premultAlpha').checked ? 1 : 0;
        paramsData[2] = premultAlpha;
        // write to GPU
        device.queue.writeBuffer(transparent.renderParamsBuffer, 0, paramsData);
        device.queue.writeBuffer(blend.renderParamsBuffer, 0, paramsData);
    }

    // define render function 
    function render() {
        // increment time step
        timeStep += 1;

        // update camera params for frame
        updateCamera();

        // premultiply alpha?
        let premultAlpha = document.querySelector('#premultAlpha').checked ? 1 : 0;
        
        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Opaque encoder' });

        // initialize headBuffer for every frame
        encoder.copyBufferToBuffer(
            initBuffer,
            0, // Source offset
            headsBuffer,
            0, // Destination offset
            initBuffer.size,
        );
          

        let pass;

        // Opaque

        // set texture 
        opaque.renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();
        // make a render pass encoder to encode render specific commands
        pass = encoder.beginRenderPass(opaque.renderPassDescriptor);
        // set camera bind group
        pass.setBindGroup(0, opaque.cameraBindGroup);
        // draw 
        // set vertex buffer
        pass.setVertexBuffer(0, opaque.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(opaque.pipeline);
        // draw 
        pass.draw(4, 1, 0);
        // end render pass
        pass.end();

        
        // Transparent

        // set texture 
        transparent.renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();
        // make a render pass encoder to encode render specific commands
        pass = encoder.beginRenderPass(transparent.renderPassDescriptor);
        // set camera bind group
        pass.setBindGroup(0, transparent.cameraBindGroup);
        // draw 
        // set vertex buffer
        pass.setVertexBuffer(0, transparent.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(transparent.pipeline);
        // draw 
        if (document.querySelector('#flipOrder').checked) {
            pass.draw(4, 1, 0);
            pass.draw(4, 1, 4);
        }
        else {
            pass.draw(4, 1, 4);
            pass.draw(4, 1, 0);
        }
        pass.end();

        
        // Blend 

        // set texture 
        blend.renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();
        // make a render pass encoder to encode render specific commands
        pass = encoder.beginRenderPass(blend.renderPassDescriptor);
        
        // set the render pipeline and bindgroup
        if (premultAlpha) {
            // set uniform bind group
            pass.setBindGroup(0, blend.uniformBindGroupPMA);
            // set pipeline
            pass.setPipeline(blend.pipelinePMA);
        }
        else {
            // set uniform bind group
            pass.setBindGroup(0, blend.uniformBindGroup);
            // set pipeline
            pass.setPipeline(blend.pipeline);
        }
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
    //render();
}

// call main function 
main();