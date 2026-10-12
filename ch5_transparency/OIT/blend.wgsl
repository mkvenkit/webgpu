// ----------------------------------------------------------------------
// blend.wgsl
// 
// Shader for sorting and blending transparent fragments.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

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

// a node in a per-pixel linked list
struct Node {
    next: u32,      // index of the next node, or 0xffffffff at the end
    color: u32,     // RGBA color packed into 4 x 8 bits
    depth: f32,     // fragment depth
}

// structure for rendering parameters
struct RenderParams {
    windowSize: vec2u,
    usePremultipliedAlpha: u32,
};

@group(0) @binding(0) var<storage, read> headsBuffer : HeadsBuffer;
@group(0) @binding(1) var<storage, read> linkedListBuffer : array<Node>;
@group(0) @binding(2) var<uniform> params : RenderParams;

// vertex shader entry 
@vertex fn vertex_main(
    @builtin(vertex_index) vIndex : u32
    ) -> @builtin(position) vec4f 
{
    return vec4f(vertices[vIndex], 1);
}

// fragment shader entry 
@fragment fn fragment_main(
    @builtin(position) position: vec4f
    ) -> @location(0) vec4f 
{
    // define max "depth" of fragments per (x, y)
    const MAX_FRAGMENTS = 15;
    // array to store fragments per (x, y)
    var fragments : array<Node, MAX_FRAGMENTS>;

    // get fragment (integer) coordinate
    let fragCoord = vec2<u32>(position.xy);
    // get fragment index in image buffer
    // i = y * width + x
    let index = fragCoord.y * params.windowSize.x + fragCoord.x;

    // ****************************************
    // traverse linked list and gather fragments:
    // ****************************************
    var head : u32 = headsBuffer.image_buffer[index];
    var fragCount = 0;
    while (head != 0xffffffff && fragCount < MAX_FRAGMENTS) {
        // get the node 
        let node = linkedListBuffer[head];
        // update head with next node
        head = node.next;
        // store node 
        fragments[fragCount] = node;
        // incr fragment count
        fragCount++;
    }

    // no transparent fragments at this pixel
    if (fragCount == 0) {
        discard;
    }

    // ************************************************************
    // sort the fragments in increasing depth (Z) using Bubble sort
    // ************************************************************

    for (var i = 0; i < fragCount; i++) {
        for (var j = (i + 1); j < fragCount; j++) {
            // compare and swap
            if (fragments[i].depth > fragments[j].depth) {
                let tmp = fragments[i];
                fragments[i] = fragments[j];
                fragments[j] = tmp;
            }
        }
    }

    // ****************************************
    // blend sorted fragments back to front
    // ****************************************

    // accumulated color, kept in pre-multiplied form
    var accum = vec4f(0.0);
    for (var i = fragCount - 1; i >= 0; i--) {
        var color = unpack4x8unorm(fragments[i].color);
        // straight-alpha colors are pre-multiplied here
        if (params.usePremultipliedAlpha == 0u) {
            color = vec4f(color.rgb * color.a, color.a);
        }
        // over operator: this fragment over everything behind it
        accum = color + (1.0 - color.a) * accum;
    }

    // return the pre-multiplied result; the blend state composites it
    // over the opaque scene
    return accum;
}
