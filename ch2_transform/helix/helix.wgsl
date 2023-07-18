// ----------------------------------------------------------------------
// helix.wgsl
// 
// Shaders for helix and circle
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold camera paramaters
struct Camera {
    // modelview-projection matrix
    mvpMat : mat4x4<f32>,
    // current time step
    timeStep: f32,
    // apply align matrix? 
    applyAlign : i32
}

// material properties
struct Material {
    color: vec4f,
    flag : i32
}
// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;

// uniform color
@group(1) @binding(0) var<uniform> material : Material;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f
    ) -> @builtin(position) vec4f  
{
    var pos = camera.mvpMat * vec4f(position, 1.0);
    return pos;
}

// fragment shader entry 
@fragment fn fragment_main() -> @location(0) vec4f 
{
    return material.color;
}