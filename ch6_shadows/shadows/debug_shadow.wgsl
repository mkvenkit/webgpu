// ----------------------------------------------------------------------
// debug_shadow.wgsl
// 
// Shader for rendering shadow map on a quad for debugging purposes.
// 
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

// define quad vertices 
var <private> pos = array<vec2f, 6>(
        vec2f(-1.0, -1.0),
        vec2f( 1.0, -1.0),
        vec2f(-1.0,  1.0),
        vec2f(-1.0,  1.0),
        vec2f( 1.0, -1.0),
        vec2f( 1.0,  1.0)
);

// define texture coords
var <private> uv = array<vec2f, 6>(
    vec2f(0.0, 1.0),
    vec2f(1.0, 1.0),
    vec2f(0.0, 0.0),
    vec2f(0.0, 0.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, 0.0)
);

// output from vertex shader
struct VSOut {
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f,
};

// texture access
@group(0) @binding(0) var smap : texture_depth_2d;

// vertex shader 
@vertex
fn vertex_main(@builtin(vertex_index) vid : u32) -> VSOut {
    var out : VSOut;
    out.position = vec4f(pos[vid], 0.0, 1.0);
    out.uv = uv[vid];
    return out;
}

// fragment shader 
@fragment
fn fragment_main(in : VSOut) -> @location(0) vec4f {
    // load from texture without sampling or filtering
    // scale coords in [0, 1] to [0, w] or [0, h]
    let d = textureLoad(smap, vec2i(in.uv * vec2f(textureDimensions(smap))), 0);
    // grayscale
    return vec4f(vec3f(d), 1.0);
}
