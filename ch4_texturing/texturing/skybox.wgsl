// ----------------------------------------------------------------------
// skybox.wgsl
// 
// Shaders for the skybox cube.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Define cube vertices 
// Assuming unit cube centered at (0, 0, 0)
const cubeVertices: array<vec3f, 8> = array<vec3f, 8>(
    vec3f(-0.5, -0.5,  0.5), // -X, -Y, +Z (Left, Bottom, Front)
    vec3f( 0.5, -0.5,  0.5), // +X, -Y, +Z (Right, Bottom, Front)
    vec3f(-0.5,  0.5,  0.5), // -X, +Y, +Z (Left, Top, Front)
    vec3f( 0.5,  0.5,  0.5), // +X, +Y, +Z (Right, Top, Front)
    vec3f(-0.5, -0.5, -0.5), // -X, -Y, -Z (Left, Bottom, Back)
    vec3f( 0.5, -0.5, -0.5), // +X, -Y, -Z (Right, Bottom, Back)
    vec3f(-0.5,  0.5, -0.5), // -X, +Y, -Z (Left, Top, Back)
    vec3f( 0.5,  0.5, -0.5)  // +X, +Y, -Z (Right, Top, Back)
);

// Define cube indices - each face is made from 2 triangles
const cubeIndices: array<u32, 36> = array<u32, 36>(
     0, 1, 2, 2, 1, 3, // +Z face (Front)
     1, 5, 3, 3, 5, 7, // +X face (Right)
     5, 4, 7, 7, 4, 6, // -Z face (Back)
     4, 0, 6, 6, 0, 2, // -X face (Left)
     2, 3, 6, 6, 3, 7, // +Y face (Top)
     4, 5, 0, 0, 5, 1  // -Y face (Bottom)
);

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
}

// define camera uniform
@group(0) @binding(0) var<uniform> camera : Camera;
// define texture sampler and cube map texture
@group(0) @binding(1) var cmSampler: sampler;
@group(0) @binding(2) var cmTexture: texture_cube<f32>;

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) posWC: vec3f
}

// vertex shader entry 
@vertex fn vertex_main(
    @builtin(vertex_index) vertexIndex: u32
) -> VertexOut 
{
    var output : VertexOut;

    // get vertex position using index
    var posCube : vec3f = cubeVertices[cubeIndices[vertexIndex]];
    // magnifiy
    var pos = 1000 * posCube;
    // compute clip space position 
    output.position = camera.projMat * camera.lookAtMat * vec4f(pos, 1.0);
    // set output position in world space
    output.posWC = pos;

    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    var dir = normalize(fragData.posWC);
    // Apply S(1, 1, -1) to dir since cube maps use a left-handed coord system
    dir.z = -dir.z;
    var col = textureSample(cmTexture, cmSampler, dir);    
    return col;
}