// ----------------------------------------------------------------------
// cube.js
// 
// Part of the Toroidal Helix WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

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

// Create render pipeline for cube
export async function createCube(device, pipelineLayout) {
    
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
        layout: pipelineLayout
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    // return pipeline and vertex count 
    const cubeParams = {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/6
    };

    return cubeParams;
}
