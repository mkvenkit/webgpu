# Toroidal Helix

This examples draws a helix wrapped around a torus.

# Server

```
http-server -c 1
```

# Drawing Multiple Primitives 

Drawing the helix and the great circle together.

How to set different colors?

## Method 1

```
    // get vertices
    const verticesH = createHelixVertices();
    console.log('nVert = ' + verticesH.length/3)
    // create vertex buffer to store cube vertices 
    const vertexBufferHelix = device.createBuffer({
        size: verticesH.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy vertex data to GPU
    device.queue.writeBuffer(vertexBufferHelix, 0, verticesH, 0, verticesH.length);


    // get vertices
    const verticesC = createCircleVertices();
    console.log('Circ nVert = ' + verticesC.length/3)
    // create vertex buffer to store cube vertices 
    const vertexBufferCircle = device.createBuffer({
        size: verticesC.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy vertex data to GPU
    device.queue.writeBuffer(vertexBufferCircle, 0, verticesC, 0, verticesC.length);

...
    // create a GPUVertexBufferLayout object
    const vertexBufferLayout = [
        {
            attributes: [
                {
                    // position 
                    format: 'float32x3',
                    offset: 0,
                    shaderLocation: 0
                }
            ],
            arrayStride: 12, // 3 floats x 4 bytes each 
        }
    ];

...
        // set vertex buffer
        pass.setVertexBuffer(0, vertexBufferHelix);
        // draw
        pass.draw(verticesH.length/3); 
        
        // set vertex buffer
        pass.setVertexBuffer(0, vertexBufferCircle);
        // draw
        pass.draw(verticesC.length/3); 
```

## Method 2 

```
    // define empty array 
    let vert = [];
    // get vertices
    const countH = createHelixVertices(vert);
    console.log('nVert = ' + countH)
    const countC = createCircleVertices(vert);
    console.log('nVert = ' + countC)
    let vertices = new Float32Array(vert);

    // create vertex buffer to store cube vertices 
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // copy vertex data to GPU
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    // create a GPUVertexBufferLayout object
    const vertexBufferLayout = [
        {
            attributes: [
                {
                    // position 
                    format: 'float32x3',
                    offset: 0,
                    shaderLocation: 0
                }
            ],
            arrayStride: 12, // 3 floats x 4 bytes each 
        }
    ];
...
        // draw helix
        pass.draw(countH); 
        // draw circle 
        pass.draw(countC, 1, countH);
```