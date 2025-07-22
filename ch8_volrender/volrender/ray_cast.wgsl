// ----------------------------------------------------------------------
// ray_cast.wgsl
// 
// Ray casting shader.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
}
struct Uniforms {
  mvpMat : mat4x4<f32>,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2) var rayExitTex: texture_2d<f32>;
@group(0) @binding(3) var texVolume: texture_3d<f32>;

@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) color: vec3f
    ) -> VertexOut 
{
    var output : VertexOut;
    output.pos = uniforms.mvpMat * vec4f(position.xyz, 1.0);
    output.color = vec4f(color.rgb, 1.0);
    return output;
}

@fragment fn fragment_main(
    fragData: VertexOut) -> @location(0) vec4f 
{
    let uv = fragData.pos.xy / vec2f(textureDimensions(rayExitTex));
    let rayExit = textureSample(rayExitTex, texSampler, uv);

    let start: vec3<f32> = fragData.color.rgb;
    let end: vec3<f32> = rayExit.rgb;

    let dir: vec3<f32> = end - start;
    let norm_dir: vec3<f32> = normalize(dir);
    let len: f32 = length(dir);
    let stepSize: f32 = 0.01;
    let maxSteps: i32 = min(i32(len / stepSize), 512); // clamp to prevent overly long loops

    var dst: vec4<f32> = vec4<f32>(0.0);
    
    for (var i: i32 = 0; i < 512; i = i + 1) {
        //if (dst.a >= 0.95) {
          //  continue; // skip sampling once we've hit threshold, but maintain uniform loop
        //}
        let t: f32 = f32(i) * stepSize;
        let samplePos: vec3<f32> = start + t * norm_dir;

        let val: f32 = textureSample(texVolume, texSampler, samplePos).r;
        var src: vec4<f32> = vec4<f32>(val, val, val, val * 0.1);
        src = vec4f(src.rgb * src.a, src.a);

        if (dst.a < 0.95) {
          dst = (1.0 - dst.a) * src + dst;
        }
    }
    
    //dst = vec4f(normalize(vec3f(len, len, len)), 1.0);
    //dst = vec4f(start, 1.0);

    return dst;

}