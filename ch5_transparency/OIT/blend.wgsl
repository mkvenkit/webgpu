// ----------------------------------------------------------------------
// blend.wgsl
// 
// Shader for sorting and blending transparent fragments.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

// define quad vertices 
var<private> vertices = array<vec3f, 4>(
    vec3f(1.0, 1.0, 0.0), 
    vec3f(-1.0, 1.0, 0.0), 
    vec3f(1.0, -1.0, 0.0), 
    vec3f(-1.0, -1.0, 0.0),
);

// structure to save head indices at every (x, y)
// index_counter is used to keep track of linked list size
struct HeadsBuffer
{
    index_counter: u32,
    image_buffer: array<u32>
}

// structure for rendering parameters
struct RenderParams {
    windowSize: vec2u,                  // (w, h) 8 bytes
    usePremultipliedAlpha: u32,         // 4 bytes
    _pad0: u32,                         // padding to make total 16 bytes
};

@group(0) @binding(0) var<storage, read_write> headsBuffer : HeadsBuffer;
@group(0) @binding(1) var<storage, read_write> linkedListBuffer : array<vec4u>;
@group(0) @binding(2) var<uniform> params : RenderParams;

// vertex shader entry 
@vertex fn vertex_main(
    @builtin(vertex_index) vIndex : u32
    ) -> VertexOut 
{
    var output : VertexOut;
    output.position = vec4f(vertices[vIndex], 1);
    output.color = vec4f(1, 1, 0, 1);
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    // define max "depth" of fragments per (x, y)
    const MAX_FRAGMENTS = 15;
    // array to store fragments per (x, y)
    var fragments : array<vec4u, MAX_FRAGMENTS>;

    // get fragment (integer) coordinate
    let fragCoord = vec2<u32>(fragData.position.xy);
    // get fragment index in image buffer
    // i = y * width + x
    var index = fragCoord.y * params.windowSize.x + fragCoord.x;

    // ****************************************
    // traverse linked list and gather fragments:
    // ****************************************
    var head : u32 = headsBuffer.image_buffer[index];
    var fragCount = 0;
    while (head != 0xffffffff && fragCount < MAX_FRAGMENTS) {
        // get the item 
        var item = linkedListBuffer[head];
        // update head with next item
        head = item.x;
        // store item 
        fragments[fragCount] = item;
        // incr fragmemnt count
        fragCount++;
    }

    // needed?
    if (fragCount == 0) {
        discard;
    }

    // ************************************************************
    // sort the fragments in increasing depth (Z) using Bubble sort
    // ************************************************************

    for (var i = 0; i < fragCount; i++) {
        for (var j = (i + 1); j < fragCount; j++) {
            // get depth values at i and j 
            var depthI = bitcast<f32>(fragments[i].z);
            var depthJ = bitcast<f32>(fragments[j].z);
            // compare and swap
            if (depthI > depthJ) {
                var tmp = fragments[i];
                fragments[i] = fragments[j];
                fragments[j] = tmp;
            }
        }
    }

    // ****************************************
    // blend sorted fragments 
    // ****************************************

    // get color of last (highest Z) fragment 
    var color = unpack4x8unorm(fragments[fragCount-1].y);
    // premultiply alpha on last layer
    var finalColor = vec4f(color.a * color.rgb, color.a);
    // loop through and blend sorted fragments - back to front
    for (var i = fragCount-2; i >= 0; i--) {
        // unpack color 
        color = unpack4x8unorm(fragments[i].y);

        // premultiplied compositing (back-to-front)
        if (params.usePremultipliedAlpha != 0u) {
            var a = color.a;
            finalColor = vec4f(color.rgb + (1.0 - a) * finalColor.rgb, a + (1.0 - a) * finalColor.a);
        }
        else {  
            var mixed = mix(color, finalColor, color.a);
            finalColor = vec4f(mixed.rgb, finalColor.a);
        }
    }

    // return final color 
    return finalColor;
}
