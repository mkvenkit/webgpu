
// ----------------------------------------------------------------------
// teapot.js
// 
// Load the Utah Teapot from STL file.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------


// Read vertices from an STL file
function readTeapotVerticesSTL(stlString) {
    // Regular expressions to match the normals and vertices
    const normalRegex = /facet normal ([\s\S]*?)\n/;
    const vertexRegex = /vertex ([\s\S]*?)\n/g;

    // Split the file into facets (ignoring the start and end of the file)
    const facets = stlString.split('endfacet').slice(0, -1);

    // Array to hold all the numbers
    let numbers = [];

    facets.forEach(facet => {
        // Extract the normal for this facet
        let normalMatch = facet.match(normalRegex);
        if (normalMatch) {
            let normals = normalMatch[1].trim().split(/\s+/).map(Number);
            // For each vertex, add the normal and vertex to the numbers array
            let vertexMatch;
            while ((vertexMatch = vertexRegex.exec(facet)) !== null) {
                let vertices = vertexMatch[1].trim().split(/\s+/).map(Number);
                numbers.push(...vertices);  // Add vertex x, y, z
                numbers.push(...normals);   // Add normal nx, ny, nz
            }
        }
    });

    // Convert the numbers array into a Float32Array and return
    return new Float32Array(numbers);
}

// Create render pipeline for axes
export async function createTeapot(device) {
    
    let teapot = {};

    await fetch("teapot.stl")
    .then(response => response.text())
    .then(strSTL => {
        // get vertices
        const vertices = readTeapotVerticesSTL(strSTL);
        // create vertex buffer to store cube vertices 
        const vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        // copy vertex data to GPU
        device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

        // return vertex buffer and count
        teapot = {
            vertexBuffer: vertexBuffer,
            count: vertices.length/6,
        };
    })
    .catch(error => {
        console.error('Failed to fetch the file:', error);
        return null;
    });

    return teapot;
}
