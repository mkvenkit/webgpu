// ----------------------------------------------------------------------
// cube.js
// 
// Main JavaScript file for the Cube WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {mat4} from '../../common/wgpu-matrix.module.js';
import { createAxes } from './axis.js';

// Create cube vertices 
// Assuming unit cube centered at (0, 0, 0)
function createCubeVertices() {
    let vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, r, g, b,... 
        // Each face is made from 2 triangles
        
        // +X Face - red 
         0.5, -0.5,  0.5, 1, 0, 0,
         0.5, -0.5, -0.5, 1, 0, 0,
         0.5,  0.5, -0.5, 1, 0, 0,
         0.5, -0.5,  0.5, 1, 0, 0,
         0.5,  0.5, -0.5, 1, 0, 0,
         0.5,  0.5,  0.5, 1, 0, 0,
        // -X Face - cyan
        -0.5,  0.5,  0.5, 0, 1, 1,
        -0.5,  0.5, -0.5, 0, 1, 1,
        -0.5, -0.5, -0.5, 0, 1, 1,
        -0.5,  0.5,  0.5, 0, 1, 1,
        -0.5, -0.5, -0.5, 0, 1, 1,
        -0.5, -0.5,  0.5, 0, 1, 1,        
        // + Y Face - green 
         0.5,  0.5, -0.5, 0, 1, 0,
        -0.5,  0.5, -0.5, 0, 1, 0,
        -0.5,  0.5,  0.5, 0, 1, 0,
         0.5,  0.5, -0.5, 0, 1, 0,
        -0.5,  0.5,  0.5, 0, 1, 0,
         0.5,  0.5,  0.5, 0, 1, 0,
        // -Y Face - magenta
        -0.5, -0.5, -0.5, 1, 0, 1,
         0.5, -0.5, -0.5, 1, 0, 1,
         0.5, -0.5,  0.5, 1, 0, 1,
        -0.5, -0.5, -0.5, 1, 0, 1,
         0.5, -0.5,  0.5, 1, 0, 1,
        -0.5, -0.5,  0.5, 1, 0, 1,
        // +Z Face - blue
         0.5,  0.5,  0.5, 0, 0, 1,
        -0.5,  0.5,  0.5, 0, 0, 1,
        -0.5, -0.5,  0.5, 0, 0, 1,
         0.5,  0.5,  0.5, 0, 0, 1,
        -0.5, -0.5,  0.5, 0, 0, 1,
         0.5, -0.5,  0.5, 0, 0, 1,
        // -Z Face - yellow
         0.5, -0.5, -0.5, 1, 1, 0,
        -0.5, -0.5, -0.5, 1, 1, 0,
        -0.5,  0.5, -0.5, 1, 1, 0,
         0.5, -0.5, -0.5, 1, 1, 0,
        -0.5,  0.5, -0.5, 1, 1, 0,
         0.5,  0.5, -0.5, 1, 1, 0
    ]);
    return vertices;
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

    // fetch shader code as a string
    const response = await fetch("cube.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Cube shader',
        code: shader_str,
    });

    // create camera parameters bind group 
    const cameraBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0, // mpvMat
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        }]
    });    
    // create render pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            cameraBindGroupLayout, // @group(0)
        ]
    });

    // get vertices
    const vertices = createCubeVertices();
    // create vertex buffer to store cube vertices 
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy vertex data to GPU
    device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

    // create a GPUVertexBufferLayout object
    const vertexBufferLayout = [
        {
            attributes: [
                {
                    // position 
                    format: 'float32x3',
                    offset: 0,
                    shaderLocation: 0
                },
                {
                    // color
                    format: 'float32x3',
                    offset: 12,
                    shaderLocation: 1
                }
            ],
            arrayStride: 24, // 6 floats x 4 bytes each 
        }
    ];

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: vertexBufferLayout
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat()
            }]
        },
        primitive: {
            topology: 'triangle-list',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: pipelineLayout
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    // create cube axes 
    const axes_cube = await createAxes(device, pipelineLayout, 1.0);

    // create static axes
    const axes = await createAxes(device, pipelineLayout, 1.5);

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

    
    // create uniform buffer to hold 4 x 4 MVP matrix
    const uniformBufferSize = 64; // 16 elements * 4 byte float
    const uniformBuffer1 = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    const uniformBindGroup1 = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer1,
                },
            },
        ],
    });

    // second 
    const uniformBuffer2 = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    const uniformBindGroup2 = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer2,
                },
            },
        ],
    });

    let Rx = 0.0;
    let Ry = 0.0;
    let Rz = 0.0;
    let btn_clr = document.querySelector('#btn_clr');
    btn_clr.addEventListener("click", () => {
        document.querySelector('#rx_slider').value = 0;
        document.querySelector('#ry_slider').value = 0;
        document.querySelector('#rz_slider').value = 0;
        document.querySelector("#rx_label").innerHTML = "0";
        document.querySelector("#ry_label").innerHTML = "0";
        document.querySelector("#rz_label").innerHTML = "0";
        Rx = Ry = Rz = 0.0;
        }
    );

    const rx_slider = document.querySelector("#rx_slider");
    rx_slider.addEventListener("input", (event) => {
        Rx = rx_slider.value;
        document.querySelector("#rx_label").innerHTML = rx_slider.value;
    }
    );

    const ry_slider = document.querySelector("#ry_slider");
    ry_slider.addEventListener("input", (event) => {
        Ry = ry_slider.value;
        document.querySelector("#ry_label").innerHTML = ry_slider.value;
    }
    );

    const rz_slider = document.querySelector("#rz_slider");
    rz_slider.addEventListener("input", (event) => {
        Rz = rz_slider.value;
        document.querySelector("#rz_label").innerHTML = rz_slider.value;
    }
    );


    // Create and return modelview-projection matrix
    function setMVPMatrix() {
        // create projection matrix 
        const aspect = canvas.width / canvas.height;
        const projMat = mat4.perspective(
            (2 * Math.PI) / 5, // FOV
            aspect,
            1,
            100.0
        );

        // create lookAt matrix
        const eye = [1.1, 1.1, 1.1];
        const target = [0, 0, 0];
        const up = [0, 0, 1];
        let lookAtMat = mat4.lookAt(eye, target, up);

        // set Euler rotation 
        // Order: Rz * Ry * Rx * Pt
        const deg2rad = Math.PI/180.0;
        let rMat = mat4.identity();
        mat4.rotateX(rMat, deg2rad * Rx, rMat);        
        mat4.rotateY(rMat, deg2rad* Ry, rMat);
        mat4.rotateZ(rMat, deg2rad* Rz, rMat);
        mat4.mul(lookAtMat, rMat, lookAtMat);

        // create modelview-projection matrix
        let mvpMat = mat4.create();
        mat4.multiply(projMat, lookAtMat, mvpMat);

        // write uniform buffer to device 
        device.queue.writeBuffer(
            uniformBuffer1,
            0,
            mvpMat.buffer,
            mvpMat.byteOffset,
            mvpMat.byteLength
        );

        // unrotated matrix 
        lookAtMat = mat4.lookAt(eye, target, up);
        // create modelview-projection matrix
        mvpMat = mat4.create();
        mat4.multiply(projMat, lookAtMat, mvpMat);
        // write uniform buffer to device 
        device.queue.writeBuffer(
            uniformBuffer2,
            0,
            mvpMat.buffer,
            mvpMat.byteOffset,
            mvpMat.byteLength
        );
    }

    // define render function 
    function render() {
        // set matrices
        setMVPMatrix();

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Cube encoder' });
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        // ********************
        //  draw cube
        // ********************
        // set the render pipeline
        pass.setPipeline(renderPipeline);
        // set bind group
        pass.setBindGroup(0, uniformBindGroup1);
        // set vertex buffer
        pass.setVertexBuffer(0, vertexBuffer);
        // draw
        pass.draw(36, 5); 
        // ********************
        //  draw cube axes
        // ********************
        // set the render pipeline
        pass.setPipeline(axes_cube.pipeline);
        // set vertex buffer
        pass.setVertexBuffer(0, axes_cube.vertexBuffer);
        // draw
        pass.draw(axes_cube.count); 

        // ********************
        //  draw static cube axes
        // ********************
        // set the render pipeline
        pass.setPipeline(axes.pipeline);
        // set bind group
        pass.setBindGroup(0, uniformBindGroup2);
        // set vertex buffer
        pass.setVertexBuffer(0, axes.vertexBuffer);
        // draw
        pass.draw(axes.count); 

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