// ----------------------------------------------------------------------
// hello_triangle.wgsl
// 
// Shaders for the Hello Triangle example
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define triangle vertices 
var<private> pos = array<vec3f, 3>(
    vec3f( 0.0,  0.75, 0.0), 
    vec3f( 0.0, 0.0,  0.0), 
    vec3f( 0.75, 0.0,  0.0)
);
    
// vertex shader - entry function 
@vertex fn vertex_main(
    @builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f 
{
    // set output position using vertex_index 
    var output = vec4f(pos[vertexIndex], 1.0);
    return output;
}

// fragment shader - entry function 
@fragment fn fragment_main() -> @location(0) vec4f 
{
    // return a yellow color 
    return vec4f(1.0, 1.0, 0.0, 1.0);
}