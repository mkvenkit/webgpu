// ----------------------------------------------------------------------
// mesh.js
// 
// This file has the code to create the geometry and render pipelines.
// 
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

// Create the resources shared by the opaque and transparent pipelines:
// one vertex buffer, one shader module, and one bind group
export async function createSharedResources(device) {

    // define vertices for all three quads
    const vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, r, g, b, a
        // Each quad is made 1 x triangle strip
        
        // opaque quad - red (vertices 0-3)
        -0.25,  -0.5, 0.5, 1, 0, 0, 1, 
        -0.25,  -0.5, -0.5, 1, 0, 0, 1, 
        -0.25,  0.5,  0.5, 1, 0, 0, 1, 
        -0.25,  0.5, -0.5, 1, 0, 0, 1, 
        // transparent quad a - green (vertices 4-7)
        -0.5,  -0.5, 0.5,  0, 1, 0, 0.5, 
        -0.5,  -0.5, -0.5, 0, 1, 0, 0.5, 
         0.5,  0.5,  0.5, 0, 1, 0, 0.5, 
         0.5,  0.5, -0.5,   0, 1, 0, 0.5, 
        // transparent quad b - blue (vertices 8-11)
        0.5,  -0.5, 0.5, 0, 0, 1, 0.5, 
        0.5,  -0.5, -0.5, 0, 0, 1, 0.5, 
        -0.5,  0.5, 0.5, 0, 0, 1, 0.5,
        -0.5,  0.5, -0.5, 0, 0, 1, 0.5, 
    ]);
    
    // create vertex buffer to store the quad vertices 
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
                    format: 'float32x4',
                    offset: 12,
                    shaderLocation: 1
                },
            ],
            arrayStride: 28, // 7 floats x 4 bytes each 
        }
    ];

    // fetch shader code as a string
    let response = await fetch("quad.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    let shader_str = await response.text();    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Quad shader',
        code: shader_str,
    });

    // create uniform buffer for camera params
    const cameraBuffer = device.createBuffer({
        size: 128, // two 4x4 matrices of f32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create uniform buffer for render parameters
    const renderParamsBuffer = device.createBuffer({
        size: 4, // u32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create a bind group layout that all three pipelines share
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                // camera
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' },
            },
            {
                // render parameters
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' },
            },
        ],
    });
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
    });

    // create bind group using a GPUBindGroupDescriptor
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: cameraBuffer } },
            { binding: 1, resource: { buffer: renderParamsBuffer } },
        ],
    });

    return {
        vertexBuffer: vertexBuffer,
        vertexBufferLayout: vertexBufferLayout,
        shaderModule: shaderModule,
        pipelineLayout: pipelineLayout,
        bindGroup: bindGroup,
        cameraBuffer: cameraBuffer,
        renderParamsBuffer: renderParamsBuffer
    };
}

// Create the render pipeline for opaque objects
export function createOpaquePipeline(device, shared) {

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shared.shaderModule,
            entryPoint: 'vertex_main',
            buffers: shared.vertexBufferLayout
        },
        fragment: {
            module: shared.shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat()
            }]
        },
        primitive: {
            topology: 'triangle-strip',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: shared.pipelineLayout
    };

    // create render pipeline 
    return device.createRenderPipeline(pipelineDescriptor);
}

// Create the render pipeline for transparent objects
// (depthWriteEnabled = true is only used to show the artifacts it causes)
export function createTransparentPipeline(device, shared, depthWriteEnabled) {

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shared.shaderModule,
            entryPoint: 'vertex_main',
            buffers: shared.vertexBufferLayout
        },
        fragment: {
            module: shared.shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat(),
                blend: {
                    color: {
                      operation: 'add',
                      srcFactor: 'one',
                      dstFactor: 'one-minus-src-alpha',
                    },
                    alpha: { // default value
                      operation: 'add',
                      srcFactor: 'one',
                      dstFactor: 'zero',
                    },
                  },
            }],
        },
        primitive: {
            topology: 'triangle-strip',
        },
        // Enable depth compare; depth writes are normally disabled
        depthStencil: {
            depthWriteEnabled: depthWriteEnabled,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: shared.pipelineLayout
    };

    // create render pipeline 
    return device.createRenderPipeline(pipelineDescriptor);
}
