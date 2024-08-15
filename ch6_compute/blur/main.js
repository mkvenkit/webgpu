// ----------------------------------------------------------------------
// main.js
// 
// Compute Shader Gaussian Blur example
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create render pipeline for plane 
async function createPlane(device, side) {
    // fetch shader code as a string
    let response = await fetch("plane.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'plane shader',
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

    // create uniform buffers for blur radius 
    const buffersR = [0, 1].map(()=> {
        return device.createBuffer({
            size: 4, // i32 - 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    });
    // write blur radius to buffers
    buffersR.map((buf)=>{
        device.queue.writeBuffer(
            buf,
            0,
            new Int32Array([R]),
            0,
            1
        );
    });

    // create storage buffers for weights 
    const bufSize = Math.ceil((4 * weights_norm.length) / 16) * 16;  // 4 x len -> 16 bytes
    const buffersW = [0, 1].map(()=> {
        return device.createBuffer({
            size: bufSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    });
    // write weights to buffers
    buffersW.map((buf)=>{
        device.queue.writeBuffer(
            buf,
            0,
            buf_weights,
            0,
            buf_weights.length
        );
    });

    // create bind group using a GPUBindGroupDescriptor
    const [blurParamsBGH, blurParamsBGHOPt] = 
        [blur.blurHPipeline, blur.blurHOptPipeline].map((p)=>{
            return device.createBindGroup({
                layout: p.getBindGroupLayout(1),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: buffersR[0],
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: buffersW[0],
                        },
                    },
                ],
            });
        });

    // create bind group using a GPUBindGroupDescriptor
    const [blurParamsBGV, blurParamsBGVOPt] = 
        [blur.blurVPipeline, blur.blurVOptPipeline].map((p)=>{
            return device.createBindGroup({
                layout: p.getBindGroupLayout(1),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: buffersR[1],
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: buffersW[1],
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
async function createComputePipeline(device, tex0, tex1) {
    // fetch shader code as a string
    let response = await fetch("blur.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Blur compute shader',
        code: shader_str,
    });

    const blurHPipeline = device.createComputePipeline({
        label: 'blurH',
        layout: 'auto',
        compute: {
            module: shaderModule,
            entryPoint: 'blurH',
        },      
    });

    const blurVPipeline = device.createComputePipeline({
        label: 'blurV',
        layout: 'auto',
        compute: {
            module: shaderModule,
            entryPoint: 'blurV',
        },      
    });

    const blurHOptPipeline = device.createComputePipeline({
        label: 'blurH_opt',
        layout: 'auto',
        compute: {
            module: shaderModule,
            entryPoint: 'blurH_opt',
        },      
    });

    const blurVOptPipeline = device.createComputePipeline({
        label: 'blurV_opt',
        layout: 'auto',
        compute: {
            module: shaderModule,
            entryPoint: 'blurV_opt',
        },      
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
                    resource: tex1.createView(),
                },
                {
                    binding: 1,
                    resource: tex0.createView(),
                },
            ],
        });
    });

    return {
        blurHPipeline: blurHPipeline,
        blurVPipeline: blurVPipeline,
        bindGroupH: bindGroupH,
        bindGroupV: bindGroupV,
        blurHOptPipeline: blurHOptPipeline,
        blurVOptPipeline: blurVOptPipeline,
        bindGroupHOPt: bindGroupHOPt,
        bindGroupVOPt: bindGroupVOPt
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
            GPUTextureUsage.TEXTURE_BINDING |
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
        usage:  GPUTextureUsage.COPY_DST | 
                GPUTextureUsage.COPY_SRC |
                GPUTextureUsage.STORAGE_BINDING | 
                GPUTextureUsage.TEXTURE_BINDING,
    });

    // create plane
    const plane = await createPlane(device, 30.0);

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

    // create compute pipeline
    const blur = await createComputePipeline(device, tex0, tex1);
    
    // create a GPURenderPassDescriptor object
    const renderPassDescriptor = {
        colorAttachments: [{
          clearValue:  { r: 0, g: 0, b: 0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView()
        }],
    };

    // create a compute pass descriptor
    const computePassDescriptor = {};

    /** Storage for timestamp query results */
    let querySet = undefined;
    /** Timestamps are resolved into this buffer */
    let resolveBuffer = undefined;
    /** Pool of spare buffers for MAP_READing the timestamps back to CPU. A buffer
     * is taken from the pool (if available) when a readback is needed, and placed
     * back into the pool once the readback is done and it's unmapped. */
    const spareResultBuffers = [];

    if (hasTimestampQuery) {
        querySet = device.createQuerySet({
          type: 'timestamp',
          count: 4,
        });
        resolveBuffer = device.createBuffer({
          size: 4 * BigInt64Array.BYTES_PER_ELEMENT,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });
        computePassDescriptor.timestampWrites = {
          querySet,
          beginningOfPassWriteIndex: 0,
          endOfPassWriteIndex: 1,
        };
        renderPassDescriptor.timestampWrites = {
          querySet,
          beginningOfPassWriteIndex: 2,
          endOfPassWriteIndex: 3,
        };
      }

    let applyBlur = false;
    let R = 5;
    let sigma = 1.0;
    updateBlurParams(device, blur, R, sigma);

    // Select the checkbox element
    let applyBlurCheckbox = document.querySelector('#apply_blur');
    // Define the function to update blur parameters
    function updateBlurParamsOnChange() {
        applyBlur = applyBlurCheckbox.checked;
        updateBlurParams(device, blur, R, sigma);
        render();
    }
    // Attach an event listener to the checkbox that triggers on change
    applyBlurCheckbox.addEventListener('change', updateBlurParamsOnChange);

    // add event listener for optimize checkbox
    const optimizeCB = document.querySelector('#optimize');
    optimizeCB.addEventListener('change', (event)=> {
        updateBlurParams(device, blur, R, sigma);
        render();
    });
    // radius slider 
    const r_slider = document.querySelector("#r_slider");
    r_slider.addEventListener("input", (event) => {
        R = r_slider.value;
        document.querySelector("#r_label").innerHTML = r_slider.value;
        updateBlurParams(device, blur, R, sigma);
        render();
    }
    );
    // sigma slider 
    const s_slider = document.querySelector("#s_slider");
    s_slider.addEventListener("input", (event) => {
        sigma = s_slider.value;
        document.querySelector("#s_label").innerHTML = s_slider.value;
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


    let nIter = 1;
    const i_slider = document.querySelector("#i_slider");
    i_slider.addEventListener("input", (event) => {
        nIter = i_slider.value;
        document.querySelector("#i_label").innerHTML = i_slider.value;
        updateBlurParams(device, blur, R, sigma);
        render();
    }
    );

    let computePassDurationSum = 0;
    let renderPassDurationSum = 0;
    let timerSamples = 0;

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
        // Compute 
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
                    computePass.dispatchWorkgroups(Math.ceil(imageCB.width/ 256), 
                        imageCB.height, 1);
                    // vertical blur 
                    computePass.setPipeline(blur.blurVOptPipeline);
                    computePass.setBindGroup(0, blur.bindGroupVOPt);
                    computePass.setBindGroup(1, blur.blurParamsBGVOPt);
                    computePass.dispatchWorkgroups(imageCB.width, 
                        Math.ceil(imageCB.height/ 256), 1);
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

        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        // ********************
        // Draw plane 
        // ********************

        // set the render pipeline
        pass.setPipeline(plane.renderPipeline);
        // set bind group
        pass.setBindGroup(0, planeBindGroup);
        // draw
        pass.draw(4); 

        // end render pass
        pass.end();

        // collect timestamp data 
        let resultBuffer = undefined;
        if (hasTimestampQuery) {
            resultBuffer =
            spareResultBuffers.pop() ||
            device.createBuffer({
                size: 4 * BigInt64Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            encoder.resolveQuerySet(querySet, 0, 4, resolveBuffer, 0);
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
        if (hasTimestampQuery) {
            resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
              const times = new BigInt64Array(resultBuffer.getMappedRange());
              const computePassDuration = Number(times[1] - times[0]);
              const renderPassDuration = Number(times[3] - times[2]);
    
              // In some cases the timestamps may wrap around and produce a negative
              // number as the GPU resets it's timings. These can safely be ignored.
              if (computePassDuration > 0 && renderPassDuration > 0) {
                computePassDurationSum += computePassDuration;
                renderPassDurationSum += renderPassDuration;
                timerSamples++;
              }
              resultBuffer.unmap();
        
              // Periodically update the text for the timer stats
              const kNumTimerSamplesPerUpdate = 100;
              if (timerSamples >= kNumTimerSamplesPerUpdate) {
                const avgComputeMicroseconds = Math.round(
                  computePassDurationSum / timerSamples / 1000
                );
                const avgRenderMicroseconds = Math.round(
                  renderPassDurationSum / timerSamples / 1000
                );
                console.log(avgComputeMicroseconds, 
                        avgRenderMicroseconds, spareResultBuffers.length);
                        
                document.querySelector("#render_label").innerHTML = avgRenderMicroseconds;
                document.querySelector("#compute_label").innerHTML = avgComputeMicroseconds;

                computePassDurationSum = 0;
                renderPassDurationSum = 0;
                timerSamples = 0;
              }
              spareResultBuffers.push(resultBuffer);
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