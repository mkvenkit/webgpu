// ----------------------------------------------------------------------
// volrender.js
// 
// Volume rendering example
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

import {
    vec3,
    mat4,
  } from '../../common/wgpu-matrix.module.js';

import {loadVolume} from './volreader.js';
import { createCube } from './raycube.js';
import { createSlicePipeline, writeToBufferSlice} from './slicerender.js';

// datasets
const Datasets = {
    BRAIN: "brain",
    SPHERE: "sphere"
};

// render styles
const RenderStyles = {
    VOLUME: "volume",
    X_SLICE: "x-slice",
    Y_SLICE: "y-slice",
    Z_SLICE: "z-slice"
};

// main function 
async function main() {

    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    // Get a WebGPU context from the canvas and configure it
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const rayExitTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: presentationFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        label: 'Ray Exit Texture',
    });

    // volume 
    let volume;
    // cube 
    let cube;
    // slice 
    let slice;
    let sliceFraction = 0.0;

    // UI 
    const datasetSelect = document.getElementById("dataset-select");
    const renderStyleSelect = document.getElementById("render-style-select");
    const sliceSlider = document.getElementById("slice_slider");
    const sliceValueLabel = document.getElementById("slice_value");
    const rotateChk = document.querySelector('#rotate');

    let renderStyle = RenderStyles.X_SLICE;

    async function handleSelections() {
        const dataset = datasetSelect.value;
        renderStyle = renderStyleSelect.value;

        // Set UI state first to avoid race conditions
        switch (renderStyle) {
            case RenderStyles.VOLUME:
                console.log("Rendering in Volume style...");
                sliceSlider.disabled = true;
                rotateChk.disabled = false;
                break;
            case RenderStyles.X_SLICE:
            case RenderStyles.Y_SLICE:
            case RenderStyles.Z_SLICE:
                console.log(`Rendering ${renderStyle}...`);
                sliceSlider.disabled = false;
                rotateChk.disabled = true;
                break;
        }

        // Load dataset
        if (dataset === Datasets.BRAIN) {
            console.log("Loading Brain dataset...");
            volume = await loadVolume("../data/mrbrain-8bit_png", device);
            cube = await createCube(device, rayExitTexture, volume.texture);
            slice = await createSlicePipeline(device, volume);
        } else if (dataset === Datasets.SPHERE) {
            console.log("Loading Sphere dataset...");
            volume = await loadVolume("../data/sphere-cuboid", device);
            cube = await createCube(device, rayExitTexture, volume.texture);
            slice = await createSlicePipeline(device, volume);
        }

        // Set slice slider bounds and buffer
        let sliceDim = 0;
        let dimVal = 0;
        switch (renderStyle) {
            case RenderStyles.X_SLICE:
                sliceDim = 0;
                dimVal = volume.width;
                break;
            case RenderStyles.Y_SLICE:
                sliceDim = 1;
                dimVal = volume.height;
                break;
            case RenderStyles.Z_SLICE:
                sliceDim = 2;
                dimVal = volume.depth;
                break;
        }

        if (renderStyle !== RenderStyles.VOLUME) {
            sliceFraction = 0.5;
            writeToBufferSlice(device, slice.uniformBuffer, sliceDim,
                volume.width, volume.height, sliceFraction);
            sliceSlider.setAttribute("min", 0);
            sliceSlider.setAttribute("max", dimVal);
            sliceSlider.value = dimVal / 2;
            sliceValueLabel.textContent = sliceSlider.value;
        }

        requestAnimationFrame(render);
    }


    // Attach listeners
    datasetSelect.addEventListener("change", handleSelections);
    renderStyleSelect.addEventListener("change", handleSelections);
    // trigger once
    await handleSelections();

    function updateSliceFraction(isRender) {
        const sliceIndex = parseInt(sliceSlider.value);
        const maxIndex = parseInt(sliceSlider.max);

        sliceFraction = sliceIndex / maxIndex;
    
        // Update the label
        sliceValueLabel.textContent = sliceIndex;

        let sliceType = 2;
        if (renderStyle == RenderStyles.X_SLICE) {
            sliceType = 0;
        }
        else if (renderStyle == RenderStyles.Y_SLICE) {
            sliceType = 1;
        }
        // write to GPU
        writeToBufferSlice(device, slice.uniformBuffer, sliceType, 
            volume.width, volume.height, sliceFraction);
        // request animation
        requestAnimationFrame(render);
    }

    // When slider moves
    sliceSlider.addEventListener("input", updateSliceFraction);

    // Initialize at start
    writeToBufferSlice(device, slice.uniformBuffer, 0, 
        volume.width, volume.height, 0.5);

    // time step
    let timeStep = 0.0;
    let now = 0;
    let theta = 0.0;

    function updateCamera() {
        // create lookAt matrix
        const eye = [1.25, 1.25, 1.25];
        const target = [0.0, 0.0, 0.0];
        const up = [0, 0, 1];
        const fov = 40;
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
        let rotate = rotateChk.checked;
        let modelMat = mat4.identity();
        if (rotate) {
            theta += 0.01; 
            modelMat = mat4.rotationZ(theta);
        }

        lookAtMat = mat4.multiply(lookAtMat, modelMat);

        // create modelview-projection matrix
        const mvpMat = mat4.create();
        mat4.multiply(projMat, lookAtMat, mvpMat);

        // write uniform buffer to device 
        device.queue.writeBuffer(
            cube.uniformBuffer,
            0,
            mvpMat.buffer,
            mvpMat.byteOffset,
            mvpMat.byteLength
        );
    }
    updateCamera();

    // create a depth texture 
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // create a GPURenderPassDescriptor dict
    const renderPassDescriptor = {
        colorAttachments: [{
          clearValue:  { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView()
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
      };

    const rayExitRenderPass = {
        colorAttachments: [{
            view: rayExitTexture.createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    function render() {

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'volrender encoder' });

        if (renderStyle == RenderStyles.VOLUME) {
            // update camera parameters 
            updateCamera();

            // ray exit render pass 
            const passBack = encoder.beginRenderPass(rayExitRenderPass);
            passBack.setPipeline(cube.pipelineRE);
            passBack.setBindGroup(0, cube.uniformBindGroupRE);
            passBack.setVertexBuffer(0, cube.vertexBuffer);
            passBack.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
            // set index buffer
            passBack.setIndexBuffer(cube.indexBuffer, 'uint32');
            // draw
            passBack.drawIndexed(cube.nIndices);
            passBack.end();

            // make a render pass encoder to encode render specific commands
            const pass = encoder.beginRenderPass(renderPassDescriptor);
            
            pass.setPipeline(cube.pipelineRC);
            pass.setBindGroup(0, cube.uniformBindGroupRC);
            pass.setVertexBuffer(0, cube.vertexBuffer);
            pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
            // set index buffer
            pass.setIndexBuffer(cube.indexBuffer, 'uint32');
            // draw
            pass.drawIndexed(cube.nIndices);
            pass.end();
        }
        else {
            // make a render pass encoder to encode render specific commands
            const pass = encoder.beginRenderPass(renderPassDescriptor);
            
            pass.setPipeline(slice.renderPipeline);
            pass.setBindGroup(0, slice.bindGroup);
            pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
            pass.draw(4); 
            pass.end();
        }

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        // request animation
        requestAnimationFrame(render);
    }

    // request animation
    requestAnimationFrame(render);
}

function fail(msg) {
    // eslint-disable-next-line no-alert
    alert(msg);
}

main();