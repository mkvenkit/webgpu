// ----------------------------------------------------------------------
// transparent.wgsl
// 
// Shader for transparenet objects that initializes the data structures.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// define a struct to hold vertex and color 
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

// define a struct to hold camera parameters
struct Camera {
    mvMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
}

// structure to save head indices at every (x, y)
// index_counter is used to keep track of linked list size
struct HeadsBuffer
{
    index_counter: atomic<u32>,
    image_buffer: array<atomic<u32>>
}

// structure for rendering parameters
struct RenderParams {
    windowSize: vec2u,                  // (w, h) 8 bytes
    usePremultipliedAlpha: u32,         // 4 bytes
    _pad0: u32,                         // padding to make total 16 bytes
};

// define uniform to hold mvp matrix
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<storage, read_write> headsBuffer : HeadsBuffer;
@group(0) @binding(2) var<storage, read_write> linkedListBuffer : array<vec4u>;
@group(0) @binding(3) var depthTexture: texture_depth_2d;
@group(0) @binding(4) var<uniform> params : RenderParams;

// vertex shader entry 
@vertex fn vertex_main(
    @location(0) position: vec3f,
    @location(1) color: vec4f,
    ) -> VertexOut 
{
    var output : VertexOut;
    output.position = camera.projMat * camera.mvMat * vec4f(position, 1.0);
    output.color = color;
    return output;
}

// fragment shader entry 
@fragment fn fragment_main(fragData: VertexOut,)
{
    // get fragment (integer) coordinate
    let fragCoord = vec2<u32>(fragData.position.xy);

    // discard fragment if current fragment is behind opaque object
    let depthVal = textureLoad(depthTexture, fragCoord, 0);
    if (fragData.position.z >= depthVal) {
        discard;
    }

    // get fragment index in image buffer
    // i = y * width + x
    var index = fragCoord.y * params.windowSize.x + fragCoord.x;

    // increment counter atomically 
    var count = atomicAdd(&headsBuffer.index_counter, 1u);

    // exchange old head and new atomically
    var old_head = atomicExchange(&headsBuffer.image_buffer[index], count);

    // create linked list item
    var item : vec4u;
    // next 
    item.x = old_head;
    
    // set color:

    // using premultiplied alpha ?
    if (params.usePremultipliedAlpha != 0u) {
        item.y = pack4x8unorm(vec4f(fragData.color.rgb * fragData.color.a, fragData.color.a));
    }
    else {
        item.y = pack4x8unorm(fragData.color);
    }
    // depth 
    item.z = bitcast<u32>(fragData.position.z);
    // w - unused
    item.w = 0;

    // update linked list 
    linkedListBuffer[count] = item;
}
