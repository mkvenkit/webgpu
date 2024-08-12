
// ----------------------------------------------------------------------
// blur.wgsl
// 
// Compute shader for gaussian blur.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// struct to encasulate gaussain blur weights
struct BlurWeights
{
    data: array<f32>,
}

// bindgroup 0
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
// bindgroup 1
@group(1) @binding(0) var<uniform> R : i32;
@group(1) @binding(1) var<storage, read> weights : BlurWeights;

// horizontal blur 
@compute @workgroup_size(256, 1, 1)
fn blurH(
    @builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(local_invocation_id) local_id : vec3<u32>) 
{
    // get texture dimensions
    var dims = vec2i(textureDimensions(inputTex));
    // output color
    var col = vec4f(0, 0, 0, 0);
    // loop through weights
    for (var i = -R; i <= R; i++) {
        var p = vec2i(i32(global_id.x) + i, i32(global_id.y));
        // clamp to image bounds
        p.x = clamp(p.x, 0, dims.x - 1);
        // add contribution
        col += weights.data[i + R] * textureLoad(inputTex, p, 0);
    }
    // store value 
    textureStore(outputTex, vec2i(global_id.xy), col);
}

// vertical blur 
@compute @workgroup_size(1, 256, 1)
fn blurV(
    @builtin(global_invocation_id) global_id : vec3<u32>) 
{
    // get texture dimensions
    var dims = vec2i(textureDimensions(inputTex));
    // output color
    var col = vec4f(0, 0, 0, 0);  
    // loop through weights  
    for (var i = -R; i <= R; i++) {
        var p = vec2i(i32(global_id.x), i32(global_id.y) + i);
        // clamp to image bounds
        p.y = clamp(p.y, 0, dims.y - 1);
        // add contribution
        col += weights.data[i + R] * textureLoad(inputTex, p, 0);
    }
    // store value 
    textureStore(outputTex, vec2i(global_id.xy), col);
}