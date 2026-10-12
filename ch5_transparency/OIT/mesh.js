// ----------------------------------------------------------------------
// mesh.js
// 
// This file has the code to create the geometry and render pipelines
// for OIT.
//
// Author: Mahesh Venkitachalam 
// ----------------------------------------------------------------------

// Create the resources shared by the pipelines:
// one vertex buffer, one camera buffer, and one render-params buffer
export function createSharedResources(device) {

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

    // create uniform buffer for camera params
    const cameraBuffer = device.createBuffer({
        size: 128, // two 4x4 matrices of f32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create uniform buffer for render params:
    // window size (2 x u32) and the pre-multiplied alpha flag (u32)
    const renderParamsBuffer = device.createBuffer({
        size: 16, // struct size, rounded up to its 8-byte alignment
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return {
        vertexBuffer: vertexBuffer,
        vertexBufferLayout: vertexBufferLayout,
        cameraBuffer: cameraBuffer,
        renderParamsBuffer: renderParamsBuffer
    };
}

// fetch shader code and create a shader module
async function createShaderModule(device, url, label) {
    let response = await fetch(url);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    let shader_str = await response.text();    
    return device.createShaderModule({
        label: label,
        code: shader_str,
    });
}

// Create the render pipeline for opaque objects
export async function createOpaquePipeline(device, shared) {

    // create shader module
    const shaderModule = await createShaderModule(device, "opaque.wgsl", 'Opaque shader');

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: shared.vertexBufferLayout
        },
        fragment: {
            module: shaderModule,
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
        layout: 'auto'
    };

    // create render pipeline 
    const pipeline = device.createRenderPipeline(pipelineDescriptor);

    // create bind group using a GPUBindGroupDescriptor
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: shared.cameraBuffer } },
        ],
    });

    return {
        pipeline: pipeline,
        bindGroup: bindGroup
    };
}

// Create the render pipeline for transparent objects: it builds the
// per-pixel linked lists of fragments instead of writing colors
export async function createTransparentPipeline(device, shared, depthTexture, 
                                                headsBuffer, linkedListBuffer) {

    // create shader module
    const shaderModule = await createShaderModule(device, "transparent.wgsl", 'Transparent shader');

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: shared.vertexBufferLayout
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat(),
                writeMask: 0x0, // no fragment shader output
            }],
        },
        primitive: {
            topology: 'triangle-strip',
        },
        layout: 'auto'
    };

    // create render pipeline 
    const pipeline = device.createRenderPipeline(pipelineDescriptor);

    // create bind group using a GPUBindGroupDescriptor
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: shared.cameraBuffer } },
            { binding: 1, resource: { buffer: headsBuffer } },
            { binding: 2, resource: { buffer: linkedListBuffer } },
            { binding: 3, resource: depthTexture.createView({ label: 'depth texture view' }) },
            { binding: 4, resource: { buffer: shared.renderParamsBuffer } },
        ],
    });

    return {
        pipeline: pipeline,
        bindGroup: bindGroup
    };
}

// Create the render pipeline for the final blend pass with a full-screen quad
export async function createBlendPipeline(device, shared, headsBuffer, linkedListBuffer) {

    // create shader module
    const shaderModule = await createShaderModule(device, "blend.wgsl", 'Blend shader');

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat(),
                // composite the (pre-multiplied) result over the opaque scene
                blend: {
                    color: {
                      operation: 'add',
                      srcFactor: 'one',
                      dstFactor: 'one-minus-src-alpha',
                    },
                    alpha: {
                      operation: 'add',
                      srcFactor: 'one',
                      dstFactor: 'one-minus-src-alpha',
                    },
                  },
            }],
        },
        primitive: {
            topology: 'triangle-strip',
        },
        layout: 'auto'
    };

    // create render pipeline 
    const pipeline = device.createRenderPipeline(pipelineDescriptor);

    // create bind group using a GPUBindGroupDescriptor
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: headsBuffer } },
            { binding: 1, resource: { buffer: linkedListBuffer } },
            { binding: 2, resource: { buffer: shared.renderParamsBuffer } },
        ],
    });

    return {
        pipeline: pipeline,
        bindGroup: bindGroup
    };
}
