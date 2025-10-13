// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for the Cubes on a Toroidal Helix WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';

// other imports
import {createCube} from './cube.js';
import { computeHelixTNS, createHelix } from './helix.js';

// Helper function for creating camera bind groups
function createCameraBindGroups(device, cameraBindGroupLayout) {

    // create uniform buffer to camera params
    const cameraBufferSize = 80; // 16*4 + 4 + 4 -> pad to 80
    let cameraBuffers = [];
    // create buffer 
    cameraBuffers[0] = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    let cameraBindGroups = [];
    cameraBindGroups[0] = device.createBindGroup({
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
    cameraBindGroups[1] = device.createBindGroup({
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

    return {
        bindGroups: cameraBindGroups,
        buffers: cameraBuffers
    };
}

// Helper function for creating materials bind groups
function createMaterialsBindGroups(device, materialBindGroupLayout) {

    // materials buffer:
    // color : 4 bytes x 4 
    // flag : 4 bytes
    // total: 16 + 4 = 20 -> 32 with padding

    // define colors 
    let colors = [
        [1, 1, 0, 1], // helix
        [1, 0, 0, 1], // circle 
        [0, 1, 0, 1], // cube 
    ];

    // define shape identifiers
    let shapes = [0, 1, 2];

    let bindGroups = [];
    for (let i = 0; i < 3; i++) {
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
            new Int32Array([shapes[i]]), // flag set 
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
    const cube = await createCube(device, pipelineLayout);

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

    // create camera bind groups
    let cameraBG = createCameraBindGroups(device, cameraBindGroupLayout);
    // create materials bind groups
    let materialsBG = createMaterialsBindGroups(device, materialBindGroupLayout);

    // time step
    let timeStep = 0.0;

    // Update camera parameters 
    // viewportID is the viewport number (0/1)
    function updateCamera(viewportID) {

        // set align flag
        let applyAlign = document.querySelector('#align_cubes').checked ? 1 : 0;

        // lookAt Matrix 
        let lookAtMat = mat4.create();

        // field of view in radians
        let fov = 0;
        // create lookAt matrix
        if (viewportID == 0) {
            const eye = [20, 20, 10];
            const target = [0, 0, 0];
            const up = [0, 0, 1];
            lookAtMat = mat4.lookAt(eye, target, up);
            // set FOV
            fov = 40 * Math.PI / 180;
        }
        else {
            // set time step 
            let t = 0.0025 * timeStep;
            // compute T, N, S alignments parameters 
            const cam = computeHelixTNS(t);
            if (applyAlign == 1) { // align 
                let k = 2.0;
                let E = vec3.subtract(cam.P, vec3.mulScalar(cam.T, k));
                lookAtMat = mat4.lookAt(E, cam.P, cam.N);
                // set FOV
                fov = 90 * Math.PI / 180;
            }
            else { // don't align 
                let E = [0, 0, 0];
                let up = [0, 0, 1];
                // compute true up vector 
                let D = vec3.normalize(cam.P);
                let S = vec3.cross(D, up);
                let U = vec3.cross(S, D);                
                lookAtMat = mat4.lookAt(E, cam.P, U);
                // set FOV
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

        // set buffers and offsets
        let camData = [
            [
                0,
                mvpMat.buffer,
                mvpMat.byteOffset,
                mvpMat.byteLength
            ],
            [
                mvpMat.byteLength,
                new Float32Array([timeStep]),
                0,
                1
            ],
            [
                mvpMat.byteLength + 4,
                new Int32Array([applyAlign]),
                0,
                1
            ]
        ];

        // write to GPU 
        for (let i = 0; i < camData.length; i++) {
            device.queue.writeBuffer(cameraBG.buffers[viewportID], ...camData[i]);
        }
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
        pass.setBindGroup(0, cameraBG.bindGroups[0]);

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
        pass.draw(helix.countH, 1, 0, 0); 
        // set material bind group
        pass.setBindGroup(1, materialsBG[1]);
        // draw circle 
        pass.draw(helix.countC, 1, helix.countH, 0);
        // ********************
        // draw cube:
        // ********************
        // set vertex buffer
        pass.setVertexBuffer(0, cube.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(cube.pipeline);
        // set bind group
        pass.setBindGroup(1, materialsBG[2]);
        // draw cube 
        pass.draw(cube.count, 7, 0, 0);

        // ***** Second Viewport *****/
        let x = 2*canvas.width/3;
        let y = 0;
        let w = canvas.width/3;
        let h = canvas.height/3;
        pass.setViewport(x, y, w, h, 0, 1);
        // update camera params for frame
        updateCamera(1);
        // set camera bind group
        pass.setBindGroup(0, cameraBG.bindGroups[1]);

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
        pass.draw(helix.countH, 1, 0, 0); 
        // set material bind group
        pass.setBindGroup(1, materialsBG[1]);
        // draw circle 
        pass.draw(helix.countC, 1, helix.countH, 0);
        // ********************
        // draw cube:
        // ********************
        // set vertex buffer
        pass.setVertexBuffer(0, cube.vertexBuffer);
        // set the render pipeline
        pass.setPipeline(cube.pipeline);
        // set bind group
        pass.setBindGroup(1, materialsBG[2]);
        // draw cube 
        pass.draw(cube.count, 7, 0, 0);

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