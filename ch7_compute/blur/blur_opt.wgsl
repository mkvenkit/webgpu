
// ----------------------------------------------------------------------
// blur_opt.wgsl
// 
// Compute shader for gaussian blur (optimized).
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// struct to encapsulate gaussian blur weights
struct BlurWeights
{
    data: array<f32>,
}

// bindgroup 0
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
// bindgroup 1
@group(1) @binding(0) var<storage, read> weights : BlurWeights;

// local workgroup thread size
const NTHREADS : u32 = 256;
// pipeline-overridable constant
override R : i32 = 4; 
// pipeline-overridable constant
override CACHE_SIZE : u32 = 264; //  NTHREADS + 2 * R

// local workgroup cache of colors 
var<workgroup> colCache : array<vec4f, CACHE_SIZE>;

// horizontal blur - optimized
@compute @workgroup_size(NTHREADS, 1, 1)
fn blurH_opt(
    @builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(local_invocation_id) local_id : vec3<u32>) 
{
    // get texture dimensions
    let dims = vec2i(textureDimensions(inputTex));

    // default case
    // use min() to restrict texture coords to image bounds 
    // will exceed bounds when image dims is not exact multiple of NTHREADS
    let p = min(vec2i(global_id.xy), dims.xy - 1);
    let index = i32(local_id.x) + R;
    colCache[index] = textureLoad(inputTex, p, 0);

    // Extra look-up #1
    // left border i < R
    if (i32(local_id.x) < R) {
        // clamp to 0 - this will happen with leftmost workgroup 
        let x = max(i32(global_id.x) - R, 0);
        // look up color
        let p = vec2i(x, i32(global_id.y));
        let index = i32(local_id.x);
        colCache[index] = textureLoad(inputTex, p, 0);
    }

    // Extra look-up #2
    // right border i >= (N - R)
    if (i32(local_id.x) >= (i32(NTHREADS) - R)) {
        // clamp to width - this will happen with rightmost workgroup 
        let x = min(i32(global_id.x) + R, dims.x - 1);
        // look up color
        let p = vec2i(x, i32(global_id.y));
        let index = i32(local_id.x) + 2 * R;
        colCache[index] = textureLoad(inputTex, p, 0);
    }

    // wait for threads in workgroup to finish 
    // so cache is complete 
    workgroupBarrier();

    // output color
    var col = vec4f(0, 0, 0, 0);
    // loop through weights 
    for (var i = -R; i <= R; i++) {
        // index to cache 
        let k = i32(local_id.x) + R + i;
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
    let dims = vec2i(textureDimensions(inputTex));

    // default case 
    // use min() to restrict texture coords to image bounds 
    // will exceed bounds when image dims is not exact multiple of NTHREADS
    let p = min(vec2i(global_id.xy), dims.xy - 1);
    let index = i32(local_id.y) + R;
    colCache[index] = textureLoad(inputTex, p, 0);

    // Extra look-up #1
    // left border i < R
    if (i32(local_id.y) < R) {
        // clamp to 0 - this will happen with leftmost workgroup 
        let y = max(i32(global_id.y) - R, 0);
        // look up color
        let p = vec2i(i32(global_id.x), y);
        let index = i32(local_id.y);
        colCache[index] = textureLoad(inputTex, p, 0);
    }

    // Extra look-up #2
    // right border i >= (N - R)
    if (i32(local_id.y) >= (i32(NTHREADS) - R)) {
        // clamp to height - this will happen with rightmost workgroup 
        let y = min(i32(global_id.y) + R, dims.y - 1);
        // look up color
        let p = vec2i(i32(global_id.x), y);
        let index = i32(local_id.y) + 2 * R;
        colCache[index] = textureLoad(inputTex, p, 0);
    }

    // wait for threads in workgroup to finish 
    // so cache is complete 
    workgroupBarrier();
    
    // output color
    var col = vec4f(0, 0, 0, 0);  
    // loop through weights  
    for (var i = -R; i <= R; i++) {
        // index to cache 
        let k = i32(local_id.y) + R + i;
        // add contribution
        col += weights.data[i + R] * colCache[k];
    }
    // store value 
    textureStore(outputTex, vec2i(global_id.xy), col);
}
