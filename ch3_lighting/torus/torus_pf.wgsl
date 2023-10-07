// ----------------------------------------------------------------------
// torus.wgsl
// 
// Shaders for the torus.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) P: vec3f,    // eye space
    @location(2) N: vec3f,
    @location(3) L: vec3f,
    @location(4) E: vec3f
}

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    nMat: mat4x4<f32>
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f
    ) -> VertexOut 
{
    // Directional light 
    var L = vec3f(10, 10, 10); // light position in world coords 

    var output : VertexOut;
    var mvMat = camera.lookAtMat * camera.modelMat;
    output.position = camera.projMat * mvMat * vec4f(position, 1.0);

    // position in eye space 
    output.P = (mvMat * vec4f(position, 1.0)).xyz;
    // light pos in eye space
    var light_pos = (camera.lookAtMat * vec4f(L, 1.0)).xyz;
    // light direction in eye space 
    output.L = normalize(light_pos - output.P);
    // eye vector from P 
    output.E = normalize(-output.P.xyz);

    // Need to transform normals as inverse transpose
    output.N = (camera.nMat * vec4f(normal, 1.0)).xyz;
    
    output.color = vec4f(1, 1, 0, 1);
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    // Directional light 
    var Ka = vec3f(1, 0.0, 0.0);
    var Ia = vec3f(0.2, 0.2, 0.2);
    var Kd = vec3f(1, 1, 0);
    var Ks = vec3f(1, 1, 1);
    var alpha = 16.0; 

    var ambient = Ka * Ia;
    var N = normalize(fragData.N);
    var L = normalize(fragData.L);
    var E = normalize(fragData.E);
    var diffuse = Kd * max(0.0, dot(L, N));
    var specular = Ks * pow(max(0.0, dot(reflect(-L, N), E)), alpha);
    var color = vec4f(ambient + diffuse + specular, 1);

    return color;
}
