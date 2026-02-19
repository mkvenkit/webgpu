// ----------------------------------------------------------------------
// raycube.js
// 
// Create render pipelines for ray exit and ray casting shaders.
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

// Utility function to create and upload buffer to GPU
function createAndUploadBuffer(device, data, usage) 
{
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usage | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
}

// Update transfer function uniforms 
export function updateTFUniforms(device, tfUniformBuffer, tfParams) {
    // 12 floats = 48 bytes
    const uniformData = new Float32Array([
        // params vec4
        tfParams.windowCenter,
        tfParams.windowWidth,  
        tfParams.exponent,
        tfParams.alphaScale,
        // lowColor vec4 
        ...tfParams.lowColor,
        tfParams.enable ? 1.0 : 0.0, // w component used as bool
        // highColor vec4
        ...tfParams.highColor,
        0.0                     //  w component padding
    ]);
    // write to GPU
    device.queue.writeBuffer(tfUniformBuffer, 0, uniformData);
}

// Utility function to update canvas dimensions to shader
export function updateCanvasDims(device, buffer, width, height) {
    // 4 uints = 16 bytes
    const uniformData = new Uint32Array([
        width,
        height,
        0,      // padding
        0       // padding 
    ]);
    // write to GPU
    device.queue.writeBuffer(buffer, 0, uniformData);
}

// Utility function to create pipeline + bind group
async function createPipelineWithBindGroup(
    {
        device,
        shaderURL,
        label,
        vertexBufferLayout,
        cullMode,
        bindGroupEntries
    }) 
{
    const response = await fetch(shaderURL);
    const shader_str = await response.text();

    const shaderModule = device.createShaderModule({
        label,
        code: shader_str,
    });

    const pipelineDescriptor = {
        label,
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: vertexBufferLayout,
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat(),
            }],
        },
        primitive: {
            topology: 'triangle-list',
            cullMode,
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: 'auto',
    };

    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    const uniformBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: bindGroupEntries,
    });

    return { renderPipeline, uniformBindGroup };
}


// create ray exit pipeline
async function createRayExitPipeline(
    {
        device,
        vertexBufferLayout, 
        mvpMatUniformBuffer
    }
) {
    const bindGroupEntries = [
        {
            binding: 0,
            resource: { buffer: mvpMatUniformBuffer },
        },
    ];

    const { renderPipeline, uniformBindGroup } = await createPipelineWithBindGroup({
        device,
        shaderURL: "ray_exit.wgsl",
        label: "Ray exit pipeline",
        vertexBufferLayout,
        cullMode: "front",
        bindGroupEntries
    });

    return {
        pipelineRE: renderPipeline,
        uniformBindGroupRE: uniformBindGroup
    };
}

// create ray casting pipeline
async function createRayCastPipeline(
    {
        device, 
        vertexBufferLayout, 
        rayExitTexture, 
        volumeTexture, 
        mvpMatUniformBuffer
    }
) {
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    // create uniform buffer to hold tfparams
    const tfUniformBuffer = device.createBuffer({
        size: 48, // bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }); 

    // create a uniform buffer to hold canvas dims
    const canvasDimsUniformBuffer = device.createBuffer({
        size: 16, // bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }); 

    const bindGroupEntries = [
        {
            binding: 0,
            resource: { buffer: mvpMatUniformBuffer },
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
            resource: volumeTexture.createView({ dimension: "3d" }),
        },
        {
            binding: 4,
            resource: { buffer: tfUniformBuffer },
        },
        {
            binding: 5,
            resource: { buffer: canvasDimsUniformBuffer },
        },
    ];

    const { renderPipeline, uniformBindGroup } = await createPipelineWithBindGroup({
        device,
        shaderURL: "ray_cast.wgsl",
        label: "Ray cast pipeline",
        vertexBufferLayout,
        cullMode: "back",
        bindGroupEntries
    });

    return {
        pipelineRC: renderPipeline,
        uniformBindGroupRC: uniformBindGroup,
        tfUniformBuffer: tfUniformBuffer,
        canvasDimsUniformBuffer: canvasDimsUniformBuffer
    };
}

// create cube 
export async function createCube(device, rayExitTexture, volumeTexture)
{
    // get vertices
    const vertexInfo = createCubeVertices();

    // create vertex buffer to contain vertex data
    const vertexBuffer = createAndUploadBuffer(device, vertexInfo.vertices, GPUBufferUsage.VERTEX);
    // create index buffer
    const indexBuffer = createAndUploadBuffer(device, vertexInfo.indices, GPUBufferUsage.INDEX);

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
    const mvpMatUniformBuffer = device.createBuffer({
        size: 16 * 4, // 16 elements * 4 byte float,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const {pipelineRC, uniformBindGroupRC, tfUniformBuffer, canvasDimsUniformBuffer} = 
        await createRayCastPipeline(
            {device, vertexBufferLayout, rayExitTexture, volumeTexture, mvpMatUniformBuffer}
        );

    const {pipelineRE, uniformBindGroupRE}  = 
        await createRayExitPipeline(
            {device, vertexBufferLayout, mvpMatUniformBuffer}
        );
    

    return {
        pipelineRC, uniformBindGroupRC,
        pipelineRE, uniformBindGroupRE,
        vertexBuffer, 
        indexBuffer,
        nIndices,
        mvpMatUniformBuffer,
        tfUniformBuffer,    
        canvasDimsUniformBuffer
    }
}
