// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for the Helix WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';

// other imports
import {createCube} from './cube.js';
import { createAxes } from './axis.js';
import { computeHelixTNS, createHelix } from './helix.js';

// Helper function for creating materials bind groups
function createMaterialsBindGroups(device, materialBindGroupLayout) {

    // materials buffer:
    // color : 4 bytes x 4 
    // flag : 4 bytes
    // total: 16 + 4 = 20 -> 32 with padding

    let colors = [
        [1, 1, 0, 1], // helix
        [1, 0, 0, 1], // circle 
        [0, 1, 0, 1], // cube 
        [0, 0, 1, 1], // axes 
    ];
    let flags = [0, 0, 1, 2];

    let bindGroups = [];
    for (let i = 0; i < 4; i++) {
        // create uniform to hold materials buffer
        const materialsBuffer = device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        // write color 
        device.queue.writeBuffer(
            materialsBuffer,
            0,
            new Float32Array(colors[i]),
            0,
            4
        );
        // write flag 
        device.queue.writeBuffer(
            materialsBuffer,
            16,
            new Int32Array([flags[i]]), // flag set 
            0,
            1
        );

        // create bind group using a GPUBindGroupDescriptor
        const bindGroup = device.createBindGroup({
            layout: materialBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: materialsBuffer,
                    },
                },
            ],
        });

        bindGroups.push(bindGroup);
    }

    return bindGroups;
}

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

    // create camera parameters bind group 
    const cameraBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0, // mpvMat
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }]
    });

    // create materials bind group 
    const materialBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0, // color
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        }]
    });

    // create render pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            cameraBindGroupLayout, // @group(0)
            materialBindGroupLayout, // @group(1)
        ]
    });

    // create helix 
    const helix = await createHelix(device, pipelineLayout);

    // create cube
    const cubeParams = await createCube(device, pipelineLayout);

    // create axes 
    const axes = await createAxes(device, pipelineLayout);

    // create a depth texture 
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // create a GPURenderPassDescriptor object
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

    
    // create uniform buffer to camera params
    const cameraBufferSize = 80; // 16*4 + 4 + 4 -> pad to 80
    let cameraBuffers = [];
    // create buffer 
    cameraBuffers[0] = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    let cameraBindGroup = [];
    cameraBindGroup[0] = device.createBindGroup({
        layout: cameraBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraBuffers[0],
                },
            }
        ],
    });
    // create buffer
    cameraBuffers[1] = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    cameraBindGroup[1] = device.createBindGroup({
        layout: cameraBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraBuffers[1],
                },
            }
        ],
    });

    // todo
    let materialsBG = createMaterialsBindGroups(device, materialBindGroupLayout);

    // time step
    let timeStep = 0.0;
    // flag to apply align matrix 
    let applyAlign = 0;

    // Update camera parameters 
    function updateCamera(mode) {

        // set align flag
        if (document.querySelector('#align_cubes').checked) {
            applyAlign = 1;
        }
        else {
            applyAlign = 0;
        }

        // create lookAt matrix
        let lookAtMat = mat4.create();
        let fov = 40 * Math.PI / 180;

        if (mode == 0) {
            const eye = [20, 20, 10];
            const target = [0, 0, 0];
            const up = [0, 0, 1];
            lookAtMat = mat4.lookAt(eye, target, up);
        }
        else {
            let t = 0.0025 * timeStep;
            const cam = computeHelixTNS(t);
            //console.log(cam);
            if (applyAlign == 1) {
                let k = 2.0;
                let E = vec3.subtract(cam.P, vec3.mulScalar(cam.T, k));
                lookAtMat = mat4.lookAt(E, cam.P, cam.N);
                fov = 90 * Math.PI / 180;
            }
            else {
                let E = [0, 0, 0];
                let up = [0, 0, 1];
                // compute true up vector 
                
                lookAtMat = mat4.lookAt(E, cam.P, up);
                fov = 60 * Math.PI / 180;
            }
        }

        // create projection matrix 
        const aspect = canvas.width / canvas.height;
        const projMat = mat4.perspective(
            fov,
            aspect,
            1,
            100.0
        );

        // create modelview-projection matrix
        const mvpMat = mat4.create();
        mat4.multiply(projMat, lookAtMat, mvpMat);

        // write mvp matrix to GPU 
        device.queue.writeBuffer(
            cameraBuffers[mode],
            0,
            mvpMat.buffer,
            mvpMat.byteOffset,
            mvpMat.byteLength
        );

        // write time step to buffer 
        device.queue.writeBuffer(
            cameraBuffers[mode],
            mvpMat.byteLength,
            new Float32Array([timeStep]),
            0,
            1
        );

        // write align flag to buffer 
        device.queue.writeBuffer(
            cameraBuffers[mode],
            mvpMat.byteLength + 4,
            new Int32Array([applyAlign]),
            0,
            1
        );
    }

    // define render function 
    function render() {
        // increment time step
        timeStep += 1;

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Helix encoder' });
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        // ***** First Viewport *****/
        pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        // update camera params for frame
        updateCamera(0);
        // set camera bind group
        pass.setBindGroup(0, cameraBindGroup[0]);

        // ********************
        // draw helix and circle:
        // ********************
        // set vertex buffer
        pass.setVertexBuffer(0, helix.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(helix.pipeline);
        // set material bind group
        pass.setBindGroup(1, materialsBG[0]);
        // draw helix
        pass.draw(helix.countH); 
        // set material bind group
        pass.setBindGroup(1, materialsBG[1]);
        // draw circle 
        pass.draw(helix.countC, 1, helix.countH);
        // ********************
        // draw cube:
        // ********************
        // set vertex buffer
        pass.setVertexBuffer(0, cubeParams.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(cubeParams.pipeline);
        // set bind group
        pass.setBindGroup(1, materialsBG[2]);
        // draw cube 
        pass.draw(cubeParams.count, 7, 0, 0);
        // ********************
        // draw axes:
        // ********************
        // Is checked?
        if (document.querySelector('#show_cube_axes').checked) {
            // set vertex buffer
            pass.setVertexBuffer(0, axes.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(axes.pipeline);
            // set bind group
            pass.setBindGroup(1, materialsBG[3]);
            // draw axes  
            pass.draw(axes.count, 7, 0, 0);
        }

        // ***** Second Viewport *****/
        let x = 2*canvas.width/3;
        let y = 0;
        let w = canvas.width/3;
        let h = canvas.height/3;
        pass.setViewport(x, y, w, h, 0, 1);
        // update camera params for frame
        updateCamera(1);
        // set camera bind group
        pass.setBindGroup(0, cameraBindGroup[1]);

        // ********************
        // draw helix and circle:
        // ********************
        // set vertex buffer
        pass.setVertexBuffer(0, helix.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(helix.pipeline);
        // set material bind group
        pass.setBindGroup(1, materialsBG[0]);
        // draw helix
        pass.draw(helix.countH); 
        // set material bind group
        pass.setBindGroup(1, materialsBG[1]);
        // draw circle 
        pass.draw(helix.countC, 1, helix.countH);
        // ********************
        // draw cube:
        // ********************
        // set vertex buffer
        pass.setVertexBuffer(0, cubeParams.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(cubeParams.pipeline);
        // set bind group
        pass.setBindGroup(1, materialsBG[2]);
        // draw cube 
        pass.draw(cubeParams.count, 7, 0, 0);
        // ********************
        // draw axes:
        // ********************
        // Is checked?
        if (document.querySelector('#show_cube_axes').checked) {
            // set vertex buffer
            pass.setVertexBuffer(0, axes.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(axes.pipeline);
            // set bind group
            pass.setBindGroup(1, materialsBG[3]);
            // draw axes  
            pass.draw(axes.count, 7, 0, 0);
        }

        // end render pass
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