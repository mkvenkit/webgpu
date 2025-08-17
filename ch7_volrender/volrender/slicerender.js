// ----------------------------------------------------------------------
// slicerender.js
// 
// Create render pipeline for slices.
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

// write uniforms to GPU
export function writeToBufferSlice(device, uniformBuffer, axis, imgWidth, imgHeight, sliceFraction) 
{
    console.log('writeToBufferSlice', axis, sliceFraction);
    // write scale 
    let imageScale = [1, 1, 1, 1];
    if (imgWidth > imgHeight) {
        imageScale = [1.0, imgHeight/imgWidth, 1.0, 1.0];
    }
    else {
        imageScale = [imgWidth/imgHeight, 1.0, 1.0, 1.0];
    }

    // write axis

    const sliceUniform = new Float32Array(8); // 32 bytes

    sliceUniform.set([...imageScale], 0);   // imageScale at index 0
    sliceUniform[4] = axis;                 // axis at index 4
    sliceUniform[5] = sliceFraction;        // sliceFraction at index 5
    sliceUniform[6] = 0.0;                  // padding
    sliceUniform[7] = 0.0;                  // padding

    device.queue.writeBuffer(uniformBuffer, 0, sliceUniform, 0, sliceUniform.length);
}

// Create render pipeline for slice 
export async function createSlicePipeline(device, volume) {

    // create shader module
    const shaderModule = await createShaderModule(device, 'slice.wgsl');

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        label: 'slice',
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

    // create uniform buffer to hold scale vec4f
    const uniformBufferSize = 48; //36=> 48
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }); 

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',     
    });

    // create bind group using a GPUBindGroupDescriptor
    const bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
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
                resource: volume.texture.createView(
                    {
                        dimension: "3d"
                    }
                ),
            },
        ],
    });

    
    return {
        renderPipeline, bindGroup, uniformBuffer
    };

}
