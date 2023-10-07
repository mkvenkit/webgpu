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
    @location(0) color: vec4f
}

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    nMat: mat4x4<f32>,
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
    var L = vec3f(10, 10, 10); // ligh position in world coords 
    var Ka = vec3f(1, 0.0, 0.0);
    var Ia = vec3f(0.2, 0.2, 0.2);
    var Kd = vec3f(1, 1, 0);
    var Ks = vec3f(1, 1, 1);
    var alpha = 16.0; 
    var eye = vec3f(10, 10, 10);

    var output : VertexOut;
    var mvMat = camera.lookAtMat * camera.modelMat;
    output.position = camera.projMat * mvMat * vec4f(position, 1.0);

    // position in eye space 
    var pos_eye = (mvMat * vec4f(position, 1.0)).xyz;
    // light pos in eye space
    var light_pos = (camera.lookAtMat * vec4f(L, 1.0)).xyz;
    // light direction in eye space 
    var light_dir = normalize(light_pos - pos_eye);

    // Need to transform normals as inverse transpose
    var N = (camera.nMat * vec4f(normal, 1.0)).xyz;

    var ambient = Ka * Ia;
    var diffuse = Kd * max(0.0, dot(light_dir, N));
    var E = normalize(-pos_eye.xyz);
    var specular = Ks * pow(max(0.0, dot(reflect(-light_dir, N), E)), alpha);

    
    var col = vec4f(1, 1, 0, 1);
    //output.color = vec4f(normal, 1); //vec4f(ambient + diffuse, 1);
    output.color = vec4f(ambient + diffuse + specular, 1);
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    return fragData.color;
}
