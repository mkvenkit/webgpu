// ----------------------------------------------------------------------
// shadow.wgsl
// 
// Shader for shadow depth map creation. No fragment shader present.
// 
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

// struct to hold camera params
struct Camera
{
    projMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
}

// struct to hold model params
struct ModelParams
{
    modelMat: mat4x4<f32>,
    color: vec4f,
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;
@group(1) @binding(0) var<uniform> modelParams: ModelParams;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    ) -> @builtin(position) vec4f 
{
    var output = camera.projMat * camera.lookAtMat * modelParams.modelMat * vec4f(position, 1.0);
    return output;
}
