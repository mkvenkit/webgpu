// ----------------------------------------------------------------------
// plane.js
// 
// Create a 2D plane.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// A 2D plane in XY centered at (0, 0, 0)  
// x, y, z, nx, ny, nz, tx, ty, tz, u, v
function createPlaneVertices(side) {
    let vertices = new Float32Array([
        // triangle strip
        -side/2.0,  side/2.0, -0.1, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 
        -side/2.0, -side/2.0, -0.1, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 
         side/2.0,  side/2.0, -0.1, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 
         side/2.0, -side/2.0, -0.1, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 
    ]);
    return vertices;
}

// Create render pipeline for axes
export async function createPlane(side, device, shaderFile, 
    texImage, texNMap, texProj, texCubemap) {
    
    // fetch shader code as a string
    const response = await fetch(shaderFile);
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
                },
                {
                    // tangent
                    format: 'float32x3',
                    offset: 24,
                    shaderLocation: 2
                },
                {
                    // uv
                    format: 'float32x2',
                    offset: 36,
                    shaderLocation: 3
                },
                
            ],
            arrayStride: 44, // 11 floats x 4 bytes each 
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
    const cameraBufferSize = 448; // 16*5 * 5 + 16 + 16 + 4 + 4 + 4 = 444 -> 448
    // create buffer 
    let cameraBuffer = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'repeat',     
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
    ];

    // add textures
    let offset = 2;
    // image 
    if (texImage) {
        bgEntries.push(
            {
                binding: offset,
                resource: texImage.createView(),
            },
        );
        offset++;
    }
    // normal map
    if (texNMap) {
        bgEntries.push(
            {
                binding: offset,
                resource: texNMap.createView(),
            }
        );
        offset++;
    }

    // projected texture
    if (texProj) {
        bgEntries.push(
            {
                binding: offset,
                resource: texProj.createView(),
            }
        );
        offset++;
    }

    // add cubemap if set
    if (texCubemap) {
        bgEntries.push(
            {
                binding: offset,
                resource: texCubemap.createView(
                    {
                        dimension: "cube",
                    }
                ),
            }
        );
        offset++;
    }

    // create bind group using a GPUBindGroupDescriptor
    let uniformBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: bgEntries,
    });

    // return pipeline, etc.
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/11,
        cameraBuffer: cameraBuffer,
        uniformBindGroup: uniformBindGroup,
    };
}
