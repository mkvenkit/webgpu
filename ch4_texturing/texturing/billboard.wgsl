// ----------------------------------------------------------------------
// billboard.wgsl
// 
// Shaders for the billboard
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var bbSampler: sampler;
@group(0) @binding(2) var bbTexure: texture_2d<f32>;

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) uv: vec2f
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec3f,
    @location(3) uv: vec2f
    ) -> VertexOut 
{
    var output : VertexOut;
    var pos = position + vec3f(0, 0, 0.5);
    output.position = camera.projMat * camera.lookAtMat * camera.modelMat * vec4f(position, 1.0);
    output.uv = uv;
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    var texCol = textureSample(bbTexure, bbSampler, fragData.uv);

    // discard background
    if (texCol.a == 0) {
        discard;
    }

    return texCol;
}