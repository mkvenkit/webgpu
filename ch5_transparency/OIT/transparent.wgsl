// ----------------------------------------------------------------------
// transparent.wgsl
// 
// Shader for transparent objects: adds each fragment to the
// per-pixel linked list instead of writing a color.
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

// define uniforms and storage buffers
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<storage, read_write> headsBuffer : HeadsBuffer;
@group(0) @binding(2) var<storage, read_write> linkedListBuffer : array<Node>;
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
@fragment fn fragment_main(fragData: VertexOut)
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
    let index = fragCoord.y * params.windowSize.x + fragCoord.x;

    // allocate a node by incrementing the counter atomically
    let count = atomicAdd(&headsBuffer.index_counter, 1u);
    // drop the fragment if the linked list buffer is full
    if (count >= arrayLength(&linkedListBuffer)) {
        return;
    }

    // make the new node the head of this pixel's list
    let old_head = atomicExchange(&headsBuffer.image_buffer[index], count);

    // set color, pre-multiplied if requested
    var color = fragData.color;
    if (params.usePremultipliedAlpha != 0u) {
        color = vec4f(color.rgb * color.a, color.a);
    }

    // write the linked list node
    linkedListBuffer[count] = Node(old_head, pack4x8unorm(color), fragData.position.z);
}
