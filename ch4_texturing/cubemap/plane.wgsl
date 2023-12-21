// ----------------------------------------------------------------------
// plane.wgsl
// 
// Testing specular relfections
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// struct to hold camera params
struct Camera
{
    projMat: mat4x4<f32>,
    mvMat: mat4x4<f32>,
    nMat: mat4x4<f32>
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) P: vec3f,    // eye space
    @location(2) @interpolate(perspective, centroid) N: vec3f,
    @location(3) @interpolate(perspective, centroid ) L: vec3f,
    @location(4) @interpolate(perspective, centroid) V: vec3f,
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) normal: vec3f
    ) -> VertexOut 
{
    var output : VertexOut;
    output.position = camera.projMat * camera.mvMat * vec4f(position, 1.0);

    // Vertex position in eye space 
    output.P = (camera.mvMat * vec4f(position, 1.0)).xyz;
    // Light position in world space
    var L = vec3f(0.0, 0.0, 10.0);
    // Light position in eye space
    var light_pos = (camera.mvMat * vec4f(L, 1.0)).xyz;
    // Light direction in eye space - do not normalize!
    output.L = light_pos - output.P;
    // eye/view vector from P to light position in eye space - - do not normalize!
    output.V = -output.P.xyz;
    // Need to transform normals as inverse transpose
    output.N = (camera.nMat * vec4f(normal, 1.0)).xyz;

    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    // specular shininess
    var alpha = 64.0; 
    var N = normalize(fragData.N);
    var L = normalize(fragData.L);
    var V = normalize(fragData.V);

    var KI = vec3f(1, 1, 1);

    var specular = KI * pow(max(0.0, dot(reflect(-L, N), V)), alpha/4);

    var H = normalize(L + V);
    //specular = KI * pow(max(dot(N, H), 0.0), alpha);

    var color = vec4f(1, 1, 0, 1);
    color = color + vec4f(specular, 1.0);

    return color;
}