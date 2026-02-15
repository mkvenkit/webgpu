// ----------------------------------------------------------------------
// render.wgsl
// 
// Render objects using shadow map.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// struct to hold camera params
struct Camera
{
    projMat: mat4x4<f32>,
    lookAtMat: mat4x4<f32>,
    shadowMat: mat4x4<f32>,
    lightPosW: vec4<f32>,    // world space light position
}

// struct to hold model params
struct ModelParams
{
    modelMat: mat4x4<f32>,
    nMat: mat4x4<f32>,
    color: vec4f,
}

// shadow parameters
struct ShadowParams {
    shadowsEnabled: u32,
    bias: f32,
    slopeScale: f32,
    enableSlopeBias: u32,
    filterType: u32,
}

// filter types
const NearestFilter     :u32 = 0u;
const LinearFilter      :u32 = 1u;
const PCFFilter         :u32 = 2u;
const PoissonFilter     :u32 = 3u;
const PoissonRotFilter  :u32 = 4u;

// fixed Poisson offsets
const poisson = array<vec2f, 4>(
    vec2f( 0.9092,  0.1441),
    vec2f( 0.8720, -0.4894),
    vec2f( 0.0545, -0.2021),
    vec2f(-0.8576, -0.4667),
);
// number of taps
const POISSON_TAPS : u32 = 4u;

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var shadowMapSampler: sampler_comparison;
@group(0) @binding(2) var shadowMap: texture_depth_2d;
@group(0) @binding(3) var<uniform> shadowParams : ShadowParams;
@group(1) @binding(0) var<uniform> modelParams: ModelParams;


// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) N: vec3f,
    @location(2) L: vec3f,
    @location(3) shadowPos: vec4f
}

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) normal: vec3f,
    ) -> VertexOut 
{
    var output : VertexOut;
    // compute clip space pos
    output.position = camera.projMat * camera.lookAtMat * modelParams.modelMat * vec4f(position, 1.0);
    // compute vertex pos in world space
    var worldPos = modelParams.modelMat * vec4f(position, 1.0);

    // All lighting computations are in world space.

    // normal matrix == inverse-transpose of model matrix
    let N = modelParams.nMat * vec4f(normal, 1.0);
    output.N = normalize(N.xyz);
    // compute light direction vector
    output.L = camera.lightPosW.xyz - worldPos.xyz;
    // compute shadow position in world space 
    output.shadowPos = camera.shadowMat * worldPos;    
    // set color
    output.color = modelParams.color;

    return output;
}

// random function
fn rand2(p: vec2f) -> f32 {
    let h = dot(p, vec2f(127.1, 311.7));
    return fract(sin(h) * 43758.5453);
}

// fragment shader entry
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
    // light params
    let N = normalize(fragData.N);
    let L = normalize(fragData.L);
    let ndotl = max(dot(N, L), 0.0);
    let diffuse = fragData.color.rgb * ndotl;

    // slope bias (gated)
    let slopeBias = f32(shadowParams.enableSlopeBias) * shadowParams.slopeScale * (1.0 - ndotl);

    // final bias 
    let bias = shadowParams.bias + slopeBias;

    // perspective divide for shadow pos 
    let shadowPos = fragData.shadowPos.xyz / fragData.shadowPos.w;

    // mask for valid light-space fragments
    let valid = f32(fragData.shadowPos.w > 0.0);

    // clamp safely
    let uv = clamp(shadowPos.xy, vec2f(0.0), vec2f(1.0));
    let z  = clamp(shadowPos.z, 0.0, 1.0);

    // look up shadow map texture size
    let texSize = vec2f(textureDimensions(shadowMap));
    // compute inverse 
    let texel   = 1.0 / texSize;

    // per-fragment rotation angle
    let angle = rand2(fragData.position.xy) * 6.28318530718; // 2*pi
    let c = cos(angle)  ;
    let s = sin(angle);
    let rot = mat2x2<f32>(
        c, -s,
        s,  c
    );

    // select filter without control flow
    let f = shadowParams.filterType;
    let wNearest = f32(f == NearestFilter);
    let wLinear  = f32(f == LinearFilter);
    let wPCF3    = f32(f == PCFFilter);
    let wPoisson = f32(f == PoissonFilter);
    let wPoissonRot = f32(f == PoissonRotFilter);

    // Always execute all samples, select by weights
    var visNearest = 0.0;
    var visLinear  = 0.0;
    var visPCF3    = 0.0;
    var visPoisson = 0.0;

    // nearest / linear (single sample)
    let s0 = textureSampleCompare(shadowMap, shadowMapSampler, uv, z - bias);
    
    visNearest = s0;
    visLinear  = s0; // hardware PCF when sampler is linear

    // manual 3x3 PCF
    var sum3 = 0.0;
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let off = vec2f(f32(x), f32(y)) * texel;
            sum3 += textureSampleCompare(shadowMap, shadowMapSampler, uv + off, z - bias);
        }
    }
    visPCF3 = sum3 / 9.0;

    // Poisson PCF (N taps)
    var sump = 0.0;
    for (var i = 0u; i < POISSON_TAPS; i++) {
        let offset = (wPoisson * poisson[i]) + (wPoissonRot * rot * poisson[i]); // select without branching
        sump += textureSampleCompare(
            shadowMap,
            shadowMapSampler,
            uv + offset * texel,
            z - bias
        );
    }
    visPoisson = sump / f32(POISSON_TAPS);


    // set final visiblity 
    let visibility =
        wNearest * visNearest +
        wLinear  * visLinear  +
        wPCF3    * visPCF3    +
        wPoisson * visPoisson + 
        wPoissonRot * visPoisson;

    let shadowOn = f32(shadowParams.shadowsEnabled);
    let finalVis = mix(1.0, visibility, shadowOn);

    // modulate color
    return vec4f(diffuse * finalVis, 1.0);
}