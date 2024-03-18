// ----------------------------------------------------------------------
// skybox.js
// 
// Create render pipeline for the skybox cube.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------


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

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
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
        layout: 'auto'
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    // create uniform buffer to camera params
    const cameraBufferSize = 192; // 16*4 * 3 
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
        count: 36,
        cameraBuffer: cameraBuffer,
        uniformBindGroup: uniformBindGroup,
    };
}
