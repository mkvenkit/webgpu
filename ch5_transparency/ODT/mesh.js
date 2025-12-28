// ----------------------------------------------------------------------
// mesh.js
// 
// This file has the code to create the geometry and render pipelines.
// 
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

// Create the render pipeline for opaque objects
export async function createOpaquePipeline(device, depthTexture) {

    // define vertices
    const vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, r, g, b, a
        // Each face is made 1 x triangle strip
        
        // Back (-X) Face - red 
        -0.25,  -0.5, 0.5, 1, 0, 0, 1, 
        -0.25,  -0.5, -0.5, 1, 0, 0, 1, 
        -0.25,  0.5,  0.5, 1, 0, 0, 1, 
        -0.25,  0.5, -0.5, 1, 0, 0, 1, 
    ]);
    
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
                    format: 'float32x4',
                    offset: 12,
                    shaderLocation: 1
                },
            ],
            arrayStride: 28, // 7 floats x 4 bytes each 
        }
    ];

    // fetch shader code as a string
    let response = await fetch("opaque.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    let shader_str = await response.text();    
    // create shader module
    const shaderModuleO = device.createShaderModule({
        label: 'Opaque shader',
        code: shader_str,
    });

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptorO = {
        vertex: {
            module: shaderModuleO,
            entryPoint: 'vertex_main',
            buffers: vertexBufferLayout
        },
        fragment: {
            module: shaderModuleO,
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
    const renderPipelineO = device.createRenderPipeline(pipelineDescriptorO);

    // create a GPURenderPassDescriptor object
    const renderPassDescriptorO = {
        colorAttachments: [{
          clearValue:  { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: undefined
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    // create uniform buffer to camera params
    const cameraBufferSize = 128; // 16*4 * 2 = 128 
    // create buffer 
    let cameraBuffer = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // create bind group using a GPUBindGroupDescriptor
    let cameraBindGroup  = device.createBindGroup({
        layout: renderPipelineO.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraBuffer,
                },
            }
        ],
    });

    return {
        pipeline: renderPipelineO,
        vertexBuffer: vertexBuffer,
        count: vertexBuffer/6,
        renderPassDescriptor: renderPassDescriptorO,
        cameraBindGroup: cameraBindGroup,
        cameraBuffer: cameraBuffer
    };
}

// Create the render pipeline for transparent objects
export async function createTransparentPipeline(device, depthTexture) {

    // define vertices
    const vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, r, g, b, a
        // Each face is made 1 x triangle strip
        
        // diag 1 - green
        -0.5,  -0.5, 0.5,  0, 1, 0, 0.5, 
        -0.5,  -0.5, -0.5, 0, 1, 0, 0.5, 
         0.5,  0.5,  0.5, 0, 1, 0, 0.5, 
         0.5,  0.5, -0.5,   0, 1, 0, 0.5, 
        // diag 2 - blue
        0.5,  -0.5, 0.5, 0, 0, 1, 0.5, 
        0.5,  -0.5, -0.5, 0, 0, 1, 0.5, 
        -0.5,  0.5, 0.5, 0, 0, 1, 0.5,
        -0.5,  0.5, -0.5, 0, 0, 1, 0.5, 
    ]);
    
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
                    format: 'float32x4',
                    offset: 12,
                    shaderLocation: 1
                },
            ],
            arrayStride: 28, // 7 floats x 4 bytes each 
        }
    ];

    // fetch shader code as a string
    let response = await fetch("transparent.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    let shader_str = await response.text();    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Transparent shader',
        code: shader_str,
    });

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
                format: navigator.gpu.getPreferredCanvasFormat(),
                blend: {
                    color: {
                      operation: 'add',
                      srcFactor: 'one',
                      dstFactor: 'one-minus-src-alpha',
                    },
                    alpha: { // default value
                      operation: 'add',
                      srcFactor: 'one',
                      dstFactor: 'zero',
                    },
                  },
            }],
        },
        primitive: {
            topology: 'triangle-strip',
        },
        // Enable depth compare but disable depth writes
        depthStencil: {
            depthWriteEnabled: false,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: 'auto'
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    // create a GPURenderPassDescriptor object
    const renderPassDescriptor = {
        colorAttachments: [{
          loadOp: 'load',
          storeOp: 'store',
          view: undefined
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadOp: 'load',
            depthStoreOp: 'store',
        },
    };

    // create uniform buffer to camera params
    const cameraBufferSize = 128; // 16*4 * 2 = 128 
    // create buffer 
    let cameraBuffer = device.createBuffer({
        size: cameraBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create uniform buffer for render parameters
    const renderParamsBuffer = device.createBuffer({
        size: 4, // u32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create bind group using a GPUBindGroupDescriptor
    let cameraBindGroup  = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraBuffer,
                    label: 'camera'
                },
            },
            {
                binding: 1,
                resource: { 
                    buffer: renderParamsBuffer,
                    label: 'render'
                },
            },
        ],
    });

    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        count: vertexBuffer/6,
        renderPassDescriptor: renderPassDescriptor,
        cameraBindGroup: cameraBindGroup,
        cameraBuffer: cameraBuffer,
        renderParamsBuffer: renderParamsBuffer
    };
}