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
import { createSharedResources, createOpaquePipeline, createTransparentPipeline } from './mesh.js';

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

    // create a GPURenderPassDescriptor object
    // (opaque and transparent quads are drawn in the same render pass)
    const renderPassDescriptor = {
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

    // create the shared vertex buffer, shader module, and bind group
    const shared = await createSharedResources(device);
    // create the render pipelines
    const opaquePipeline = createOpaquePipeline(device, shared);
    const transparentPipeline = createTransparentPipeline(device, shared, false);
    // transparent pipeline with depth writes, to show the artifacts
    const transparentPipelineDW = createTransparentPipeline(device, shared, true);

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

        // write to the camera buffer shared by all pipelines
        writeCameraBuffer(device, shared.cameraBuffer, mvMat, projMat);

        // premultiply alpha?
        let premultAlpha = document.querySelector('#premultAlpha').checked ? 1 : 0;
        device.queue.writeBuffer(shared.renderParamsBuffer, 0, new Uint32Array([premultAlpha]));
    }

    // define render function 
    function render() {
        // increment time step
        timeStep += 1;

        // update uniforms for frame
        updateUniforms();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'ODT encoder' });

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        // set the bind group and vertex buffer shared by all three quads
        pass.setBindGroup(0, shared.bindGroup);
        pass.setVertexBuffer(0, shared.vertexBuffer);

        // Opaque: vertices 0-3
        pass.setPipeline(opaquePipeline);
        pass.draw(4, 1, 0);

        // Transparent: quad a is vertices 4-7, quad b is vertices 8-11
        // (same render pass, same vertex buffer, different pipeline)

        // depth writes enabled for transparent quads?
        let depthWrite = document.querySelector('#depthWrite').checked;
        pass.setPipeline(depthWrite ? transparentPipelineDW : transparentPipeline);
        // draw in the selected order
        if (document.querySelector('#flipOrder').checked) {
            pass.draw(4, 1, 4);
            pass.draw(4, 1, 8);
        }
        else {
            pass.draw(4, 1, 8);
            pass.draw(4, 1, 4);
        }
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