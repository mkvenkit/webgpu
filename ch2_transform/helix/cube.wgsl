// ----------------------------------------------------------------------
// cube.wgsl
// 
// Shaders for the Cube 
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

// struct to hold helix position, normal, etc.
struct HelixGeom {
    P : vec3f,      // position 
    T : vec3f,      // tangent
    N : vec3f,      // normal
    S : vec3f,      // side = T X N 
}

// helix params 
var<private> r : f32 = 2.0;
var<private> R : f32 = 10.0;
var<private> N : f32 = 20;

// compute tanget of toroidal helix 
fn compute_tangent_helix(t : f32) -> vec3f
{
    var T : vec3f;
    // compute tangent T = dP/dt
    T.x = -(R + r*cos(N*t))*sin(t) - r*N*sin(N*t)*cos(t);
    T.y =  (R + r*cos(N*t))*cos(t) - r*N*sin(N*t)*sin(t);
    T.z =  r*N*cos(N*t);
    return T;
}

// compute position on toroidal helix 
// Ensure that helix parametrization is same as JS code!
fn compute_helix(t : f32)-> HelixGeom
{
    var helix : HelixGeom;
    // compute position 
    var pos : vec3f;
    helix.P.x = (R + r*cos(N*t))*cos(t);
    helix.P.y = (R + r*cos(N*t))*sin(t);
    helix.P.z = r*sin(N*t);
    // compute tangent T = dP/dt
    helix.T = normalize(compute_tangent_helix(t));

    // compute normal N = dT_n/dt where T_n = T/|T|
    var dt = 0.01;
    var T_p = normalize(compute_tangent_helix(t + dt));
    var T_m = normalize(compute_tangent_helix(t - dt));
    helix.N = normalize((T_p - T_m)/(2.0*dt));

    // compute the side vector T x N 
    helix.S = normalize(cross(helix.T, helix.N));

    return helix;
}

// define cube colors 
var<private> cols = array<vec3f, 7>(
    vec3f( 1.0,  0.0, 0.0), 
    vec3f( 0.0, 1.0,  0.0), 
    vec3f( 0.0, 0.0,  1.0),
    vec3f( 1.0, 1.0,  0.0), 
    vec3f( 0.0, 1.0,  1.0),
    vec3f( 1.0, 0.0,  1.0),
    vec3f( 0.5, 0.5,  0.5),
);

// define cube time step offsets
var<private> dt = array<f32, 7>(
    0, 1, 2, 3, 4, 5, 6,
);
    
// vertex shader entry 
@vertex fn vertex_main(
    @builtin(instance_index) idx : u32,
    @location(0) position: vec3f,
    @location(1) color: vec3f
    ) -> VertexOut
{
    // push each instance along the curve by dt  
    var k = 0.0025;
    var t =  k * camera.timeStep + 0.04*dt[idx];
    var helix : HelixGeom = compute_helix(t);

    // compute position
    var scale = 0.5;
    var pos : vec4f;
    // check align flag
    if (camera.applyAlign == 1) {
        // Apply rigid body matrix for aligining along:
        // X -> S
        // Y -> T
        // Z -> N 
        // and 
        // Translation to T 
        // RBM = [R T]
        //       [0 1]
        // where R = [Rx Ry Rz] column vectors 
        // Since WGSL uses column matrix format, we set the transapose of RBM 
        var rigidBM = mat4x4<f32>(
            helix.S.x, helix.S.y, helix.S.z, 0.0,
            helix.T.x, helix.T.y, helix.T.z, 0.0,
            helix.N.x, helix.N.y, helix.N.z, 0.0,
            helix.P.x, helix.P.y, helix.P.z, 1.0
        );
        // set position
        pos = camera.mvpMat * rigidBM * vec4f(position, 1.0);
    }
    else {
        // just translate
        var transM = mat4x4<f32>(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            helix.P.x, helix.P.y, helix.P.z, 1.0
        );
        // set position 
        pos = camera.mvpMat * transM * vec4f(position, 1.0);
    }
    var vout : VertexOut;
    vout.position = pos;
    
    if (material.flag == 1) {
        vout.color = vec4f(cols[idx], 1.0);
    }
    else if (material.flag == 2) {
        vout.color = vec4f(color, 1.0);
    }
    return vout;
}

// fragment shader entry 
@fragment fn fragment_main(fragIn: VertexOut) -> @location(0) vec4f 
{
    return fragIn.color;
}