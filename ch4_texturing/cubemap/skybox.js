// ----------------------------------------------------------------------
// skybox.js
// 
// Create a cube.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create cube vertices 
// Assuming unit cube centered at (0, 0, 0)
function createCubeVertices() {
    let vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, nx, ny, nz
        // Each face is made from 2 triangles
        
        // +X
        0.5, -0.5, 0.5, 1, 0, 0,
        0.5, -0.5, -0.5, 1, 0, 0,
        0.5, 0.5, 0.5, 1, 0, 0, 
        0.5, 0.5, 0.5, 1, 0, 0, 
        0.5, -0.5, -0.5, 1, 0, 0, 
        0.5, 0.5, -0.5, 1, 0, 0,
        
        // -X - wrong reflection
        -0.5, 0.5, 0.5, -1, 0, 0,
        -0.5, 0.5, -0.5, -1, 0, 0,
        -0.5, -0.5, 0.5, -1, 0, 0, 
        -0.5, -0.5, 0.5, -1, 0, 0, 
        -0.5, 0.5, -0.5, -1, 0, 0,
        -0.5, -0.5, -0.5, -1, 0, 0,
        

        // +Y
        0.5, 0.5, 0.5, 0, 1, 0,
        0.5, 0.5, -0.5, 0, 1, 0,
        -0.5, 0.5, 0.5, 0, 1, 0,
        -0.5, 0.5, 0.5, 0, 1, 0,
        0.5, 0.5, -0.5, 0, 1, 0,
        -0.5, 0.5, -0.5, 0, 1, 0,
        

        // -Y - wrong reflection
        -0.5, -0.5, 0.5, 0, -1, 0,
        -0.5, -0.5, -0.5, 0, -1, 0,
        0.5, -0.5, 0.5, 0, -1, 0,
        0.5, -0.5, 0.5, 0, -1, 0,
        -0.5, -0.5, -0.5, 0, -1, 0,
        0.5, -0.5, -0.5, 0, -1, 0,
        

        // +Z
        -0.5, 0.5, 0.5, 0, 0, 1,
        -0.5, -0.5, 0.5, 0, 0, 1,
        0.5, 0.5, 0.5, 0, 0, 1,
        0.5, 0.5, 0.5, 0, 0, 1,
        -0.5, -0.5, 0.5, 0, 0, 1,
        0.5, -0.5, 0.5, 0, 0, 1,
        
        // -Z
        0.5, -0.5, -0.5, 0, 0, -1,
        -0.5, -0.5, -0.5, 0, 0, -1,
        0.5, 0.5, -0.5, 0, 0, -1,
        0.5, 0.5, -0.5, 0, 0, -1,
        -0.5, -0.5, -0.5, 0, 0, -1,
        -0.5, 0.5, -0.5, 0, 0, -1,
        
    ]);
    return vertices;
}

// Create render pipeline for axes
export async function createSkybox(device, shaderFile, imageTexture) {
    
    // fetch shader code as a string
    const response = await fetch(shaderFile);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();

    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'skybox shader',
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
                    // normal
                    format: 'float32x3',
                    offset: 12,
                    shaderLocation: 1
                },
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
            //cullMode: 'back',
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

    // create uniform buffer to camera params
    const cameraBufferSize = 288; // 16*4 * 4 + 4*4 + 4 = 276 => 288
    // create buffer 
    let cameraBuffer = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    // bind group entries 
    let bgEntries = [
        {
            binding: 0,
            resource: {
                buffer: cameraBuffer,
            },
        },
        {
            binding: 1,
            resource: sampler,
        },
        {
            binding: 2,
            resource: imageTexture.createView(
                {
                    dimension: "cube",
                }
            ),
        },
    ];

    // create bind group using a GPUBindGroupDescriptor
    let uniformBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: bgEntries,
    });

    // return pipeline, etc.
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/6,
        cameraBuffer: cameraBuffer,
        uniformBindGroup: uniformBindGroup,
    };
}
