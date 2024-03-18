// ----------------------------------------------------------------------
// frustum.js
// 
// Draws a frustum.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create frustum vertices 
// Assuming frustum oriented with eye at origin, pointing to -Z, up vector is +Y.
// thetaV is in degrees 
function createFrustumVertices(thetaV, aspect, near, far) {
    // define colors
    let black = [0, 0, 0];
    let cyan = [0, 1, 1];
    let magenta = [1, 0, 1];
    // origin 
    let O = [0, 0, 0];
    // near plane
    let t1 = near * Math.tan(0.5 * thetaV * Math.PI/180.0);
    let r1 = aspect * t1;
    let A = [r1, t1, -near];
    let B = [-r1, t1, -near];
    let C = [-r1, -t1, -near];
    let D = [r1, -t1, -near];
    // far plane 
    let t2 = far * Math.tan(0.5* thetaV * Math.PI/180.0);
    let r2 = aspect * t2;
    let E = [r2, t2, -far];
    let F = [-r2, t2, -far];
    let G = [-r2, -t2, -far];
    let H = [r2, -t2, -far];

    // empy array 
    let vert = [];

    // add lines from origin to near plane
    vert.push(...O, ...black);
    vert.push(...A, ...black);
    vert.push(...O, ...black);
    vert.push(...B, ...black);
    vert.push(...O, ...black);
    vert.push(...C, ...black);
    vert.push(...O, ...black);
    vert.push(...D, ...black);

    // add lines from near plane to far plane
    vert.push(...A, ...black);
    vert.push(...E, ...black);
    vert.push(...B, ...black);
    vert.push(...F, ...black);
    vert.push(...C, ...black);
    vert.push(...G, ...black);
    vert.push(...D, ...black);
    vert.push(...H, ...black);

    // add near plane 
    vert.push(...A, ...cyan);
    vert.push(...B, ...cyan);
    vert.push(...B, ...cyan);
    vert.push(...C, ...cyan);
    vert.push(...C, ...cyan);
    vert.push(...D, ...cyan);
    vert.push(...D, ...cyan);
    vert.push(...A,  ...cyan);

    // add far plane
    vert.push(...E, ...magenta);
    vert.push(...F, ...magenta);
    vert.push(...F, ...magenta);
    vert.push(...G, ...magenta);
    vert.push(...G, ...magenta);
    vert.push(...H, ...magenta);
    vert.push(...H, ...magenta);
    vert.push(...E, ...magenta);

    // create float array 
    let vertices = new Float32Array(vert);
    return vertices;
}

// Create render pipeline for cube
export async function createFrustum(frustumParams, device, pipelineLayout) {
    
    // fetch shader code as a string
    const response = await fetch("frustum.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Frustum shader',
        code: shader_str,
    });

    // get vertices
    let thetaV = frustumParams.fov;
    let aspect = frustumParams.aspect;
    let near = frustumParams.near;
    let far = frustumParams.far;
    const vertices = createFrustumVertices(thetaV, aspect, near, far);

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

    // create uniform buffer to camera params
    const cameraBufferSize = 192; // 16*4 * 3  = 192 
    // create buffer 
    let cameraBuffer = device.createBuffer({
        size: cameraBufferSize,
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
        ],
    });

    // return pipeline and vertex count 
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertices.length/6,
        cameraBuffer: cameraBuffer,
        uniformBindGroup: uniformBindGroup
    };
}
