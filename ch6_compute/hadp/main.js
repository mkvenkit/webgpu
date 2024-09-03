// ----------------------------------------------------------------------
// main.js
// 
// Compute Shader dot product example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// initialize input vector data 
function initVectorData(device, vecLength, aBuffer, bBuffer) {

    let a = [];
    let b = [];
    for (let index = 0; index < vecLength; index++) {
        a[index] = index;
        b[index] = index;
    }

    // copy vector data to GPU
    device.queue.writeBuffer(aBuffer, 0, new Float32Array(a), 0, a.length);
    // copy vector data to GPU
    device.queue.writeBuffer(bBuffer, 0, new Float32Array(b), 0, b.length);
    
}

// Create compute pipeline 
async function createComputePipeline(device, vecLength) {
    // fetch shader code as a string
    let response = await fetch("hadp.wgsl");
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

    const pipeline = device.createComputePipeline({
        label: 'hadp pipeline',
        layout: 'auto',
        compute: {
            module: shaderModule,
            entryPoint: 'hadp',
        },      
    });

    const bufSize = vecLength * Float32Array.BYTES_PER_ELEMENT; 

    // A
    const aBuffer = device.createBuffer({
        size: bufSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    // B
    const bBuffer = device.createBuffer({
        size: bufSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    // C
    const cBuffer = device.createBuffer({
        size: bufSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    // result buffer
    const rBuffer = device.createBuffer({
        size: bufSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // create bind group using a GPUBindGroupDescriptor        
    const bindgroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: aBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: bBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: cBuffer
                }
            },
        ],
    });

    initVectorData(device, vecLength, aBuffer, bBuffer);

    return {pipeline, bindgroup, aBuffer, bBuffer, cBuffer, rBuffer};
}

// main function 
async function main() {

    // get WebGPU adapter 
    const adapter = await navigator.gpu?.requestAdapter();

    // get WebGPU device
    const device = await adapter?.requestDevice();

    if (!device) {
        alert("Couldn't get WebGPU device! Need a browser that supports WebGPU!");
        return;
    }

    // log limits
    console.log("maxComputeWorkgroupSizeX = " + device.limits.maxComputeWorkgroupSizeX); 
    console.log("maxComputeWorkgroupSizeY = " + device.limits.maxComputeWorkgroupSizeY); 
    console.log("maxComputeWorkgroupSizeZ = " + device.limits.maxComputeWorkgroupSizeZ); 
    console.log("maxComputeInvocationsPerWorkgroup = " + device.limits.maxComputeInvocationsPerWorkgroup);
    console.log("maxComputeWorkgroupsPerDimension = " + device.limits.maxComputeWorkgroupsPerDimension);
    console.log("maxComputeWorkgroupStorageSize = " + device.limits.maxComputeWorkgroupStorageSize);
 
    // vector length 
    const vecLength = 1000;
    const workgroupSize = 64; // make sure this is consistent with hadp.wgsl

    // create compute pipeline
    const hadp = await createComputePipeline(device, vecLength);

    // create a compute pass descriptor
    const computePassDescriptor = {};
   
    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: 'Hadp encoder' });

    // begin compute pass
    const computePass = encoder.beginComputePass(computePassDescriptor);

    computePass.setPipeline(hadp.pipeline);
    computePass.setBindGroup(0, hadp.bindgroup);
    computePass.dispatchWorkgroups(Math.ceil(vecLength / workgroupSize), 1, 1);

    // end compute pass
    computePass.end();

    // copy buffer
    encoder.copyBufferToBuffer(
        hadp.cBuffer /* source buffer */,
        0 /* source offset */,
        hadp.rBuffer /* destination buffer */,
        0 /* destination offset */,
        vecLength * Float32Array.BYTES_PER_ELEMENT
        );

    // end commands 
    const commandBuffer = encoder.finish();
    // submit to GPU queue
    device.queue.submit([commandBuffer]);

    // after running the compute shader, map the buffer to the CPU
    await hadp.rBuffer.mapAsync(GPUMapMode.READ);
    // access the data in the result buffer
    const result = new Float32Array(hadp.rBuffer.getMappedRange());
    // output the result
    console.log(result); 
    console.log(result[vecLength-1]); 
    // unmap the buffer after reading
    hadp.rBuffer.unmap();
        
}

// call main function 
main();