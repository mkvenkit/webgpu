// ----------------------------------------------------------------------
// tex.wgsl
// 
// Shaders for the torus and plane that illustrate texture mapping.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

const pi : f32 = 3.14159265359;

// Bit fields for Lighting.flags 
const ShowImageTextureTorus:u32     = 0x01;
const ShowImageTexturePlane:u32     = 0x02;
const ShowProcTextureTorus:u32      = 0x04;
const ShowProcTexturePlane:u32      = 0x08;
const ShowNormalMappingTorus:u32    = 0x10;
const ShowNormalMappingPlane:u32    = 0x20;
const EnableTextureProjection: u32  = 0x40;
const EnableBillboardTexture: u32   = 0x80;
const ShowSkyBox:u32                = 0x0100;
const ShowEnvMap:u32                = 0x0200;

// define a struct to hold camera parameters
struct Camera {
    modelMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    nMatEC: mat4x4<f32>,
    nMatWC: mat4x4<f32>,
    texProjMat: mat4x4<f32>,
    lightPosWC: vec4f,
    eyeWC: vec4f,
    timeStep: f32,
    flagsUI: u32,
    meshType: u32
}

// define uniform variables
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var texImage: texture_2d<f32>;
@group(0) @binding(3) var texNMap: texture_2d<f32>;
@group(0) @binding(4) var texProj: texture_2d<f32>;
@group(0) @binding(5) var texCubemap: texture_cube<f32>;

// define a interstage variable to pass lighting parameters
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) N: vec3f,          // normal in eye space
    @location(1) L: vec3f,          // light direction in eye space
    @location(2) V: vec3f,          // view direction in eye space
    @location(3) T: vec3f,          // tangent in model space 
    @location(4) normalMC: vec3f,   // normal in model space 
    @location(5) normalWC: vec3f,   // normal in world space
    @location(6) posWC: vec4f,      // vertex position in world space 
    @location(7) uv: vec2f,     // texture coords
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec3f,
    @location(3) uv: vec2f
    ) -> VertexOut 
{
    // define output interstage variable
    var output : VertexOut;

    // vertex position in clip space
    var mvMat = camera.lookAtMat * camera.modelMat;
    output.position = camera.projMat * mvMat * vec4f(position, 1.0);
    // vertex position in world space
    output.posWC = camera.modelMat * vec4f(position, 1.0);

    // vertex position in eye space 
    var posEC = (mvMat * vec4f(position, 1.0)).xyz;
    // light pos in eye space
    var lightPosEC = (camera.lookAtMat * vec4f(camera.lightPosWC.xyz, 1.0)).xyz;;
    // light direction in eye space
    output.L = lightPosEC - posEC;

    // eye/view vector from P in eye space
    output.V = -posEC.xyz;

    // normal in eye space 
    output.N = (camera.nMatEC * vec4f(normal, 1.0)).xyz;

    // normal in world space - needed for cubemap
    output.normalWC = (camera.nMatWC * vec4f(normal, 1.0)).xyz;

    // normal in model space
    output.normalMC = normal;

    // tangent in model space
    output.T = tangent;

    // texture coords 
    output.uv = uv;
     
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    // constants:

    // Point/Directional light 
    let Ia = vec3f(1.0, 1.0, 1.0);   // Ambient reflected Light Luminance
    let Ka = vec3f(0.1, 0.1, 0.1);   // Ambient reflectivity coefficient for material
    let Id = vec3f(1.0, 1.0, 1.0);   // Diffuse reflected Light Luminance
    let Kd = vec3f(1.0, 1.0, 0.0);   // Diffuse reflectivity coefficient for material
    let Is = vec3f(1.0, 1.0, 1.0);   // Specular reflected Light Luminance
    let Ks = vec3f(1.0, 1.0, 1.0);   // Specular reflectivity coefficient for material
    // specular shininess
    let alpha : f32 = 32.0; 
    
    // normal mapping:
    var texCoord = fragData.uv;
    if (camera.meshType == 0) { // torus
        texCoord = vec2f(4.0*fragData.uv.x, fragData.uv.y);
    }
    var texColNMap = textureSample(texNMap, mySampler, texCoord);

    // default normal in EC
    var N = normalize(fragData.N); 

    // Normal mapping 
    var showNormalMap : bool = 
        ((camera.flagsUI & ShowNormalMappingTorus) != 0 && (camera.meshType == 0)) ||
        ((camera.flagsUI & ShowNormalMappingPlane) != 0 && (camera.meshType == 1));
    if (showNormalMap) {

        // tangent in model space
        var T = normalize(fragData.T);
        // normal in model space 
        N = normalize(fragData.normalMC);
        // compute bitangent in model space 
        var B = cross(N, T);
        // inverse of the TBN matrix - note that WGSL uses column order!
        var TBN_inv = mat4x4<f32> (
            T.x, B.x, N.x, 0.0,
            T.y, B.y, N.y, 0.0,  
            T.z, B.z, N.z, 0.0,   
            0.0, 0.0, 0.0, 1.0
        );

        // read normal from texture - in tangent space
        var Nmap = normalize(2.0*texColNMap.xyz - vec3f(1.0));

        // compute normal in eye space
        N = (camera.nMatEC * TBN_inv * vec4f(Nmap, 1.0)).xyz;
    }

    // light direction and view direction
    var L = normalize(fragData.L);
    var V = normalize(fragData.V);

    // ambient 
    var ambient = Ia * Ka;

    // diffuse color
    var mat_color = vec3f(1, 1, 0); 
    if (camera.meshType == 0) {
        mat_color = vec3f(1, 0, 0);
    }
    var diffuse = mat_color * max(0.0, dot(L, N));

    // specular color - Blinn-Phong 
    var H = normalize(L + V);
    var specular = Is * Ks * pow(max(0.0, dot(reflect(-L, N), V)), alpha/4);

    // final color
    var color = vec4f(ambient + diffuse + specular, 1);

    // base color (white)
    var baseColor = vec4f(ambient + vec3f(1, 1, 1) * max(0.0, dot(L, N)) + specular, 1);

    // image texture 
    var showImageTexture : bool = 
        ((camera.flagsUI & ShowImageTextureTorus) != 0 && (camera.meshType == 0)) ||
        ((camera.flagsUI & ShowImageTexturePlane) != 0 && (camera.meshType == 1));
    if (showImageTexture) {
        // image texture 
        var texCol = textureSample(texImage, mySampler, fragData.uv);
        color = baseColor * texCol;
    }

    // procedural texture
    var showProcTexture : bool = 
        ((camera.flagsUI & ShowProcTextureTorus) != 0 && (camera.meshType == 0)) ||
        ((camera.flagsUI & ShowProcTexturePlane) != 0 && (camera.meshType == 1));
    if (showProcTexture) {
        var colA = vec4f(0.9, 0.9, 0.9, 1.0);
        var colB = vec4f(0.2, 0.2, 0.2, 1.0);
        let uv = fragData.uv;
        var frac = 0.0; 
        if (camera.meshType == 0) { // torus
            frac = step(sin(10*pi*uv.x) * sin(10*pi*uv.y), 0.0);
        }
        else { // plane
            frac = step(sin(10*pi*uv.x) + sin(10*pi*uv.y), 0.0);
        }
        color = mix(colA, colB, frac) * color;
    }

    // texture projection 
    if ((camera.flagsUI & EnableTextureProjection) != 0) {
        var projTC = camera.texProjMat * fragData.posWC;
        // compute tex coord    
        texCoord = vec2f(projTC.x / projTC.w, projTC.y / projTC.w);
        // look up texture color 
        var texCol = textureSample(texProj, mySampler, texCoord);
        
        // set texture color only inside projected rectangle
        // also prevent back projection
        if (texCoord.x >= 0 && texCoord.x <= 1 && 
            texCoord.y >= 0 && texCoord.y <= 1 && 
            projTC.w > 0) {
            color = baseColor * texCol;
        }
    }

    // env mapping 
    if ((camera.flagsUI & ShowEnvMap) != 0) {
        let NE = normalize(fragData.normalWC);
        let I = normalize(fragData.posWC.xyz - camera.eyeWC.xyz);
        var R : vec3f = normalize(reflect(I, NE));
        var dir = R;
        // Apply S(1, 1, -1) to dir since cube maps use a left-handed coord system
        dir.z = -dir.z;
        color = textureSample(texCubemap, mySampler, dir);
    }

    return color;
}
