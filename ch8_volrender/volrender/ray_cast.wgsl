// ----------------------------------------------------------------------
// ray_cast.wgsl
// 
// Ray casting shader.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------


// for mvp matrix
struct Uniforms {
  mvpMat : mat4x4<f32>,
}

// for transfer function
struct TransferFunction {
  tfParams: vec4f,       // x=winCenter, y=winWidth, z=exp, w=alphaScale
  lowColor: vec4f,       // rgb + enable (1/0)
  highColor: vec4f,     // rgb + padding
}

// uniforms 
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2) var rayExitTex: texture_2d<f32>;
@group(0) @binding(3) var texVolume: texture_3d<f32>;
@group(0) @binding(4) var<uniform> transferFunc: TransferFunction;
@group(0) @binding(5) var<uniform> canvasDims: vec4u;

// outputs from vertex shader
struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
}

// vertex shader 
@vertex fn vertex_main(
    @location(0) position: vec3f, 
    @location(1) color: vec3f
    ) -> VertexOut 
{
    var output : VertexOut;
    output.pos = uniforms.mvpMat * vec4f(position.xyz, 1.0);
    output.color = vec4f(color.rgb, 1.0);
    return output;
}

// Apply the transfer function 
fn applyTransferFunction(intensity: f32) -> vec4f {
    // extract parameters
    let windowCenter = transferFunc.tfParams.x;
    let windowWidth = transferFunc.tfParams.y;
    let exponent = transferFunc.tfParams.z;
    let alphaScale = transferFunc.tfParams.w;
    
    // apply windowing
    let halfWidth = windowWidth * 0.5;
    let windowed = clamp(
        (intensity - (windowCenter - halfWidth)) / windowWidth, 
        0.0, 1.0
    );
    
    // apply opacity curve
    let alpha = pow(windowed, exponent) * alphaScale;
    
    // color interpolation
    let color = mix(transferFunc.lowColor.xyz, transferFunc.highColor.xyz, windowed);
    
    return vec4f(color, alpha);
}

// fragment shader
@fragment fn fragment_main(
    fragData: VertexOut) -> @location(0) vec4f 
{
  // get the normalized coordinates to look up 2D texture which 
  // is drawn in the canvas
  let uv = fragData.pos.xy / vec2f(f32(canvasDims.x), f32(canvasDims.y));
  // sample the ray exit texture 
  let rayExit = textureSample(rayExitTex, texSampler, uv);

  // set ray parameters 
  let start = fragData.color.rgb;
  let end = rayExit.rgb;
  let dir = end - start;
  let len = length(dir);
  
  // check validity of ray 
  let validRay = len >= 0.001;
  let norm_dir = select(vec3f(0.0, 0.0, 1.0), dir / len, validRay);

  // set step size for ray marching 
  let stepSize = 0.01;
  // set total steps for this ray 
  let totalSteps = len / stepSize;

  // initialize destination color 
  var dst = vec4f(0.0);
  
  // fixed loop count because we cannot call textureSample() from a 
  // variable number of loop iterations 
  for (var i: i32 = 0; i < 256; i = i + 1) {
    let fi = f32(i);
    // Check if this step is valid
    let stepValid = f32(fi < totalSteps && validRay && dst.a < 0.95);
    // compute ray increment 
    let t = fi * stepSize;
    // advance ray along direction, but clamp to [0, 1]
    let p = clamp(start + t * norm_dir, vec3f(0.0), vec3f(1.0));

    // sample 3d texture 
    let val = textureSample(texVolume, texSampler, p).r;
    
    // Apply transfer function if flag set 
    let useTransferFunc = transferFunc.lowColor.w > 0.5;
    let tfResult = applyTransferFunction(val);
    let directResult = vec4f(val, val, val, val * 0.1);
    var src = select(directResult, tfResult, useTransferFunc) * stepValid;

    // premultiply alpha
    src = vec4f(src.rgb * src.a, src.a);
    // composite 
    dst = (1.0 - dst.a) * src + dst;
  }

  return dst;
}