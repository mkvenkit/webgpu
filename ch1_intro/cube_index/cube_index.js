// ----------------------------------------------------------------------
// cube_index.js
// 
// Main JavaScript file for the Indexed Cube WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {mat4} from '../../common/wgpu-matrix.module.js';

// Create 8 vertices for  a cube, with center (0, 0, 0) and side 1.0
function createCubeVertices() {
    let vertices = new Float32Array([
        // V0
        0.5, -0.5, -0.5,
        // V1
        0.5, 0.5, -0.5,
        // V2
        0.5, 0.5, 0.5,
        // V3
        0.5, -0.5, 0.5,
        // V4
        -0.5, -0.5, -0.5,
        // V5
        -0.5, 0.5, -0.5,
        // V6
        -0.5, 0.5, 0.5,
        // V7
        -0.5, -0.5, 0.5
    ]);
    return vertices;
}

// Create index buffer to render cube as Triangle strips
function createCubeIndices() {
    let indices = new Uint32Array([
        3, 0, 1, 3, 1, 2,  // +X
        1, 5, 6, 1, 6, 2,  // +Y
        6, 5, 4, 6, 4, 7,  // -X
        4, 0, 3, 4, 3, 7,  // -Y 
        2, 6, 7, 2, 7, 3,  // +Z
        0, 4, 5, 0, 5, 1   // -Z
    ]);
    return indices;
}

// create an array of colors 
function createCubeColors() {
    let colors = new Float32Array(
        [
            1, 1, 0, // -Z (yellow)
            0, 1, 0, // +Y (green)
            0, 0, 1, // +Z (blue)
            1, 0, 0, // +X (red)
            1, 0, 1, // -Y (magenta)
            0, 0, 0, // N/A
            0, 1, 1, // -X (cyan)
            0, 0, 0  // N/A
        ]
    );
    return colors;
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
    const response = await fetch("cube_index.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();

    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Indexed cube shader',
        code: shader_str,
    });

    // get vertices
    const vertices = createCubeVertices();
    // create vertex buffer to contain vertex data
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy to GPU
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    // get colors
    const colors = createCubeColors();
    // create color buffer 
    const colorBuffer = device.createBuffer({
        size: colors.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy to GPU
    device.queue.writeBuffer(colorBuffer, 0, colors);
    
    // get indices
    const indices = createCubeIndices();
    // create index buffer 
    const indexBuffer = device.createBuffer({
        size: indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    // Copy the index data over to GPU
    device.queue.writeBuffer(indexBuffer, 0, indices);

    // create an array of GPUVertexBufferLayout 
    const vertexBufferLayout = [
        {
            attributes: [{
                // position
                format: 'float32x3',
                offset: 0,
                shaderLocation: 0
            }],
            arrayStride: 12, // 3 floats x 4 bytes each 
        },
        {
            attributes: [{
                // color
                format: 'float32x3',
                offset: 0,
                shaderLocation: 1
            }],
            arrayStride: 12, // 3 floats x 4 bytes each 
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
    const uniformBufferSize = 16 * 4; // 16 elements * 4 byte float
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
        // set vertex buffers
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setVertexBuffer(1, colorBuffer);
        // set index buffer
        pass.setIndexBuffer(indexBuffer, 'uint32');
        // draw
        pass.drawIndexed(indices.length);
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