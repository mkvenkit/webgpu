// ----------------------------------------------------------------------
// shadow.js
// 
// Create render pipeline for shadow map.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// create show map creation render pipeline
export async function createShadowMap(device, vertexBufferLayout, modelParamsBGL, smTexture) {

    // fetch shader code as a string
    let response = await fetch("shadow.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    let shader_str = await response.text();
    
    // create shader module
    const shadowShaderModule = device.createShaderModule({
        label: 'shadow shader',
        code: shader_str,
    });


    // create shadow camera parameters bind group 
    const shadowBGL = device.createBindGroupLayout({
        entries: [
            {
                binding: 0, // camera
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
            },
        ]
    });

    // create shadow pipeline layout
    const shadowPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            shadowBGL,      // @group(0)
            modelParamsBGL, 
        ]
    });

    // Pipeline #1 - no culling 

    // create shadow pipeline descriptor
    const shadowPipelineDescriptor = {
        label: 'shadow pipeline',
        vertex: {
            module: shadowShaderModule,
            entryPoint: 'vertex_main',
            buffers: vertexBufferLayout
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
        layout: shadowPipelineLayout
    };

    // create render pipeline 
    const shadowPipeline = device.createRenderPipeline(shadowPipelineDescriptor);

    // Pipeline #2 - with culling 

    // create shadow pipeline descriptor
    const shadowPipelineDescriptorCull = {
        label: 'shadow pipeline',
        vertex: {
            module: shadowShaderModule,
            entryPoint: 'vertex_main',
            buffers: vertexBufferLayout
        },
        
        primitive: {
            topology: 'triangle-list',
            cullMode: 'front',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: shadowPipelineLayout
    };

    // create render pipeline 
    const shadowPipelineCull = device.createRenderPipeline(shadowPipelineDescriptorCull);

    // create uniform buffer for camera params
    let cameraBufferShadow = device.createBuffer({
        size: 128, // 4 * 16 * 2
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create bind group for shadow camera
    let cameraBindGroupShadow = device.createBindGroup({
        label: "shadow camera bind group",
        layout: shadowBGL,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraBufferShadow,
                },
            },
        ],
    });

    // create a render pass for creating shadowmap
    const shadowPassDescriptor = {
        label: 'shadow pass desc',
        colorAttachments: [],
        depthStencilAttachment: {
            view: smTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    // define a function to write to buffer
    function writeUniformBuffer(projMat, lookAtMat) {
        let offset = 0;

        // write projMat
        if (projMat) {
            device.queue.writeBuffer(
                cameraBufferShadow,
                offset,
                projMat.buffer,
                projMat.byteOffset,
                projMat.byteLength
            );
            offset += projMat.byteLength;
        }

        // write lookAtMat
        if (lookAtMat) {
            device.queue.writeBuffer(
                cameraBufferShadow,
                offset,
                lookAtMat.buffer,
                lookAtMat.byteOffset,
                lookAtMat.byteLength
            );
            offset += lookAtMat.byteLength;
        }
    }

    return {
        pipeline: shadowPipeline,
        pipelineCull: shadowPipelineCull,
        bindGroup: cameraBindGroupShadow,
        renderPassDescriptor: shadowPassDescriptor,
        writeUniformBuffer: writeUniformBuffer
    }
}

// create shadow map display pipeline for debugging 
export async function createShadowMapDebug(device, smTexture) {

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    // shadow-map debug shader
    const smapShader = device.createShaderModule({
        code: await (await fetch("debug_shadow.wgsl")).text(),
    });

    const smapBGL = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "depth" },
        }],
    });

    const smapPipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [smapBGL],
        }),
        vertex: {
            module: smapShader,
            entryPoint: "vertex_main",
        },
        fragment: {
            module: smapShader,
            entryPoint: "fragment_main",
            targets: [{ format: presentationFormat }],
        },
        primitive: {
            topology: "triangle-list",
        },
    });

    const smapBindGroup = device.createBindGroup({
        layout: smapBGL,
        entries: [{
            binding: 0,
            resource: smTexture.createView(),
        }],
    });

    return {
        pipeline: smapPipeline,
        bindGroup: smapBindGroup
    }
}
