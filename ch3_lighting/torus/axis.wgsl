// ----------------------------------------------------------------------
// axis.wgsl
// 
// Shaders for the XYZ exes
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    nMat: mat4x4<f32>
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) color: vec3f
    ) -> VertexOut 
{
    var output : VertexOut;
    output.position = camera.projMat * camera.lookAtMat * vec4f(position, 1.0);
    output.color = vec4f(color, 1.0);
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    return fragData.color;
}