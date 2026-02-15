// ----------------------------------------------------------------------
// plane.js
// 
// Create a 2D plane.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// A 2D plane in XY centered at (0, 0, 0)  
// x, y, z, nx, ny, nz
function createPlaneVertices(side) {
    let vertices = new Float32Array([
        // 2 x triangles
         -side/2.0,  side/2.0, 0.0, 0.0, 0.0, 1.0, 
        -side/2.0, -side/2.0,  0.0, 0.0, 0.0, 1.0, 
         side/2.0,  side/2.0,  0.0, 0.0, 0.0, 1.0, 
         side/2.0,  side/2.0,  0.0, 0.0, 0.0, 1.0, 
         -side/2.0, -side/2.0, 0.0, 0.0, 0.0, 1.0,    
         side/2.0, -side/2.0,  0.0, 0.0, 0.0, 1.0, 
    ]);
    return vertices;
}

// Create render pipeline for axes
export async function createPlane(device, side) {

    // get vertices
    const vertices = createPlaneVertices(side);
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
