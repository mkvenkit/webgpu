// ----------------------------------------------------------------------
// cube.js
// 
// Main JavaScript file for the Cube WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {mat4} from '../common/wgpu-matrix.module.js';

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
        layout: 'auto'
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

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
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    const uniformBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            },
        ],
    });

    // create lookAt matrix
    const eye = [1.1, 1.1, 1.1];
    const target = [0, 0, 0];
    const up = [0, 0, 1];
    const lookAtMat = mat4.lookAt(eye, target, up);

    // create projection matrix 
    const aspect = canvas.width / canvas.height;
    const projMat = mat4.perspective(
        (2 * Math.PI) / 5, // 72 deg FOV
        aspect,
        1,
        100.0
    );
    
    // create modelview-projection matrix
    const mvpMat = mat4.create();
    mat4.multiply(projMat, lookAtMat, mvpMat);

    // write uniform buffer to device 
    device.queue.writeBuffer(
        uniformBuffer,
        0,
        mvpMat.buffer,
        mvpMat.byteOffset,
        mvpMat.byteLength
    );

    // define render function 
    function render() {
        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Cube encoder' });
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        // set the render pipeline
        pass.setPipeline(renderPipeline);
        // set bind group
        pass.setBindGroup(0, uniformBindGroup);
        // set vertex buffer
        pass.setVertexBuffer(0, vertexBuffer);
        // draw
        pass.draw(36); 
        // end render pass
        pass.end();
        // end commands 
        const commandBuffer = encoder.finish();
        // submit to GPU queue
        device.queue.submit([commandBuffer]);
    }

    // call render function 
    render();
}

// call main function 
main();