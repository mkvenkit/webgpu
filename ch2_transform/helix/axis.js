// ----------------------------------------------------------------------
// axis.js
// 
// Part of the Toroidal Helix WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create X/Y/Z axes 
// line primitives 
// x, y, z, r, g, b
function createAxesVertices() {
    let side = 1.5;
    let vertices = new Float32Array([
        // X axis - red 
        0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 
        side, 0.0, 0.0, 1.0, 0.0, 0.0,
        // Y axis - green 
        0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 
        0.0, side, 0.0, 0.0, 1.0, 0.0,
        // Z axis - blue 
        0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 
        0.0, 0.0, side, 0.0, 0.0, 1.0,
    ]);
    return vertices;
}

// Create render pipeline for axes
export async function createAxes(device, pipelineLayout) {
    
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
    const vertices = createAxesVertices();
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
            topology: 'line-list',
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

    // return pipeline, etc.
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/6
    };
}
