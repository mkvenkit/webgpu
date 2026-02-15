// ----------------------------------------------------------------------
// render.js
//
// Normal render pipeline creation (with shadow map sampling)
//
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

export async function createRenderPipeline({
    device,
    canvas,
    context,
    vertexBufferLayout,
    modelParamsBGL,
    smTexture,
}) {

    // camera uniform buffer
    const cameraBufferRender = device.createBuffer({
        size: 256, // 3 * 4 * 16 + 16 = 208 => 256
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // load shader
    const response = await fetch("render.wgsl");
    if (!response.ok) {
        throw new Error(`Failed to load render.wgsl (${response.status})`);
    }
    const shaderCode = await response.text();

    const shaderModule = device.createShaderModule({
        label: "render shader",
        code: shaderCode,
    });

    // bind group layout (@group(0))
    const renderBGL = device.createBindGroupLayout({
        entries: [
            {
                binding: 0, // camera
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
            },
            {
                binding: 1, // shadow sampler
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                sampler: { type: "comparison" },
            },
            {
                binding: 2, // shadow map
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: { sampleType: "depth" },
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform",
                },
            },
        ],
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            renderBGL,      // group(0)
            modelParamsBGL, // group(1)
        ],
    });

    const pipeline = device.createRenderPipeline({
        label: "render pipeline",
        layout: pipelineLayout,
        vertex: {
            module: shaderModule,
            entryPoint: "vertex_main",
            buffers: vertexBufferLayout,
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fragment_main",
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat(),
            }],
        },
        primitive: {
            topology: "triangle-list",
            cullMode: 'back',
        },
        depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less",
        },
    });

    // create shadow params buffer
    const shadowParamsBuffer = device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupNearest = device.createBindGroup({
        label: "render bind group",
        layout: renderBGL,
        entries: [
            {
                binding: 0,
                resource: { buffer: cameraBufferRender },
            },
            {
                binding: 1,
                resource: device.createSampler({
                    compare: 'less',
                    minFilter: 'nearest',
                    magFilter: 'nearest',
                }),
            },
            {
                binding: 2,
                resource: smTexture.createView(),
            },
            {
                binding: 3,
                resource: { buffer: shadowParamsBuffer },
            },
        ],
    });

    const bindGroupLinear = device.createBindGroup({
        label: "render bind group",
        layout: renderBGL,
        entries: [
            {
                binding: 0,
                resource: { buffer: cameraBufferRender },
            },
            {
                binding: 1,
                resource: device.createSampler({
                    compare: 'less',
                    minFilter: 'linear',
                    magFilter: 'linear',
                }),
            },
            {
                binding: 2,
                resource: smTexture.createView(),
            },
            {
                binding: 3,
                resource: { buffer: shadowParamsBuffer },
            },
        ],
    });


    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const renderPassDescriptor = {
        label: "render pass",
        colorAttachments: [{
            view: undefined, // set every frame
            clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
            loadOp: "clear",
            storeOp: "store",
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        },
    };

    function writeToCameraBuffer(projMat, lookAtMat, shadowMat, lightPos) {
        let offset = 0;

        for (const mat of [projMat, lookAtMat, shadowMat]) {
            if (!mat) continue;
            device.queue.writeBuffer(
                cameraBufferRender,
                offset,
                mat.buffer,
                mat.byteOffset,
                mat.byteLength
            );
            offset += mat.byteLength;
        }

        if (lightPos) {
            const lp = new Float32Array([lightPos[0], lightPos[1], lightPos[2], 1.0]);
            device.queue.writeBuffer(cameraBufferRender, offset, lp);
        }
    }

    return {
        pipeline,
        bindGroupNearest,
        bindGroupLinear,
        renderPassDescriptor,
        cameraBufferRender,
        shadowParamsBuffer,
        writeToCameraBuffer,
    };
}
