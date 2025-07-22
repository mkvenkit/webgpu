// ----------------------------------------------------------------------
// raycube.js
// 
// Create render pipelines for ray cubes.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create cube vertices 
// Assuming unit cube centered at origin
function createCubeVertices() {
    let vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, r, g, b,... 
        // Each face is made from 2 triangles
        -0.5, -0.5, -0.5, 0.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 1.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.5, 1.0, 0.0, 1.0,
        0.5, 0.5, 0.5, 1.0, 1.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 1.0, 1.0 
    ]);

    // index buffer 
    let indices = new Uint32Array([
        3, 0, 1, 3, 1, 2,  // +X
        1, 5, 6, 1, 6, 2,  // +Y
        6, 5, 4, 6, 4, 7,  // -X
        4, 0, 3, 4, 3, 7,  // -Y 
        2, 6, 7, 2, 7, 3,  // +Z
        0, 4, 5, 0, 5, 1   // -Z
    ]);

    return {vertices, indices};
}

// create cube 
export async function createCube(device, rayExitTexture, volumeTexture)
{
    // get vertices
    const vertexInfo = createCubeVertices();
    // create vertex buffer to contain vertex data
    const vertexBuffer = device.createBuffer({
        size: vertexInfo.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
    device.queue.writeBuffer(vertexBuffer, 0, vertexInfo.vertices);

    // create index buffer
    const indexBuffer = device.createBuffer({
        size: vertexInfo.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    // Copy the index data over to GPU
    device.queue.writeBuffer(indexBuffer, 0, vertexInfo.indices);
    // store length
    let nIndices = vertexInfo.indices.length;

    // create a GPUVertexBufferLayout dict
    const vertexBufferLayout = [
        {
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
        }
    ];

    // create uniform buffer to hold 4 x 4 MVP matrix
    const uniformBufferSize = 16 * 4; // 16 elements * 4 byte float
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const {pipelineRC, uniformBindGroupRC} = 
        await createRayCastPipeline(device, vertexBufferLayout, rayExitTexture, volumeTexture, uniformBuffer);

    const {pipelineRE, uniformBindGroupRE}  = 
        await createRayExitPipeline(device, vertexBufferLayout, uniformBuffer);
    

    return {
        pipelineRC, uniformBindGroupRC,
        pipelineRE, uniformBindGroupRE,
        vertexBuffer, 
        indexBuffer,
        nIndices,
        uniformBuffer
    }
}

// create ray cast pipeline
async function createRayCastPipeline(device, vertexBufferLayout, rayExitTexture, volumeTexture, uniformBuffer) {

    // fetch shader code as a string
    const response = await fetch("ray_cast.wgsl");
    const shader_str = await response.text();
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Ray cast shader',
        code: shader_str,
    });

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
            topology: 'triangle-list',
            cullMode: 'back',
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

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
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
            {
                binding: 1,
                resource: sampler, 
            },
            {
                binding: 2,
                resource: rayExitTexture.createView(),
            },
            {
                binding: 3,
                resource: volumeTexture.createView(
                    {
                        dimension: "3d"
                    }
                ),
            },
        ],
    });

    return {pipelineRC: renderPipeline, uniformBindGroupRC: uniformBindGroup};

}

// create ray exit pipeline
async function createRayExitPipeline(device, vertexBufferLayout, uniformBuffer) {

    // fetch shader code as a string
    const response = await fetch("ray_exit.wgsl");
    const shader_str = await response.text();
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Ray exit shader',
        code: shader_str,
    });

    // create a GPURenderPipelineDescriptor dict
    const pipelineDescriptor = {
        label: 'ray exit',
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
            cullMode: 'front',
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

    return {pipelineRE: renderPipeline, uniformBindGroupRE: uniformBindGroup};

}