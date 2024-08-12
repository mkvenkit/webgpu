// ----------------------------------------------------------------------
// plane.wgsl
// 
// Shader for plane.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// struct to hold camera params
struct Camera
{
    mvMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    timeStep: f32,
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> imageScale: vec4f;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var texImage: texture_2d<f32>;

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) uv : vec2f,
}

// define quad vertices 
var<private> vertices = array<vec3f, 4>(
    vec3f(-1.0, 1.0, 0.0), 
    vec3f(-1.0, -1.0, 0.0), 
    vec3f(1.0, 1.0, 0.0), 
    vec3f(1.0, -1.0, 0.0),
);
// define texture coordinates 
var<private> texcoords = array<vec2f, 4>(
    vec2f(0.0, 0.0), 
    vec2f(0.0, 1.0), 
    vec2f(1.0, 0.0), 
    vec2f(1.0, 1.0),
);

// vertex shader entry 
@vertex fn vertex_main(
    @builtin(vertex_index) vIndex : u32
    ) -> VertexOut 
{
    var output : VertexOut;
    output.position = vec4f(imageScale.xyz * vertices[vIndex], 1.0);
    output.uv = texcoords[vIndex];
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    var texCol = textureSample(texImage, mySampler, fragData.uv);
    return texCol;
}