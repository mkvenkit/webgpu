// ----------------------------------------------------------------------
// plane.js
// 
// Create a 2D plane.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// A 2D plane in XY centered at (0, 0, 0)  
// x, y, z, nx, ny, nz
function createPlaneVertices(side) {
    let vertices = new Float32Array([
        // triangle strip
        -side/2.0,  side/2.0, -0.1, 0.0, 0.0, 1.0,
        -side/2.0, -side/2.0, -0.1, 0.0, 0.0, 1.0,
         side/2.0,  side/2.0, -0.1, 0.0, 0.0, 1.0,
         side/2.0, -side/2.0, -0.1, 0.0, 0.0, 1.0,
    ]);
    return vertices;
}

// Create render pipeline for axes
export async function createPlane(side, device) {
    
    // fetch shader code as a string
    const response = await fetch("phong.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();

    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Plane shader',
        code: shader_str,
    });

    // get vertices
    const vertices = createPlaneVertices(side);
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
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    // create uniform buffer to camera params
    const cameraBufferSize = 272; // 16*4 * 4 + 4 = 260 -> 272
    // create buffer 
    let cameraBuffer = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create uniform buffer for lighting params
    const lightingBufferSize = 96; // 16*4
    // create buffer 
    let lightingBuffer = device.createBuffer({
        size: lightingBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create bind group using a GPUBindGroupDescriptor
    let uniformBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraBuffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: lightingBuffer,
                },
            }
        ],
    });

    // return pipeline, etc.
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/6,
        cameraBuffer: cameraBuffer,
        lightingBuffer: lightingBuffer,
        uniformBindGroup: uniformBindGroup,
    };
}
