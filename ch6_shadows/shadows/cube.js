// ----------------------------------------------------------------------
// cube.js
// 
// Create a cube.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Create cube vertices 
// Assuming unit cube centered at (0, 0, 0)

function createCubeVertices() {
    let vertices = new Float32Array([
        // Interleaved array:
        // x, y, z, nx, ny, nz,
        // Each face is made from 2 triangles
        
        // +X
        0.5, -0.5, 0.5, 1, 0, 0, 
        0.5, -0.5, -0.5, 1, 0, 0,
        0.5, 0.5, 0.5, 1, 0, 0, 
        0.5, 0.5, 0.5, 1, 0, 0, 
        0.5, -0.5, -0.5, 1, 0, 0, 
        0.5, 0.5, -0.5, 1, 0, 0,
        
        // -X 
        -0.5, 0.5, 0.5, -1, 0, 0, 
        -0.5, 0.5, -0.5, -1, 0, 0,
        -0.5, -0.5, 0.5, -1, 0, 0, 
        -0.5, -0.5, 0.5, -1, 0, 0, 
        -0.5, 0.5, -0.5, -1, 0, 0, 
        -0.5, -0.5, -0.5, -1, 0, 0, 
        

        // +Y
        0.5, 0.5, 0.5, 0, 1, 0, 
        0.5, 0.5, -0.5, 0, 1, 0, 
        -0.5, 0.5, 0.5, 0, 1, 0,
        -0.5, 0.5, 0.5, 0, 1, 0,
        0.5, 0.5, -0.5, 0, 1, 0,
        -0.5, 0.5, -0.5, 0, 1, 0,
        

        // -Y 
        -0.5, -0.5, 0.5, 0, -1, 0,
        -0.5, -0.5, -0.5, 0, -1, 0,
        0.5, -0.5, 0.5, 0, -1, 0,
        0.5, -0.5, 0.5, 0, -1, 0,
        -0.5, -0.5, -0.5, 0, -1, 0,
        0.5, -0.5, -0.5, 0, -1, 0,
        

        // +Z
        -0.5, 0.5, 0.5, 0, 0, 1,
        -0.5, -0.5, 0.5, 0, 0, 1,
        0.5, 0.5, 0.5, 0, 0, 1,
        0.5, 0.5, 0.5, 0, 0, 1,
        -0.5, -0.5, 0.5, 0, 0, 1,
        0.5, -0.5, 0.5, 0, 0, 1,
        
        // -Z
        0.5, -0.5, -0.5, 0, 0, -1,
        -0.5, -0.5, -0.5, 0, 0, -1,
        0.5, 0.5, -0.5, 0, 0, -1,
        0.5, 0.5, -0.5, 0, 0, -1,
        -0.5, -0.5, -0.5, 0, 0, -1,
        -0.5, 0.5, -0.5, 0, 0, -1,
        
    ]);

    return vertices;
}

// Create render pipeline for axes
export async function createCube(device, scale) {

    // get vertices
    const vertices = createCubeVertices();
    // create vertex buffer to store cube vertices 
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy vertex data to GPU
    device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

    // return vertex buffer and count
    return {
        vertexBuffer: vertexBuffer,
        count: vertices.length/6,
    };
}
