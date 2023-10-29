// ----------------------------------------------------------------------
// torus.wgsl
// 
// Shaders for the torus.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define the vale of pi 
const pi = 3.14159265359;

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    nMat: mat4x4<f32>,
    timeStep: f32
}

// define a struct for lighting
struct Lighting {
    mat_color: vec4f,
    pl_pos: vec4f,
    sl_col: vec4f,
    flags: u32,
    cos_theta_o: f32,
    cos_theta_i: f32,
}

// define uniform variables
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> lighting : Lighting;

// Bit fields for Lighting.flags 
const PointLightEnable: u32 = 0x01;
const PointLightDirectional: u32 = 0x02;
const PointLightAttentuate: u32 = 0x04;
const PointLightAmbient: u32 = 0x08;
const PointLightDiffuse: u32 = 0x10;
const PointLightSpecular: u32 = 0x20;
const PointLightBlinnPhong: u32 = 0x40;
const SpotLightEnable: u32 = 0x80;
const SpotLightOscillate: u32 = 0x0100;


// define a interstage variable to pass lighting parameters
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) P: vec3f,    // eye space
    @location(2) N: vec3f,
    @location(3) L: vec3f,
    @location(4) V: vec3f,
    @location(5) light_pos: vec3f,
    @location(6) spot_pos: vec3f,
    @location(7) spot_dir: vec3f
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f
    ) -> VertexOut 
{
    var output : VertexOut;

    // Spot light
    var theta_max = radians(45.0);
    var theta = theta_max * sin(camera.timeStep * 2 * pi/100);
    var spot_pos_wc = vec3f(0, 0, 10.0);
    var S = vec3f(0.0);
    if ((lighting.flags & SpotLightOscillate) != 0) {
        S = vec3f(0, spot_pos_wc.z * sin(theta), spot_pos_wc.z* (1 - cos(theta)));
    }
    // spotlight position in eye space 
    output.spot_pos = (camera.lookAtMat * vec4f(spot_pos_wc, 1.0)).xyz;
    // spot position in eye space 
    var SP = (camera.lookAtMat * vec4f(S, 1.0)).xyz;
    // spotlight direction in eye space 
    output.spot_dir = normalize(output.spot_pos - SP);

    // compute transformed position 
    var mvMat = camera.lookAtMat * camera.modelMat;
    output.position = camera.projMat * mvMat * vec4f(position, 1.0);

    // Compute position in eye space 
    output.P = (mvMat * vec4f(position, 1.0)).xyz;
    // Compute position of origin in view space
    var O = (mvMat * vec4f(vec3f(0, 0, 0), 1.0)).xyz;

    // Point light position in world coords
    var L = lighting.pl_pos.xyz; 

    // light pos in eye space
    var light_pos = (camera.lookAtMat * vec4f(L, 1.0)).xyz;
    output.light_pos = light_pos;
    // light direction in eye space 
    if ((lighting.flags & PointLightDirectional) != 0) {
        // directional lighting - - do not normalize!
        output.L = light_pos - O;
    }
    else {
        // light direction - do not normalize!
        output.L = light_pos - output.P;
    }
    // eye/view vector from P in eye space - do not normalize!
    output.V = -output.P.xyz;

    // Need to transform normals as inverse transpose
    output.N = (camera.nMat * vec4f(normal, 1.0)).xyz;
    
    output.color = vec4f(1, 1, 0, 1);
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    // Point/Directional light 
    var Ia = vec3f(1.0, 1.0, 1.0);   // Ambient reflected Light Luminance
    var Ka = vec3f(0.1, 0.0, 0.0);   // Ambient reflectivity coefficient for material
    var Id = vec3f(1.0, 1.0, 1.0);   // Diffuse reflected Light Luminance
    var Kd = vec3f(1.0, 1.0, 0.0);   // Diffuse reflectivity coefficient for material
    var Is = vec3f(1.0, 1.0, 1.0);   // Specular reflected Light Luminance
    var Ks = vec3f(1.0, 1.0, 1.0);   // Specular reflectivity coefficient for material
    // specular shininess
    var alpha = 32.0; 

    // light power
    var dist = length(fragData.P - fragData.light_pos);
    var distSq = dist * dist;
    var Lp = 1.0;
    var epsilon = 0.01;
    // inverse square law attentuation 
    if ((lighting.flags & PointLightAttentuate) != 0) {
        Lp = 100.0/(distSq + epsilon);
    }

    // Point light: compute lighting 
    var ambient = Ia * Ka;
    var N = normalize(fragData.N);    
    var L = normalize(fragData.L);
    var V = normalize(fragData.V);

    var diffuse = Lp * lighting.mat_color.xyz * max(0.0, dot(L, N));
    var specular = Lp * Is * Ks * pow(max(0.0, dot(reflect(-L, N), V)), alpha/4);

    // Blinn-Phong 
    if ((lighting.flags & PointLightBlinnPhong) != 0) {
        var H = normalize(L + V);
        specular = Ks * pow(max(dot(N, H), 0.0), alpha);
    }

    // enable/disable ambient 
    if ((lighting.flags & PointLightAmbient) == 0) {
        ambient = vec3f(0.0);
    }
    // enable/disable diffuse 
    if ((lighting.flags & PointLightDiffuse) == 0) {
        diffuse = vec3f(0.0);
    }
    // enable/disable specular 
    if ((lighting.flags & PointLightSpecular) == 0) {
        specular = vec3f(0.0);
    }

    // a moving splotlight
    var cos_theta_s = dot(-fragData.spot_dir, normalize(fragData.P - fragData.spot_pos));
    var f_dir = smoothstep(lighting.cos_theta_o, lighting.cos_theta_i, cos_theta_s);

    // distance attenuation 
    var distSqSpot = length(fragData.P - fragData.spot_pos);
    distSqSpot *= distSqSpot;
    var f_dist = 100.0/(distSqSpot + 0.01);

    var f_spot = f_dir;

    var diffuse_spot = f_spot * lighting.sl_col.xyz * Kd * max(0.0, dot(L, N));
    var specular_spot = f_spot * lighting.sl_col.xyz * Ks * pow(max(0.0, dot(reflect(-L, N), V)), alpha/4);
    var color_spot = diffuse_spot + specular_spot;

    // spot light color
    if ((lighting.flags & SpotLightEnable) == 0) {
        color_spot = vec3f(0.0);
    }

    // point light color 
    var color_pl = vec3f(0.0);
    if ((lighting.flags & PointLightEnable) != 0) {
        color_pl = ambient + diffuse + specular;
    }

    // final color
    var color = vec4f(color_pl + color_spot, 1);

    return color;
}
