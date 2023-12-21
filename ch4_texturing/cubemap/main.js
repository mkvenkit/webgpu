// ----------------------------------------------------------------------
// plane.js
// 
// Testing specular relfections
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {mat4, vec3} from '../../common/wgpu-matrix.module.js';
import { createAxes } from './axis.js';
import { createCube } from './cube.js';
import { createSkybox } from './skybox.js';
import { createTorus } from './torus.js';

async function createCubemapFromImages(device, fileNames) 
{
    // The order of the array layers is [+X, -X, +Y, -Y, +Z, -Z]
    const imgSrcs = [
        'posx.jpg',
        'negx.jpg',
        'posy.jpg',
        'negy.jpg',
        'posz.jpg',
        'negz.jpg',
    ];
    const promises = imgSrcs.map(async (src) => {
        const response = await fetch(src);
        return createImageBitmap(await response.blob());
    });
    const imageBitmaps = await Promise.all(promises);

    let cubemapTexture = device.createTexture({
        dimension: '2d',
        // Create a 2d array texture.
        // Assume each image has the same size.
        size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let i = 0; i < imageBitmaps.length; i++) {
        const imageBitmap = imageBitmaps[i];
        device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: cubemapTexture, origin: [0, 0, i] },
            [imageBitmap.width, imageBitmap.height]
        );
    }

    return cubemapTexture;
}

// create mip maps for given image
async function createMipmaps(imageBitmap) {
    let width = imageBitmap.width;
    let height = imageBitmap.height;

    console.log(width, height);

    const mipmaps = [];

    while (width > 1 || height > 1) {
        console.log(width, height);

        // Create a canvas
        let canvas = new OffscreenCanvas(width, height);
        let ctx = canvas.getContext('2d');

        // Draw the image onto the canvas
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        // Get the image data from the canvas
        let imageData = ctx.getImageData(0, 0, width, height);

        // Store the mipmap data
        mipmaps.push({ data: imageData.data, width, height });

        // Scale down for the next level
        width = Math.max(1, Math.floor(width / 2));
        height = Math.max(1, Math.floor(height / 2));
    }

    return mipmaps;
}

async function createCubemapWithMips(device, fileName) {

    // fetch texture
    let response = await fetch(fileName);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const imageBitmap = await createImageBitmap(await response.blob());

    // Step 2: Create canvas and context
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // Step 3: Compute tile dimensions
    let tileWidth = imageBitmap.width / 4;
    let tileHeight = imageBitmap.height / 3;
    //console.log(tileWidth, tileHeight);

    canvas.width = tileWidth;
    canvas.height = tileHeight;

    let gridPositions = [[1, 2], [1, 0], [0, 1], [2, 1], [1, 1], [1, 3]];
    
    let tiles = [];
    let tileIndex = 0;

    const mips = [];

    for (let [row, col] of gridPositions) {
        let x = col * tileWidth;
        let y = row * tileHeight;

        //console.log(x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        ctx.drawImage(imageBitmap, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        let imageData = ctx.getImageData(0, 0, tileWidth, tileHeight);
        console.log(imageData);
        tiles.push(imageData);

        let mipmaps = await createMipmaps(createImageBitmap(imageData, 0, 0, tileWidth, tileHeight));
        mips.push(mipmaps);

        // Create an image data URL from the canvas content
        let dataURL = canvas.toDataURL();
        // Set this data URL to the corresponding <img> element
        let imgId = `face${tileIndex + 1}`;
        let imgElement = document.getElementById(imgId);
        //console.log(imgElement);
        if (imgElement) {
            imgElement.src = dataURL;
        }

        tileIndex++;
    }

    const cubeMapTexture = device.createTexture({
        size: {
            width: tileWidth,      // Width of one face of the cube map
            height: tileHeight,    // Height of one face of the cube map
            depthOrArrayLayers: 6  // 6 layers, one for each face of the cube
        },
        format: 'rgba8unorm',       // The format of the texture
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        dimension: '2d',            // Indicates that each layer is a 2D texture
        mipLevelCount: mips.length,
    });

    console.log(mips);

    for (let layer = 0; layer < 6; layer++) {
        for (let mip = 0; mip < mips.length; mip++) {
            const mipWidth = Math.max(1, tileWidth >> mip);
            const mipHeight = Math.max(1, tileHeight >> mip);
    
            device.queue.writeTexture(
                { texture: cubeMapTexture, mipLevel: mip, origin: { x: 0, y: 0, z: layer } },
                mips[mip].data, // Data of the mipmap
                { /* define the layout of the mipmap data */ },
                { width: mipWidth, height: mipHeight, depthOrArrayLayers: 1 }
            );
        }
    }

    return cubeMapTexture;
}
async function createCubemap(device, fileName) {

    // fetch texture
    let response = await fetch(fileName);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const imageBitmap = await createImageBitmap(await response.blob());

    // Step 2: Create canvas and context
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // Step 3: Compute tile dimensions
    let tileWidth = imageBitmap.width / 4;
    let tileHeight = imageBitmap.height / 3;
    //console.log(tileWidth, tileHeight);

    canvas.width = tileWidth;
    canvas.height = tileHeight;

    let gridPositions = [[1, 2], [1, 0], [0, 1], [2, 1], [1, 1], [1, 3]];
    
    let tiles = [];
    let tileIndex = 0;

    for (let [row, col] of gridPositions) {
        let x = col * tileWidth;
        let y = row * tileHeight;
        //console.log(x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        ctx.drawImage(imageBitmap, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        tiles.push(ctx.getImageData(0, 0, tileWidth, tileHeight));

        // Create an image data URL from the canvas content
        let dataURL = canvas.toDataURL();
        // Set this data URL to the corresponding <img> element
        let imgId = `face${tileIndex + 1}`;
        let imgElement = document.getElementById(imgId);
        //console.log(imgElement);
        if (imgElement) {
            imgElement.src = dataURL;
        }

        tileIndex++;
    }

    const cubeMapTexture = device.createTexture({
        size: {
            width: tileWidth,      // Width of one face of the cube map
            height: tileHeight,    // Height of one face of the cube map
            depthOrArrayLayers: 6  // 6 layers, one for each face of the cube
        },
        format: 'rgba8unorm',       // The format of the texture
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        dimension: '2d'            // Indicates that each layer is a 2D texture
    });


    tiles.forEach((canvas, index) => {
        const source = { source: canvas };
        const destination = { texture: cubeMapTexture, origin: { x: 0, y: 0, z: index } };
        const copySize = { width: canvas.width, height: canvas.height, depthOrArrayLayers: 1 };

        // Copy the canvas content to the cube map texture
        device.queue.copyExternalImageToTexture(source, destination, copySize);
    });


    // set cubemap image into HTML
    document.getElementById('cubemap').src = fileName;

    return cubeMapTexture;
}

// write matrices 
function writeToBuffer(device, buffer, modelMat, projMat, lookAtMat, nMat, eye, timeStep)
{
    let offset = 0;

    // write modelMat
    if (modelMat) {
        device.queue.writeBuffer(
            buffer,
            offset,
            modelMat.buffer,
            modelMat.byteOffset,
            modelMat.byteLength
        );
        offset += modelMat.byteLength;
    }

    // write lookAtMat
    if (lookAtMat) {
        device.queue.writeBuffer(
            buffer,
            offset,
            lookAtMat.buffer,
            lookAtMat.byteOffset,
            lookAtMat.byteLength
        );
        offset += lookAtMat.byteLength;
    }

    // write projMat
    if (projMat) {
        device.queue.writeBuffer(
            buffer,
            offset,
            projMat.buffer,
            projMat.byteOffset,
            projMat.byteLength
        );
        offset += projMat.byteLength;
    }

    // write nMat
    if (nMat) {
        device.queue.writeBuffer(
            buffer,
            offset,
            nMat.buffer,
            nMat.byteOffset,
            nMat.byteLength
        );
        offset += nMat.byteLength;
    }

    // eye position
    if (eye) {
        device.queue.writeBuffer(
            buffer,
            offset,
            new Float32Array(eye),
            0,
            4
        );
        offset += 16;
    }

    // write timeStep
    if (timeStep) {
        device.queue.writeBuffer(
            buffer,
            offset,
            new Float32Array([timeStep]),
            0,
            1
        );
        offset += 4;
    }

    return offset;
}

class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
}

function intersectRayCubeFromInside(ray, cubeMin, cubeMax) {
    const invDir = { x: 1.0 / ray.direction.x, y: 1.0 / ray.direction.y, z: 1.0 / ray.direction.z };

    const tTop = { 
        x: (cubeMax.x - ray.origin.x) * invDir.x,
        y: (cubeMax.y - ray.origin.y) * invDir.y,
        z: (cubeMax.z - ray.origin.z) * invDir.z
    };
    const tBot = { 
        x: (cubeMin.x - ray.origin.x) * invDir.x,
        y: (cubeMin.y - ray.origin.y) * invDir.y,
        z: (cubeMin.z - ray.origin.z) * invDir.z
    };

    const tMax = { 
        x: Math.max(tTop.x, tBot.x),
        y: Math.max(tTop.y, tBot.y),
        z: Math.max(tTop.z, tBot.z)
    };

    const tFar = Math.min(tMax.x, Math.min(tMax.y, tMax.z));

    if (tFar < 0.0) {
        return null; // Ray points away from all faces, no intersection
    }

    return {
        x: ray.origin.x + tFar * ray.direction.x,
        y: ray.origin.y + tFar * ray.direction.y,
        z: ray.origin.z + tFar * ray.direction.z
    };
}


// main function 
async function main() {

    // get WebGPU adapter 
    const adapter = await navigator.gpu?.requestAdapter();
    // get WebGPU device
    const device = await adapter?.requestDevice();
    if (!device) {
        alert("Couldn't get WebGPU device! Need a browser that supports WebGPU!");
        return;
    }

    // get the canvas from the document
    const canvas = document.querySelector('canvas');
    // get WebGPU rendering context from the canvas
    const context = canvas.getContext('webgpu');
    // configure the context
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    // Test the function
    const ray = new Ray({ x: 0.4, y: 0.0, z: 0.0 }, { x: 0.0, y: 1.0, z: 0.0 });
    const cubeMin = { x: -0.5, y: -0.5, z: -0.5 };
    const cubeMax = { x: 0.5, y: 0.5, z: 0.5 };

    const intersection = intersectRayCubeFromInside(ray, cubeMin, cubeMax);
    console.log("Intersection point:", intersection);


    //let cubeMapTexture = await createCubemap(device, "cubemap-desert.png");
    //let cubeMapTexture = await createCubemap(device, "cubemap-info.png");
    //let cubeMapTexture = await createCubemap(device, "colors.png");
    //let cubeMapTexture = await createCubemapFromImages(device, []);
    let cubeMapTexture = await createCubemap(device, "buddha.jpg");

    let skybox = await createSkybox(device, "skybox.wgsl", cubeMapTexture);

    let cube = await createCube(device, "envmap.wgsl", cubeMapTexture);

    let torus = await createTorus(0.5, 2, device, "envmap.wgsl", cubeMapTexture);

    let axes = await createAxes(15, device);

    // create a depth texture 
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // create a GPURenderPassDescriptor object
    const renderPassDescriptor = {
        colorAttachments: [{
          clearValue:  { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView()
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    let now = 0;
    let timeStep = 0.0;

    // revolving camera 
    const camHeight = 5.0;
    const camRadius = 50.0
    let camTheta = 0.0;
    let eye = [0, 5, 15, 1];
    let target = [0.0, 10.0, 0.0];
    const up = [0, 1, 0];
    const fov = 70;
    let aspect = canvas.width / canvas.height;

    function updateView() {

        /*
        // update time 
        let now = Date.now() / 2000;
        // rotate 
        mat4.rotate(
            lookAtMat,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            lookAtMat
        );
        */
        
        // update theta 
        camTheta += 0.001;
        // rotate 
        eye = [camRadius * Math.cos(camTheta), camHeight, camRadius * Math.sin(camTheta), 1];
        //target = [0.0, Math.cos(camTheta), Math.sin(camTheta)];
        // create lookAt 
        let lookAtMat = mat4.lookAt([eye[0], eye[1], eye[2]], target, up);

        // create projection matrix 
        let projMat = mat4.perspective(
            fov * Math.PI / 180,
            aspect,
            1,
            3000
        );

        let modelMat = mat4.identity();
        modelMat = mat4.rotation(vec3.fromValues(1, 1, 1), 0.005*timeStep);
        
        let nMat = mat4.create();
        nMat = mat4.transpose(mat4.inverse(modelMat));

        // write uniform buffer to device 
        writeToBuffer(device, skybox.cameraBuffer, modelMat, projMat, lookAtMat, nMat, eye, timeStep);
        writeToBuffer(device, cube.cameraBuffer, modelMat, projMat, lookAtMat, nMat, eye, timeStep);
        writeToBuffer(device, torus.cameraBuffer, modelMat, projMat, lookAtMat, nMat, eye, timeStep);
        writeToBuffer(device, axes.cameraBuffer, modelMat, projMat, lookAtMat, nMat, eye, timeStep);
    }

    // define render function 
    function render() {

        // increment time step
        timeStep += 1;

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Plane encoder' });
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        updateView();
        
        // ********** 
        // Draw skybox:
        // **********

        // set the render pipeline
        pass.setPipeline(skybox.pipeline);
        // set bind group
        pass.setBindGroup(0, skybox.uniformBindGroup);
        // set vertex buffer
        pass.setVertexBuffer(0, skybox.vertexBuffer);
        // draw
        pass.draw(skybox.count);


        // ********** 
        // Draw cube:
        // **********

        // set the render pipeline
        pass.setPipeline(cube.pipeline);
        // set bind group
        pass.setBindGroup(0, cube.uniformBindGroup);
        // set vertex buffer
        pass.setVertexBuffer(0, cube.vertexBuffer);
        // draw
        pass.draw(cube.count);
        //pass.draw(6, 1, 12);

        // ********** 
        // Draw torus:
        // **********

        // set the render pipeline
        pass.setPipeline(torus.pipeline);
        // set bind group
        pass.setBindGroup(0, torus.uniformBindGroup);
        // set vertex buffer
        pass.setVertexBuffer(0, torus.vertexBuffer);
        // draw
        pass.draw(torus.count);

        // ********** 
        // Draw axes:
        // **********

        // set the render pipeline
        pass.setPipeline(axes.pipeline);
        // set bind group
        pass.setBindGroup(0, axes.uniformBindGroup);
        // set vertex buffer
        pass.setVertexBuffer(0, axes.vertexBuffer);
        // draw
        pass.draw(axes.count);

        // end render pass
        pass.end();
        // end commands 
        const commandBuffer = encoder.finish();
        // submit to GPU queue
        device.queue.submit([commandBuffer]);

        // request animation
        requestAnimationFrame(render);
    }

    // request animation
    requestAnimationFrame(render);
}

// call main function 
main();


