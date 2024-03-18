// ----------------------------------------------------------------------
// torus.js
// 
// Creates a torus
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create torus vertices 
function createTorusVertices(r, R) {
    // array to store vertices
    let vert = [];
    // discretize torus
    const NU = 60;
    const NV = 60;
    const du = 2 * Math.PI / NU;
    const dv = 2 * Math.PI / NV;
    let u = 0;
    let v = 0;
    // generate points  
    for (let i = 0; i <= NU; i++) {
        // reset v 
        v = 0;
        // generate torus band 
        for (let j = 0; j <= NV; j++) {
            // compute point 
            let x = (R + r * Math.cos(v)) * Math.cos(u);
            let y = (R + r * Math.cos(v)) * Math.sin(u);
            let z = r * Math.sin(v);
            // compute normal
            let nx = Math.cos(v) * Math.cos(u);
            let ny = Math.cos(v) * Math.sin(u);
            let nz = Math.sin(v);
            // compute texture coordinates
            let uu = u / (2 * Math.PI);
            let vv = v / (2 * Math.PI);      
            // store tangent 
            let tx = -(R + r * Math.cos(v)) * Math.sin(u);
            let ty = (R + r * Math.cos(v)) * Math.cos(u);
            let tz = 0.0;
            // store interlaced values
            vert.push(x, y, z, nx, ny, nz, tx, ty, tz, uu, vv);

            // compute point 
            x = (R + r * Math.cos(v)) * Math.cos(u + du);
            y = (R + r * Math.cos(v)) * Math.sin(u + du);
            z = r * Math.sin(v);
            // compute normal
            nx = Math.cos(v) * Math.cos(u + du);
            ny = Math.cos(v) * Math.sin(u + du);
            nz = Math.sin(v);
            // compute texture coordinates
            uu = (u + du) / (2 * Math.PI);
            // store tangent 
            tx = -(R + r * Math.cos(v)) * Math.sin(u + du);
            ty = (R + r * Math.cos(v)) * Math.cos(u + du);
            tz = 0.0;
            // store interlaced values
            vert.push(x, y, z, nx, ny, nz, tx, ty, tz, uu, vv);

            // incr v
            v += dv;
        }
        // incr u
        u += du;
    }

    let vertices = new Float32Array(vert);
    return vertices;
}

// Create render pipeline for torus
export async function createTorus(r, R, device, shaderFile, 
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
        label: 'Torus shader',
        code: shader_str,
    });

    // get vertices
    const vertices = createTorusVertices(r, R);
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
        addressModeU: 'repeat',
        addressModeV: 'repeat', 
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
                resource: sampler,
            },
            {
                binding: 2,
                resource: texImage.createView(),
            },
            {
                binding: 3,
                resource: texNMap.createView(),
            },
            {
                binding: 4,
                resource: texProj.createView(),
            },
            {
                binding: 5,
                resource: texCubemap.createView(
                    {
                        dimension: "cube",
                    }
                ),
            },
            
        ],
    });

    // return pipeline and vertex count 
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/11,
        cameraBuffer: cameraBuffer,
        uniformBindGroup: uniformBindGroup,
    };
}
