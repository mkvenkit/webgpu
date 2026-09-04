// ----------------------------------------------------------------------
// phong.wgsl
//
// Phong lighting shaders, shared by the torus and the plane.
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
const PointLightEnable: u32         = 0x01;
const PointLightDirectional: u32    = 0x02;
const PointLightAttentuate: u32     = 0x04;
const PointLightAmbient: u32        = 0x08;
const PointLightDiffuse: u32        = 0x10;
const PointLightSpecular: u32       = 0x20;
const PointLightBlinnPhong: u32     = 0x40;
const SpotLightEnable: u32          = 0x80;
const SpotLightOscillate: u32       = 0x0100;

// Spotlight constants
const theta_max                     = radians(45.0);        // oscillation half-angle
const spot_pos_wc                   = vec3f(0.0, 0.0, 10.0); // position, world coords

// Material and light constants
const Ia = vec3f(1.0, 1.0, 1.0);    // ambient light luminance
const Ka = vec3f(0.1, 0.0, 0.0);    // ambient reflectivity
const Id = vec3f(1.0, 1.0, 1.0);    // diffuse light luminance
const Kd = vec3f(1.0, 1.0, 0.0);    // diffuse reflectivity
const Is = vec3f(1.0, 1.0, 1.0);    // specular light luminance
const Ks = vec3f(1.0, 1.0, 1.0);    // specular reflectivity
const alpha: f32 = 32.0;            // specular shininess
const light_power = 100.0;          // brightness scale for this scene

// define a interstage variable to pass lighting parameters
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) P: vec3f,    // eye space
    @location(1) N: vec3f,
    @location(2) L: vec3f,
    @location(3) V: vec3f,
    @location(4) light_pos: vec3f,
    @location(5) spot_pos: vec3f,
    @location(6) spot_dir: vec3f
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f
    ) -> VertexOut 
{
    // define output interstage variable
    var output : VertexOut;

    // Spot light

    // k = 2 * pi / 4 = 1.5707963
    let theta = theta_max * sin(camera.timeStep * 1.5707963);
    // compute S the point where the spot light is pointed at - default is origin
    var S = vec3f(0.0);
    if ((lighting.flags & SpotLightOscillate) != 0) {
        S = vec3f(0, spot_pos_wc.z * sin(theta), spot_pos_wc.z* (1 - cos(theta)));
    }
    // spotlight position in eye space 
    output.spot_pos = (camera.lookAtMat * vec4f(spot_pos_wc, 1.0)).xyz;
    // spot position in eye space 
    let SP = (camera.lookAtMat * vec4f(S, 1.0)).xyz;
    // spotlight direction in eye space 
    output.spot_dir = output.spot_pos - SP;

    // compute transformed position 
    let mvMat = camera.lookAtMat * camera.modelMat;
    output.position = camera.projMat * mvMat * vec4f(position, 1.0);

    // Compute position in eye space 
    output.P = (mvMat * vec4f(position, 1.0)).xyz;
    // Compute position of origin in eye space
    let O = (mvMat * vec4f(vec3f(0, 0, 0), 1.0)).xyz;

    // Point light position in world coords
    let L = lighting.pl_pos.xyz; 

    // light pos in eye space
    let light_pos = (camera.lookAtMat * vec4f(L, 1.0)).xyz;
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
    
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    // light power
    var Lp = 1.0;
    // inverse square law attentuation 
    if ((lighting.flags & PointLightAttentuate) != 0) {
        // compute fragment distance to light 
        let dist = length(fragData.P - fragData.light_pos);
        let distSq = dist * dist;
        let epsilon = 0.01;
        // compute attenuated light intensity
        Lp = light_power/(distSq + epsilon);
    }

    // Point light: compute lighting

    // normalize lighting vectors
    let N = normalize(fragData.N);
    let L = normalize(fragData.L);
    let V = normalize(fragData.V);

    // ambient
    var ambient = vec3f(0.0);
    if ((lighting.flags & PointLightAmbient) != 0) {
        ambient = Ia * Ka;
    }

    var diffuse = vec3f(0.0);
    // diffuse 
    if ((lighting.flags & PointLightDiffuse) != 0) {
        diffuse = Lp * lighting.mat_color.xyz * max(0.0, dot(L, N));
    }    

    // specular 
    var specular = vec3f(0.0);
    if ((lighting.flags & PointLightSpecular) != 0) {
        // Blinn-Phong
        if ((lighting.flags & PointLightBlinnPhong) != 0) {
            let H = normalize(L + V);
            specular = Lp * Is * Ks * pow(max(dot(N, H), 0.0), alpha);
        }
        else { // Phong 
            specular = Lp * Is * Ks * pow(max(0.0, dot(reflect(-L, N), V)), alpha/4);
        }
    }

    // final point light color 
    var color_pl = vec3f(0.0);
    if ((lighting.flags & PointLightEnable) != 0) {
        color_pl = ambient + diffuse + specular;
    }

    // spotlight:
    var color_spot = vec3f(0.0);
    if ((lighting.flags & SpotLightEnable) != 0) {
        // direction from the spotlight out to this fragment
        let L_sp = normalize(fragData.P - fragData.spot_pos);
        // the spotlight's central axis
        let S_sp = normalize(fragData.spot_dir);
        // compute cos_theta_p = -L_sp . S_sp
        let cos_theta_s = dot(-L_sp, S_sp);
        // compute t^2(3 - 2*t)
        let f_dir = smoothstep(lighting.cos_theta_o, lighting.cos_theta_i, cos_theta_s);
        // using only directional component here
        let f_spot = f_dir;
        // direction from this fragment TOWARD the spotlight, matching the
        // convention used for L with the point light
        let L_spot = -L_sp;
        // compute final color for spotlight
        let diffuse_spot = f_spot * lighting.sl_col.xyz * Kd * max(0.0, dot(L_spot, N));
        let specular_spot = f_spot * lighting.sl_col.xyz * Ks * pow(max(0.0, dot(reflect(-L_spot, N), V)), alpha/4);
        color_spot = diffuse_spot + specular_spot;
    }

    // final color
    let color = vec4f(color_pl + color_spot, 1);

    return color;
}
