// ----------------------------------------------------------------------
// cube.wgsl
// 
// Shaders for the Cube example
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
    eyeWC: vec4f,
    timeStep: f32,
}

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) posWC: vec3f,
}

struct Ray {
    origin: vec3<f32>,
    direction: vec3<f32>,
}

fn intersectRayCubeFromInside(ray: Ray, cubeMin: vec3<f32>, cubeMax: vec3<f32>) -> vec3<f32> {
    let invDir: vec3<f32> = 1.0 / ray.direction;

    let tTop: vec3<f32> = (cubeMax - ray.origin) * invDir;
    let tBot: vec3<f32> = (cubeMin - ray.origin) * invDir;

    let tMax: vec3<f32> = max(tTop, tBot);

    let tFar: f32 = min(min(tMax.x, tMax.y), tMax.z);

    if (tFar < 0.0) {
        return vec3<f32>(0.0, 0.0, 0.0); // Ray points away from all faces, no intersection
    }

    return ray.origin + tFar * ray.direction; // Exit point of the ray from the cube
}

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_cube<f32>;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) normal: vec3f,
    ) -> VertexOut 
{
    var output : VertexOut;
    var pos = 10 *position;

    output.position = camera.projMat * camera.lookAtMat * camera.modelMat * vec4f(pos, 1.0);
    output.normal = (camera.nMat * vec4f(normal, 1.0)).xyz;
    output.posWC = (camera.modelMat * vec4f(pos, 1.0)).xyz;
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    let N = normalize(fragData.normal);
    let I = normalize(fragData.posWC - camera.eyeWC.xyz);
    var R : vec3f = reflect(I, N);
    var dir = R;
    // Apply S(1, 1, -1) to dir since cube maps use a left-handed coord system
    dir.z = -dir.z;
    
    var col = textureSample(myTexture, mySampler, dir);

    return col;
}