// ----------------------------------------------------------------------
// main.js
// 
// Compute Shader Gaussian Blur example
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// create and return shader module  
async function createShaderModule(device, fileName) {
    // fetch shader code as a string
    let response = await fetch(fileName);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    return device.createShaderModule({
        label: fileName + ' shader module',
        code: shader_str,
    });
}

// Create render pipeline for plane 
async function createPlane(device) {

    // create shader module
    const shaderModule = await createShaderModule(device, 'plane.wgsl');

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
            topology: 'triangle-strip',
        },
        layout: 'auto'
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
    return {
        renderPipeline: renderPipeline,
    };

}

// Update blur parameters in compute shader
function updateBlurParams(device, blur, R, sigma) {

    // define gaussian function 
    const G = (x, s) => Math.exp(-x * x / (2 * s * s));
    // compute weights 
    const weights = Array.from({ length: 2 * R + 1 }, (_, i) => {
        const x = i - R;  // Map index i to the range -R to R
        return G(x, sigma);
    });
    // compute sum 
    const sum = weights.reduce((acc, cval) => acc + cval, 0);
    // normalize weights
    const weights_norm = weights.map(val => val / sum);
    const buf_weights = new Float32Array(weights_norm);
    //console.log(weights_norm);

    // create storage buffers for weights 
    const bufSize = Math.ceil((4 * weights_norm.length) / 16) * 16;  // 4 x len -> 16 bytes
    const buffersW = device.createBuffer({
            size: bufSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    // write weights to buffers
    device.queue.writeBuffer(
        buffersW,
        0,
        buf_weights,
        0,
        buf_weights.length
    );

    // create bind groups using GPUBindGroupDescriptor
    const [blurParamsBGH, blurParamsBGHOPt, blurParamsBGV, blurParamsBGVOPt] = 
        [blur.blurHPipeline, blur.blurHOptPipeline, 
            blur.blurVPipeline, blur.blurVOptPipeline].map((p)=>{
            return device.createBindGroup({
                layout: p.getBindGroupLayout(1),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: buffersW,
                        },
                    },
                ],
            });
        });
   
    blur.blurParamsBGH = blurParamsBGH;
    blur.blurParamsBGHOPt = blurParamsBGHOPt;
    blur.blurParamsBGV = blurParamsBGV;
    blur.blurParamsBGVOPt = blurParamsBGVOPt;
}

// Create compute pipeline 
async function createComputePipelines(device, R, CACHE_SIZE, tex0, tex1) {

    // create shader module
    const shaderModule = await createShaderModule(device, 'blur.wgsl');

    // create blur H/V pipelines 
    const [blurHPipeline, blurVPipeline] = ['blurH', 'blurV'].map((p)=>{
        return device.createComputePipeline({
            label: p,
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: p,
                constants: {R : R}, // pipeline-overridable constant
            },      
        });
    });

    // create shader module - opt
    const shaderModuleOpt = await createShaderModule(device, 'blur_opt.wgsl');
    
    // create blur H/V pipelines opt
    const [blurHOptPipeline, blurVOptPipeline] = ['blurH_opt', 'blurV_opt'].map((p)=>{
        return device.createComputePipeline({
            label: p,
            layout: 'auto',
            compute: {
                module: shaderModuleOpt,
                entryPoint: p,
                constants: { // pipeline-overridable constants
                    R : R,
                    CACHE_SIZE: CACHE_SIZE
                },
            },      
        });
    });

    // create bind group using a GPUBindGroupDescriptor
    const [bindGroupH, bindGroupHOPt] = [blurHPipeline, blurHOptPipeline].map((p)=>{
        return device.createBindGroup({
            layout: p.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: tex0.createView(),
                },
                {
                    binding: 1,
                    resource: tex1.createView(),
                },
            ],
        });
    });

    // create bind group using a GPUBindGroupDescriptor
    const [bindGroupV, bindGroupVOPt] = [blurVPipeline, blurVOptPipeline].map((p)=> {
        return device.createBindGroup({
            layout: p.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: tex1.createView(), // note flipped order of textures
                },
                {
                    binding: 1,
                    resource: tex0.createView(),
                },
            ],
        });
    });

    return {
        blurHPipeline,
        blurVPipeline,
        bindGroupH,
        bindGroupV,
        blurHOptPipeline,
        blurVOptPipeline,
        bindGroupHOPt,
        bindGroupVOPt
    };    
}

// main function 
async function main() {

    // get WebGPU adapter 
    const adapter = await navigator.gpu?.requestAdapter();

    // flag for timestamp feature
    const hasTimestampQuery = adapter.features.has('timestamp-query');
    // get WebGPU device
    const device = await adapter?.requestDevice({
        requiredFeatures: hasTimestampQuery ? ['timestamp-query'] : [],
    });

    if (!device) {
        alert("Couldn't get WebGPU device! Need a browser that supports WebGPU!");
        return;
    }

    // get the canvas from the document
    const canvas = document.querySelector('canvas');
    // get WebGPU rendering context from the canvas
    const context = canvas.getContext('webgpu');
    // configure the context
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    // fetch texture
    let response = await fetch("lotus.jpg");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const imageCB = await createImageBitmap(await response.blob());
    console.log(`Image dims: ${imageCB.width} x ${imageCB.height}`)

    // create image texture 
    const imageTexture = device.createTexture({
        size: [imageCB.width, imageCB.height, 1],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.COPY_SRC |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
        { source: imageCB },
        { texture: imageTexture },
        [imageCB.width, imageCB.height]
    );

    // create texture for compute buffer 
    const tex0 = device.createTexture({
        size: [imageCB.width, imageCB.height, 1],
        format: 'rgba8unorm',
        usage:  GPUTextureUsage.COPY_DST | 
                GPUTextureUsage.STORAGE_BINDING | 
                GPUTextureUsage.TEXTURE_BINDING,
    });

    // create texture for compute buffer 
    const tex1 = device.createTexture({
        size: [imageCB.width, imageCB.height, 1],
        format: 'rgba8unorm',
        usage:   
                GPUTextureUsage.STORAGE_BINDING | 
                GPUTextureUsage.TEXTURE_BINDING,
    });

    // create plane
    const plane = await createPlane(device);

    // create uniform buffer to hold scale vec4f
    const uniformBufferSize = 16; 
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // write scale 
    let imageScale = [1, 1, 1, 1];
    if (imageCB.width > imageCB.height) {
        imageScale = [1.0, imageCB.height/imageCB.width, 1.0, 1.0];
    }
    else {
        imageScale = [imageCB.width/imageCB.height, 1.0, 1.0, 1.0];
    }
    device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array(imageScale),
        0,
        4
    );

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',     
    });

    // create bind group using a GPUBindGroupDescriptor
    const planeBindGroup = device.createBindGroup({
        layout: plane.renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            },
            {
                binding: 1,
                resource: sampler,
            },
            {
                binding: 2,
                resource: tex0.createView(),
            },
        ],
    });

    // number of threads per workgroup
    const NTHREADS = 256;
    // blur radius
    let R = 5;
    // cache size for workgroup color array
    let CACHE_SIZE = NTHREADS + 2 * R;

    // create compute pipeline
    let blur = await createComputePipelines(device, R, CACHE_SIZE, tex0, tex1);
    
    // update blur parameters the first time
    let applyBlur = false;
    let sigma = 1.0;
    updateBlurParams(device, blur, R, sigma);

    // add event listener for apply blur checkbox
    const applyBlurCB = document.querySelector('#apply_blur');
    applyBlurCB.addEventListener('change', (event)=> {
        applyBlur = applyBlurCB.checked;
        updateBlurParams(device, blur, R, sigma);
        render();
    });

    // add event listener for optimize checkbox
    const optimizeCB = document.querySelector('#optimize');
    optimizeCB.addEventListener('change', (event)=> {
        updateBlurParams(device, blur, R, sigma);
        render();
    });

    // add event listener for sigma slider 
    const s_slider = document.querySelector("#s_slider");
    s_slider.addEventListener("input", (event) => {
        sigma = s_slider.value;
        document.querySelector("#s_label").innerHTML = s_slider.value;
        updateBlurParams(device, blur, R, sigma);
        render();
    }
    );

    // add event listener for nIter slider
    let nIter = 1;
    const i_slider = document.querySelector("#i_slider");
    i_slider.addEventListener("input", (event) => {
        nIter = i_slider.value;
        document.querySelector("#i_label").innerHTML = i_slider.value;
        updateBlurParams(device, blur, R, sigma);
        render();
    }
    );

    // GPU timing
    const enableTimingCB = document.querySelector("#enable_timing");
    var enableTiming = false;
    enableTimingCB.addEventListener('change', (event)=> {
        enableTiming = enableTimingCB.checked;
        render();
    });

    // add event listener for radius slider 
    const r_slider = document.querySelector("#r_slider");
    r_slider.addEventListener("input", async (event) => {
        R = r_slider.value;
        document.querySelector("#r_label").innerHTML = r_slider.value;
        // radius change required updating cache size and re-creating compute pipelines
        CACHE_SIZE = NTHREADS + 2 * R;
        blur = await createComputePipelines(device, R, CACHE_SIZE, tex0, tex1);
        updateBlurParams(device, blur, R, sigma);
        render();
    }
    );

    // create a GPURenderPassDescriptor object
    const renderPassDescriptor = {
        colorAttachments: [{
          clearValue:  { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView()
        }],
    };

    // create a compute pass descriptor
    const computePassDescriptor = {};

    // Timestamp query
    let querySet = undefined;
    if (hasTimestampQuery) {
        querySet = device.createQuerySet({
            type: 'timestamp',
            count: 2,
        });
        computePassDescriptor.timestampWrites = {
            querySet,
            beginningOfPassWriteIndex: 0,
            endOfPassWriteIndex: 1,
        };
    }

    // define render function 
    async function render() {

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Blur encoder' });
        
        // copy texture from image to tex0 
        encoder.copyTextureToTexture(
            { texture: imageTexture }, 
            { texture: tex0}, 
            [imageCB.width, imageCB.height, 1]
        );

        // ********************
        // Compute blur
        // ********************

        if (applyBlur) {
            // begin compute pass
            const computePass = encoder.beginComputePass(computePassDescriptor);

            if (optimizeCB.checked) { 
                // Use optimized compute shaders 
                for (let i = 0; i < nIter; i++) {
                    // horizontal blur 
                    computePass.setPipeline(blur.blurHOptPipeline);
                    computePass.setBindGroup(0, blur.bindGroupHOPt);
                    computePass.setBindGroup(1, blur.blurParamsBGHOPt);
                    computePass.dispatchWorkgroups(Math.ceil(imageCB.width/ NTHREADS), 
                        imageCB.height, 1);
                    // vertical blur 
                    computePass.setPipeline(blur.blurVOptPipeline);
                    computePass.setBindGroup(0, blur.bindGroupVOPt);
                    computePass.setBindGroup(1, blur.blurParamsBGVOPt);
                    computePass.dispatchWorkgroups(imageCB.width, 
                        Math.ceil(imageCB.height/ NTHREADS), 1);
                }
            }
            else {
                // Use non-optimized compute shaders 
                for (let i = 0; i < nIter; i++) {
                    // horizontal blur 
                    computePass.setPipeline(blur.blurHPipeline);
                    computePass.setBindGroup(0, blur.bindGroupH);
                    computePass.setBindGroup(1, blur.blurParamsBGH);
                    computePass.dispatchWorkgroups(Math.ceil(imageCB.width/ 256), 
                        imageCB.height, 1);
                    // vertical blur 
                    computePass.setPipeline(blur.blurVPipeline);
                    computePass.setBindGroup(0, blur.bindGroupV);
                    computePass.setBindGroup(1, blur.blurParamsBGV);
                    computePass.dispatchWorkgroups(imageCB.width, 
                        Math.ceil(imageCB.height/ 256), 1);
                }
            }

            // end compute pass
            computePass.end();
        }

        // ********************
        // Draw plane 
        // ********************

        // make a render pass encoder to encode render specific commands
        const renderPass = encoder.beginRenderPass(renderPassDescriptor);

        // set the render pipeline
        renderPass.setPipeline(plane.renderPipeline);
        // set bind group
        renderPass.setBindGroup(0, planeBindGroup);
        // draw
        renderPass.draw(4); 

        // end render pass
        renderPass.end();

        // collect timestamp data 
        let resultBuffer = undefined;
        if (hasTimestampQuery) {
            resultBuffer = device.createBuffer({
                size: 2 * BigInt64Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            let resolveBuffer = device.createBuffer({
                size: 2 * BigInt64Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
            });
            encoder.resolveQuerySet(querySet, 0, 2, resolveBuffer, 0);
            encoder.copyBufferToBuffer(
                resolveBuffer,
                0,
                resultBuffer,   
                0,
                resultBuffer.size
            );
        }

        // end commands 
        const commandBuffer = encoder.finish();
        // submit to GPU queue
        device.queue.submit([commandBuffer]);

        // compute and display timestamp data 
        if (hasTimestampQuery && enableTiming && applyBlur) {
            resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
              const vals = new BigInt64Array(resultBuffer.getMappedRange());
              const deltaT = Number(vals[1] - vals[0]);                
              console.log(deltaT/1000);
            });
        }

        // request animation - called continuously if timing is enabled
        if (enableTiming) {
            requestAnimationFrame(render);
        }
    }
    // request animation
    requestAnimationFrame(render);
}

// call main function 
main();