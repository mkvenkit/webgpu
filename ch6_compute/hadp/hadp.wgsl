
// ----------------------------------------------------------------------
// hadp.wgsl
// 
// Compute shader for Hadamard product.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// struct to encapsulate storage buffer for a vector
struct VecBuffer
{
    data: array<f32>,
}

// bindgroup 0
@group(0) @binding(0) var<storage, read> aVec : VecBuffer;
@group(0) @binding(1) var<storage, read> bVec : VecBuffer;
@group(0) @binding(2) var<storage, read_write> cVec : VecBuffer;

// entry point 
@compute @workgroup_size(64)
fn hadp(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    // ensure index is within bounds
    if (index < arrayLength(&aVec.data)) {
        // perform element-wise multiplication (Hadamard product)
        cVec.data[index] = aVec.data[index] * bVec.data[index];
    }
}
