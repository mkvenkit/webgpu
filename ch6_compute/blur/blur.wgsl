
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

// local workgroup cache size
const NTHREADS : u32 = 256;
const RMAX : u32 = 20;
const CACHE_SIZE : u32 = NTHREADS + 2 * RMAX;
// local workgroup cache of colors 
var<workgroup> colCache : array<vec4f, CACHE_SIZE>;

// horizontal blur - optimized
@compute @workgroup_size(NTHREADS, 1, 1)
fn blurH_opt(
    @builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(local_invocation_id) local_id : vec3<u32>) 
{
    // get texture dimensions
    var dims = vec2i(textureDimensions(inputTex));

    // starting index in cache
    var startIndex = i32(RMAX) - R;

    // left border i < R
    if (i32(local_id.x) < R) {
        // clamp 
        var x = max(i32(global_id.x) - R, 0);
        // look up color
        var p = vec2i(x, i32(global_id.y));
        var index = startIndex + i32(local_id.x);
        colCache[index] = textureLoad(inputTex, p, 0);
    }
    // right border i >= N + R
    if (i32(local_id.x) >= (i32(NTHREADS) - R)) {
        // clamp 
        var x = min(i32(global_id.x) + R, dims.x - 1);
        // look up color
        var p = vec2i(x, i32(global_id.y));
        var index = startIndex + i32(local_id.x) + 2 * R;
        colCache[index] = textureLoad(inputTex, p, 0);
    }
    // center R <= i <= R + N
    var p = min(vec2i(global_id.xy), dims.xy - 1);
    var index = startIndex + i32(local_id.x) + R;
    colCache[index] = textureLoad(inputTex, p, 0);

    // wait for threads in workgroup to finish 
    // so cache is complete 
    workgroupBarrier();

    // output color
    var col = vec4f(0, 0, 0, 0);
    // loop through weights 
    for (var i = -R; i <= R; i++) {
        // index to cache 
        var k = startIndex + i32(local_id.x) + R + i;
        // add contribution
        col += weights.data[i + R] * colCache[k];
    }
    // store value 
    textureStore(outputTex, vec2i(global_id.xy), col);
}

// vertical blur - optimized
@compute @workgroup_size(1, NTHREADS, 1)
fn blurV_opt(
    @builtin(global_invocation_id) global_id : vec3<u32>,
     @builtin(local_invocation_id) local_id : vec3<u32>) 
{
    // get texture dimensions
    var dims = vec2i(textureDimensions(inputTex));

    // starting index in cache
    var startIndex = i32(RMAX) - R;

    // left border i < R
    if (i32(local_id.y) < R) {
        // clamp 
        var y = max(i32(global_id.y) - R, 0);
        // look up color
        var p = vec2i(i32(global_id.x), y);
        var index = startIndex + i32(local_id.y);
        colCache[index] = textureLoad(inputTex, p, 0);
    }
    // right border i >= N + R
    if (i32(local_id.y) >= (i32(NTHREADS) - R)) {
        // clamp 
        var y = min(i32(global_id.y) + R, dims.y - 1);
        // look up color
        var p = vec2i(i32(global_id.x), y);
        var index = startIndex + i32(local_id.y) + 2 * R;
        colCache[index] = textureLoad(inputTex, p, 0);
    }
    // center R <= i <= R + N
    // clamp
    var p = min(vec2i(global_id.xy), dims.xy - 1);
    var index = startIndex + i32(local_id.y) + R;
    colCache[index] = textureLoad(inputTex, p, 0);

    // wait for threads in workgroup to finish 
    // so cache is complete 
    workgroupBarrier();
    
    // output color
    var col = vec4f(0, 0, 0, 0);  
    // loop through weights  
    for (var i = -R; i <= R; i++) {
        // index to cache 
        var k = startIndex + i32(local_id.y) + R + i;
        // add contribution
        col += weights.data[i + R] * colCache[k];
    }
    // store value 
    textureStore(outputTex, vec2i(global_id.xy), col);
}