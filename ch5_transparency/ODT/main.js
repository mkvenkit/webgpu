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
import { createOpaquePipeline, createTransparentPipeline } from './mesh.js';

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

    // create objects
    const opaque = await createOpaquePipeline(device, depthTexture);
    const transparent = await createTransparentPipeline(device, depthTexture);

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

        // premultiply alpha?
        let premultAlpha = document.querySelector('#premultAlpha').checked ? 1 : 0;
        device.queue.writeBuffer(transparent.renderParamsBuffer, 0, new Uint32Array([premultAlpha]));
    }

    // define render function 
    function render() {
        // increment time step
        timeStep += 1;

        // update camera params for frame
        updateCamera();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Opaque encoder' });
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