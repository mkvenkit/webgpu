// ----------------------------------------------------------------------
// transparent.wgsl
// 
// Transparent shaders for ODT.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

// define a struct to hold camera parameters
struct Camera {
    mvMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
}

// define a struct to hold render parameters
struct RenderParams {
    usePremultipliedAlpha: u32
};

// define uniforms
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> params : RenderParams;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) color: vec4f,
    ) -> VertexOut 
{
    var output : VertexOut;
    output.position = camera.projMat * camera.mvMat * vec4f(position, 1.0);
    output.color = color;
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{    
    if (params.usePremultipliedAlpha != 0u) {
        return vec4f(fragData.color.rgb * fragData.color.a, fragData.color.a);
    }
    else {
        return fragData.color;
    }
}
