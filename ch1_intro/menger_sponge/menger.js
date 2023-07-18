// ----------------------------------------------------------------------
// menger.js
// 
// Main JavaScript file for the Menger sponge WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';

// *****************************************************************************
// Create vertices for 6 faces of a cube, given the center and the side length
// The ordering of vertices is as follows:
// Each face is a triangle strip 
// 6 faces = 6 triangle strips make up a cube
//
// center : [x, y, z] Number
// side : Number
// *****************************************************************************
function createCube(center, side, vertices) {
    let a = side / 2.0;  // half side

    // +X face - red 
    // 301
    vertices.push(center[0] + a, center[1] - a, center[2] + a);
    vertices.push(1, 0, 0);
    vertices.push(center[0] + a, center[1] - a, center[2] - a);
    vertices.push(1, 0, 0);
    vertices.push(center[0] + a, center[1] + a, center[2] - a);
    vertices.push(1, 0, 0);

    // 312
    vertices.push(center[0] + a, center[1] - a, center[2] + a);
    vertices.push(1, 0, 0);
    vertices.push(center[0] + a, center[1] + a, center[2] - a);
    vertices.push(1, 0, 0);
    vertices.push(center[0] + a, center[1] + a, center[2] + a);
    vertices.push(1, 0, 0);

    // -X face - cyan
    // 654
    vertices.push(center[0] - a, center[1] + a, center[2] + a);
    vertices.push(0, 1, 1);
    vertices.push(center[0] - a, center[1] + a, center[2] - a);
    vertices.push(0, 1, 1);
    vertices.push(center[0] - a, center[1] - a, center[2] - a);
    vertices.push(0, 1, 1);
    // 647
    vertices.push(center[0] - a, center[1] + a, center[2] + a);
    vertices.push(0, 1, 1);
    vertices.push(center[0] - a, center[1] - a, center[2] - a);
    vertices.push(0, 1, 1);
    vertices.push(center[0] - a, center[1] - a, center[2] + a);
    vertices.push(0, 1, 1);

    // +Y face - green
    // 156
    vertices.push(center[0] + a, center[1] + a, center[2] - a);
    vertices.push(0, 1, 0);
    vertices.push(center[0] - a, center[1] + a, center[2] - a);
    vertices.push(0, 1, 0);
    vertices.push(center[0] - a, center[1] + a, center[2] + a);
    vertices.push(0, 1, 0);
    // 162
    vertices.push(center[0] + a, center[1] + a, center[2] - a);
    vertices.push(0, 1, 0);
    vertices.push(center[0] - a, center[1] + a, center[2] + a);
    vertices.push(0, 1, 0);
    vertices.push(center[0] + a, center[1] + a, center[2] + a);
    vertices.push(0, 1, 0);

    // -Y face - magenta
    // 403
    vertices.push(center[0] - a, center[1] - a, center[2] - a);
    vertices.push(1, 0, 1);
    vertices.push(center[0] + a, center[1] - a, center[2] - a);
    vertices.push(1, 0, 1);
    vertices.push(center[0] + a, center[1] - a, center[2] + a);
    vertices.push(1, 0, 1);
    // 437
    vertices.push(center[0] - a, center[1] - a, center[2] - a);
    vertices.push(1, 0, 1);
    vertices.push(center[0] + a, center[1] - a, center[2] + a);
    vertices.push(1, 0, 1);
    vertices.push(center[0] - a, center[1] - a, center[2] + a);
    vertices.push(1, 0, 1);
    
    // + Z face - blue
    // 267
    vertices.push(center[0] + a, center[1] + a, center[2] + a);
    vertices.push(0, 0, 1);
    vertices.push(center[0] - a, center[1] + a, center[2] + a);
    vertices.push(0, 0, 1);
    vertices.push(center[0] - a, center[1] - a, center[2] + a);
    vertices.push(0, 0, 1);
    // 273
    vertices.push(center[0] + a, center[1] + a, center[2] + a);
    vertices.push(0, 0, 1);
    vertices.push(center[0] - a, center[1] - a, center[2] + a);
    vertices.push(0, 0, 1);
    vertices.push(center[0] + a, center[1] - a, center[2] + a);
    vertices.push(0, 0, 1);

    // -Z face - yellow
    // 045
    vertices.push(center[0] + a, center[1] - a, center[2] - a);
    vertices.push(1, 1, 0);
    vertices.push(center[0] - a, center[1] - a, center[2] - a);
    vertices.push(1, 1, 0);
    vertices.push(center[0] - a, center[1] + a, center[2] - a);
    vertices.push(1, 1, 0);
    // 051
    vertices.push(center[0] + a, center[1] - a, center[2] - a);
    vertices.push(1, 1, 0);
    vertices.push(center[0] - a, center[1] + a, center[2] - a);
    vertices.push(1, 1, 0);
    vertices.push(center[0] + a, center[1] + a, center[2] - a);
    vertices.push(1, 1, 0);
}

// Recursive function to compute Menger Sponge vertices
function createMengerSponge(L, center, side, vertices) {
    // base case 
    if (L == 0) {
        // create a cube 
        createCube(center, side, vertices);
    }
    else {
        // side of each smaller cube is side/3
        let s = side / 3.0;
        // define the 20 cube centers
        let centers = [
            // ----MIDDLE ROW ----
            [center[0] + s, center[1] + s, center[2]], // c0
            [center[0] + s, center[1] - s, center[2]],
            [center[0] - s, center[1] + s, center[2]],
            [center[0] - s, center[1] - s, center[2]],
            // ----TOP ROW ----
            // corner cubes
            [center[0] + s, center[1] + s, center[2] + s], // c4
            [center[0] + s, center[1] - s, center[2] + s],
            [center[0] - s, center[1] + s, center[2] + s],
            [center[0] - s, center[1] - s, center[2] + s],
            // center cubes
            [center[0] + s, center[1], center[2] + s],
            [center[0] - s, center[1], center[2] + s],
            [center[0], center[1] + s, center[2] + s],
            [center[0], center[1] - s, center[2] + s],
            // ----BOTTOM ROW ----
            // corner cubes
            [center[0] + s, center[1] + s, center[2] - s],
            [center[0] + s, center[1] - s, center[2] - s],
            [center[0] - s, center[1] + s, center[2] - s],
            [center[0] - s, center[1] - s, center[2] - s],
            // center cubes
            [center[0] + s, center[1], center[2] - s], // c15
            [center[0] - s, center[1], center[2] - s],
            [center[0], center[1] + s, center[2] - s],
            [center[0], center[1] - s, center[2] - s]  // c19
        ];

        // Apply recursive function on the cubes
        for (let i = 0; i < centers.length; i++) {
            // get center of cube
            const center = centers[i];
            // make menger sponge
            createMengerSponge(L-1, center, s, vertices);            
        }
    }
}

// Create Menger Sponge vertices 
// Assuming unit cube centered at (0, 0, 0)
function createMengerSpongeVertices(L) {
    let vert = [];
    createMengerSponge(L, [0, 0, 0], 1.0, vert);
    let vertices = new Float32Array(vert);
    console.log(`L = ${L}, nVert = ${vertices.length/6}`);
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

    // Get a WebGPU context from the canvas and configure it
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    // fetch shader code as a string
    const response = await fetch("menger.wgsl");
    const shader_str = await response.text();
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Menger Sponge shader',
        code: shader_str,
    });

    // A function to create vertex buffer 
    function createVertexBuffer(level) {
        // timing test
        let start = Date.now();
        // get vertices
        const vertices = createMengerSpongeVertices(level);
        // timing test
        let delta = Date.now() - start;
        console.log(`t = ${delta} ms`);

        // create vertex buffer to contain vertex data
        let vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
        device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

        // returns number of vertices
        return vertexBuffer;
    }

    // create vertex buffer
    let currLevel = 0;
    let vertexBuffer = createVertexBuffer(currLevel);
    let nVertices = vertexBuffer.size / 24; // 6 x 4 bytes each 

    // create a GPUVertexBufferLayout dict
    const vertexBufferLayout = [{
        attributes: [
        {
            shaderLocation: 0, // position
            offset: 0,
            format: 'float32x3'
        },
        {
            shaderLocation: 1, // color
            offset: 12,
            format: 'float32x3'
        }
        ],
        arrayStride: 6 * 4, // 6 floats, 4 bytes each 
    }];

    // create a GPURenderPipelineDescriptor dict
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
            topology: 'triangle-list'
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

    // create a depth texture 
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
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

    // current time 
    let now = 0;

    // Create and return modelview-projection matrix
    function getMVPMatrix() {
        
        // create projection matrix 
        const aspect = canvas.width / canvas.height;
        const projMat = mat4.perspective(
            (2 * Math.PI) / 5, // FOV
            aspect,
            1,
            100.0
        );

        // create lookAt matrix
        const eye = [-1.1, -1.1, 1.1];
        const target = [0, 0, 0];
        const up = [0, 0, 1];
        const lookAtMat = mat4.lookAt(eye, target, up);

        // Is rotate checked?
        if (document.querySelector('#rotate').checked) {
            // update time 
            now = Date.now() / 2000;
        }
        // rotate 
        mat4.rotate(
            lookAtMat,                  // source
            vec3.fromValues(0, 0, 1),   // axis 
            now,                        // angle
            lookAtMat                   // destination
        );
        // create modelview-projection matrix
        const mvpMat = mat4.create();
        mat4.multiply(projMat, lookAtMat, mvpMat);
        
        // return matrix 
        return mvpMat;
    }

    // create a GPURenderPassDescriptor dict
    const renderPassDescriptor = {
        colorAttachments: [{
          clearValue:  { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
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

    // render the Menger sponge
    function render() {
        // get selected level 
        let e = document.getElementById("levels");
        let level = parseInt(e.value);
        // if level has changed, re-create vertex buffer
        if (level != currLevel) {
            console.log("recreating vertex buffers...")
            // update level 
            currLevel = level;
            // create vertex buffer
            vertexBuffer = createVertexBuffer(currLevel);
            nVertices = vertexBuffer.size / 24; // 6 x 4 bytes each 
        }

        // get MVP matrix
        const mvpMat = getMVPMatrix();
        // write uniform buffer to device 
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            mvpMat.buffer,
            mvpMat.byteOffset,
            mvpMat.byteLength
        );

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Menger sponge encoder' });

        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, uniformBindGroup);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(nVertices);  
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        // request animation
        requestAnimationFrame(render);
    }

    // request animation
    requestAnimationFrame(render);
}

// call main 
main();