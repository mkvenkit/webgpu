// ----------------------------------------------------------------------
// slice.wgsl
// 
// 2D slice render
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define unit quad vertices in triangle-strip order
var<private> vertices = array<vec3f, 4>(
    vec3f(-1.0, 1.0, 0.0), 
    vec3f(-1.0, -1.0, 0.0), 
    vec3f(1.0, 1.0, 0.0), 
    vec3f(1.0, -1.0, 0.0),
);
// define texture coordinates 
var<private> texCoords = array<vec2f, 4>(
    vec2f(0.0, 0.0), 
    vec2f(0.0, 1.0), 
    vec2f(1.0, 0.0), 
    vec2f(1.0, 1.0),
);

struct SliceCtrl {
    imageScale: vec4f,
    sliceInfo: vec4f,        // .x: 0/1/2 for X/Y/Z. .y: fraction
};

// define uniforms
@group(0) @binding(0) var<uniform> sliceCtrl: SliceCtrl;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2) var texVolume: texture_3d<f32>;

// define a struct for vertex shader output
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) texCoord3D : vec3f,
}

// vertex shader
@vertex
fn vertex_main(@builtin(vertex_index) vIndex : u32) -> VertexOut {
    var output : VertexOut;
    output.position = vec4f(sliceCtrl.imageScale.xyz * vertices[vIndex], 1.0);
    let texCoord2D = texCoords[vIndex];
    let axis = sliceCtrl.sliceInfo.x;
    let fraction = sliceCtrl.sliceInfo.y;
    if (axis == 0.0) {
        output.texCoord3D = vec3f(fraction, texCoord2D.x, texCoord2D.y);
    }
    else if (sliceCtrl.sliceInfo.x == 1.0){  
        output.texCoord3D = vec3f(texCoord2D.x, fraction, texCoord2D.y);
    }
    else {
        output.texCoord3D = vec3f(texCoord2D.x, texCoord2D.y, fraction);
    }
    return output;
}

// fragment shader
@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
    return textureSample(texVolume, texSampler, fragData.texCoord3D).rrra;
}