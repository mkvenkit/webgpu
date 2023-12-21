// ----------------------------------------------------------------------
// cube.wgsl
// 
// Shaders for the Cube example
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    nMat: mat4x4<f32>,
    eyeWC: vec4f,
    timeStep: f32,
}

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) posWC: vec3f
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_cube<f32>;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) color: vec3f,
    ) -> VertexOut 
{
    var output : VertexOut;
    var pos = 1000 *position;
    output.position = camera.projMat * camera.lookAtMat * vec4f(pos, 1.0);
    output.color = vec4f(color, 1.0);
    output.posWC = pos;
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    var dir = fragData.posWC;
    // Apply S(1, 1, -1) to dir since cube maps use a left-handed coord system
    dir.z = -dir.z;
    var col = textureSample(myTexture, mySampler, dir);
    return col;
}