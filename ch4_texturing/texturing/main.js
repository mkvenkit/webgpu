// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for texturing example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Adding type check for VSCode
// --@ts-check

// imports from wgpu-matrix 
import {vec3, mat4, utils} from '../../common/wgpu-matrix.module.js';

// other imports
import {createTorus } from './torus.js';
import {createAxes } from './axis.js';
import {createPlane} from './plane.js'
import { createFrustum } from './frustum.js';
import { createSkybox } from './skybox.js';

// Bit flags for UI
const UIFlags = {
    ShowImageTextureTorus:          0x01,
    ShowImageTexturePlane:          0x02,
    ShowProcTextureTorus:           0x04,
    ShowProcTexturePlane:           0x08,
    ShowNormalMappingTorus:         0x10,
    ShowNormalMappingPlane:         0x20,
    EnableTextureProjection:        0x40,
    EnableBillboardTexture:         0x80,
    ShowSkyBox:                     0x0100,
    ShowEnvMap:                     0x0200,
};

/**
 * Update UI flags 
 * @returns Uint32Array single uint32 
 */
function getUIFlags() {
    // write flags 
    let flags = new Uint32Array([0]);
        
    // Show image texture on torus
    if (document.querySelector('#show_img_tex_torus').checked) {
        flags[0] |= UIFlags.ShowImageTextureTorus;
    }
    // Show image texture on plane
    if (document.querySelector('#show_img_tex_plane').checked) {
        flags[0] |= UIFlags.ShowImageTexturePlane;
    }
    // Use procedural texture on torus
    if (document.querySelector('#show_proc_tex_torus').checked) {
        flags[0] |= UIFlags.ShowProcTextureTorus;
    }
    // Use procedural texture on plane
    if (document.querySelector('#show_proc_tex_plane').checked) {
        flags[0] |= UIFlags.ShowProcTexturePlane;
    }
    // Enable/disable texture projection
    if (document.querySelector('#enable_tex_proj').checked) {
        flags[0] |= UIFlags.EnableTextureProjection;
    }
    // Use normal mapping on torus
    if (document.querySelector('#show_nm_tex_torus').checked) {
        flags[0] |= UIFlags.ShowNormalMappingTorus;
    }
    // Use normal mapping on plane
    if (document.querySelector('#show_nm_tex_plane').checked) {
        flags[0] |= UIFlags.ShowNormalMappingPlane;
    }
    // Enable/disable texture billboard
    if (document.querySelector('#enable_tex_billboard').checked) {
        flags[0] |= UIFlags.EnableBillboardTexture;
    }
    // Show skybox
    if (document.querySelector('#show_skybox').checked) {
        flags[0] |= UIFlags.ShowSkyBox;
    }
    // Show envmap
    if (document.querySelector('#show_env_map').checked) {
        flags[0] |= UIFlags.ShowEnvMap;
    }

    return flags;
}
/**
 * Write values to uniform buffer used in shaders
 * @param {GPUDevice} device - WebGPU GPUDevice object
 */
function writeUniformBuffer(device, buffer,
    modelMat, lookAtMat, projMat, nMatEC, nMatWC, texProjMatFull,
    light_pos, eye, 
    timeStep, flagsUI, meshType) 
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

    // write nMatEC
    if (nMatEC) {
        device.queue.writeBuffer(
            buffer,
            offset,
            nMatEC.buffer,
            nMatEC.byteOffset,
            nMatEC.byteLength
        );
        offset += nMatEC.byteLength;
    }

    // write nMatWC
    if (nMatWC) {
        device.queue.writeBuffer(
            buffer,
            offset,
            nMatWC.buffer,
            nMatWC.byteOffset,
            nMatWC.byteLength
        );
        offset += nMatWC.byteLength;
    }

    // write texProjMat
    if (texProjMatFull) {
        device.queue.writeBuffer(
            buffer,
            offset,
            texProjMatFull.buffer,
            texProjMatFull.byteOffset,
            texProjMatFull.byteLength
        );
        offset += texProjMatFull.byteLength;
    }

    // light position
    if (light_pos) {
        device.queue.writeBuffer(
            buffer,
            offset,
            new Float32Array(light_pos),
            0,
            4
        );
        offset += 16;
    }

    // eye position in WC
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

    // write UI flags 
    if (flagsUI) {
        device.queue.writeBuffer(
            buffer,
            offset,
            flagsUI,
            0,
            1
        );
        offset += 4;
    }

    // write mesh type 
    if (meshType) {
        device.queue.writeBuffer(
            buffer,
            offset,
            new Int32Array([meshType]),
            0,
            1
        );
        offset += 4;
    }
}

/**
 * Given an image file, create and return a WebGPU GPUTexture object 
 * @param {GPUDevice} device 
 * @param {string} fileName 
 * @param {boolean} useMipMaps 
 * @returns GPUTexture
 */
async function createTextureFromImageFile(device, fileName, useMipMaps) {
    // fetch texture
    let response = await fetch(fileName);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const imgBitmap = await createImageBitmap(await response.blob());
    let imageTexture = null;
    // create texture 
    if (useMipMaps) {
        // create mipmaps 
        const mips = await createMipmaps(imgBitmap);

        // create texture 
        imageTexture = device.createTexture({
            size: [mips[0].width, mips[0].height],
            mipLevelCount: mips.length,
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        // write data 
        for (let mipLevel = 0; mipLevel < mips.length; mipLevel++) {
            const { data, width, height } = mips[mipLevel];

            device.queue.writeTexture(
                { texture: imageTexture, mipLevel: mipLevel },
                data,
                { bytesPerRow: width * 4 },
                { width, height }
            );
        }
    }
    else {
        imageTexture = device.createTexture({
            size: [imgBitmap.width, imgBitmap.height, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
            { source: imgBitmap },
            { texture: imageTexture },
            [imgBitmap.width, imgBitmap.height]
        );
    }

    return imageTexture;
}

/**
 * Create mipmaps from given image of type ImageBitmap
 * @param {ImageBitmap} imageBitmap 
 * @returns Promise<{{data: imageData.data, width: number, height: number }[]}>
 */
async function createMipmaps(imageBitmap) {
    // get image dimensions
    let width = imageBitmap.width;
    let height = imageBitmap.height;

    // define mipmap array
    let mipmaps = [];

    while (width > 1 || height > 1) {
        // create an offscreen canvas
        let canvas = new OffscreenCanvas(width, height);
        let ctx = canvas.getContext('2d');

        // draw the image onto the canvas
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        // get the image data from the canvas
        let imageData = ctx.getImageData(0, 0, width, height);

        // store the mipmap data
        mipmaps.push({data: imageData.data, width, height });

        // Scale down for the next level
        width = Math.max(1, Math.floor(width / 2));
        height = Math.max(1, Math.floor(height / 2));
    }

    return mipmaps;
}

/**
 * Create a cubemap texture given a set of 6 images.
 * The order of the images is +X, -X, +Y, -Y, +Z, -Z.
 * @param {GPUDevice} device 
 * @param {string[]} fileNames 
 * @returns GPUTexture
 */
async function createCubemapFromImages(device, fileNames) 
{
    // create ImageBitmap objects from image files
    const promises = fileNames.map(
        async (src) => {
            const response = await fetch(src);
            return createImageBitmap(await response.blob());
        }
    );
    const imageBitmaps = await Promise.all(promises);

    // Create a 2d array texture.
    let cubemapTexture = device.createTexture({
        dimension: '2d',
        // Assuming all images have identical sizes.
        size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // copy image data to textures
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

/**
 * Creates a cubemap texture from given image file.
 * @param {GPUDevice} device 
 * @param {string} fileName 
 * @returns GPUTexture
 */
async function createCubemap(device, fileName) {

    // fetch texture
    let response = await fetch(fileName);
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    // create ImageBitmap
    const imageBitmap = await createImageBitmap(await response.blob());

    // create an offscreen canvas
    let canvas = new OffscreenCanvas(width, height);
    let ctx = canvas.getContext('2d');

    // Compute tile dimensions - images are in a 4 x 3 grid
    let tileWidth = imageBitmap.width / 4;
    let tileHeight = imageBitmap.height / 3;

    // set canvas dimensions
    canvas.width = tileWidth;
    canvas.height = tileHeight;

    // specify position of images in a 4 x 3 grid
    let gridPositions = [[1, 2], [1, 0], [0, 1], [2, 1], [1, 1], [1, 3]];
    
    let tiles = [];
    for (let [row, col] of gridPositions) {
        let x = col * tileWidth;
        let y = row * tileHeight;
        ctx.drawImage(imageBitmap, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        tiles.push(ctx.getImageData(0, 0, tileWidth, tileHeight));
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


    tiles.forEach((bitmap, index) => {
        const source = { source: bitmap };
        const destination = { texture: cubeMapTexture, origin: { x: 0, y: 0, z: index } };
        const copySize = { width: bitmap.width, height: bitmap.height, depthOrArrayLayers: 1 };

        // Copy the bitmap content to the cube map texture
        device.queue.copyExternalImageToTexture(source, destination, copySize);
    });

    return cubeMapTexture;
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

    // fetch textures
    const texNMapPlane = await createTextureFromImageFile(device, "images/stone-bm.jpg", false);
    const texImagePlane = await createTextureFromImageFile(device, "images/stone-col.jpg", true);    
    const texNMapTorus = await createTextureFromImageFile(device,  "images/penny-nm.png", false);
    const texImageTorus = await createTextureFromImageFile(device, "images/penny-col.png", true);
    const texProj = await createTextureFromImageFile(device, "images/mandrill.png", true);
    const texBillboard = await createTextureFromImageFile(device, "images/projector.png", true);
    // load cubemap    
    const cubemapFiles = [
        'images/buddha-xp.png',
        'images/buddha-xm.png',
        'images/buddha-yp.png',
        'images/buddha-ym.png',
        'images/buddha-zp.png',
        'images/buddha-zm.png',
    ];
    const texCubemap = await createCubemapFromImages(device, cubemapFiles);

    // create torus
    let r = 3;
    let R = 10;
    const torus = await createTorus(r, R, device, "tex.wgsl", 
        texImageTorus, texNMapTorus, texProj, texCubemap);

    // create plane
    const planeWidth = 26;
    const plane = await createPlane(planeWidth, device, "tex.wgsl", 
        texImagePlane, texNMapPlane, texProj, texCubemap);

    // create billboard (plane)
    const bbWidth = 2.75;
    const billboard = await createPlane(bbWidth, device, "billboard.wgsl", 
        texBillboard, null, null, null);

    // create skybox (cube)
    const skybox = await createSkybox(device, "skybox.wgsl", texCubemap);

    // create frustum
    const frustumParams = {
        fov: 30,
        aspect: texProj.width / texProj.height,
        near: 5,
        far: 20,
        eye: [0, 10, 0], 
        target: [0, 0, 0], 
        up: [1, 0, 0]
    };
    const frustum = await createFrustum(frustumParams, device, 'auto');  

    // create XYX axes
    const axis = await createAxes(20, device);    

    // create a depth texture 
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        //  sampleCount: 4,
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

    // init show flags 
    let showTorus = document.querySelector('#show_torus').checked;
    let showPlane = document.querySelector('#show_plane').checked;
    let showAxis = document.querySelector('#show_axis').checked;
    let showSkybox = document.querySelector('#show_skybox').checked;
    let showBillboard = document.querySelector('#enable_tex_billboard').checked;    
    let showFrustum = document.querySelector('#show_frustum').checked;

    // light position sliders:

    // X
    let light_pos = [0.0, 10.0, 0.0, 0.0];
    const x_slider = document.querySelector("#x_slider");
    x_slider.value = light_pos[0];
    document.querySelector("#x_label").innerHTML = light_pos[0];
    x_slider.addEventListener("input", (event) => {
        light_pos[0] = x_slider.value;
        document.querySelector("#x_label").innerHTML = x_slider.value;
    }
    );
    // Y
    const y_slider = document.querySelector("#y_slider");
    y_slider.value = light_pos[1];
    document.querySelector("#y_label").innerHTML = light_pos[1];
    y_slider.addEventListener("input", (event) => {
        light_pos[1] = y_slider.value;
        document.querySelector("#y_label").innerHTML = y_slider.value;
    }
    );
    // Z
    const z_slider = document.querySelector("#z_slider");
    z_slider.value = light_pos[2];
    document.querySelector("#z_label").innerHTML = light_pos[2];
    z_slider.addEventListener("input", (event) => {
        light_pos[2] = z_slider.value;
        document.querySelector("#z_label").innerHTML = z_slider.value;
    }
    );

    // Texture projection eye sliders:

    // X
    const px_slider = document.querySelector("#px_slider");
    px_slider.value = frustumParams.eye[0];
    document.querySelector("#px_label").innerHTML = frustumParams.eye[0];
    px_slider.addEventListener("input", (event) => {
        frustumParams.eye[0] = px_slider.value;
        document.querySelector("#px_label").innerHTML = px_slider.value;
    }
    );
    // Y
    const py_slider = document.querySelector("#py_slider");
    py_slider.value = frustumParams.eye[1];
    document.querySelector("#py_label").innerHTML = frustumParams.eye[1];
    py_slider.addEventListener("input", (event) => {
        frustumParams.eye[1] = py_slider.value;
        document.querySelector("#py_label").innerHTML = py_slider.value;
    }
    );
    // Z
    const pz_slider = document.querySelector("#pz_slider");
    pz_slider.value = frustumParams.eye[2];
    document.querySelector("#pz_label").innerHTML = frustumParams.eye[2];
    pz_slider.addEventListener("input", (event) => {
        frustumParams.eye[2] = pz_slider.value;
        document.querySelector("#pz_label").innerHTML = pz_slider.value;
    }
    );

    // Texture projection center sliders:

    // X
    const pcx_slider = document.querySelector("#pcx_slider");
    pcx_slider.value = frustumParams.target[0];
    document.querySelector("#pcx_label").innerHTML = frustumParams.target[0];
    pcx_slider.addEventListener("input", (event) => {
        frustumParams.target[0] = pcx_slider.value;
        document.querySelector("#pcx_label").innerHTML = pcx_slider.value;
    }
    );
    // Y
    const pcy_slider = document.querySelector("#pcy_slider");
    pcy_slider.value = frustumParams.target[1];
    document.querySelector("#pcy_label").innerHTML = frustumParams.target[1];
    pcy_slider.addEventListener("input", (event) => {
        frustumParams.target[1] = pcy_slider.value;
        document.querySelector("#pcy_label").innerHTML = pcy_slider.value;
    }
    );
    // Z
    const pcz_slider = document.querySelector("#pcz_slider");
    pcz_slider.value = frustumParams.target[2];
    document.querySelector("#pcz_label").innerHTML = frustumParams.target[2];
    pcz_slider.addEventListener("input", (event) => {
        frustumParams.target[2] = pcz_slider.value;
        document.querySelector("#pcz_label").innerHTML = pcz_slider.value;
    }
    );

    // time step
    let timeStep = 0.0;
    // rotation flag
    let rotate = false;

    // revolving camera 
    const camHeight = 15.0;
    const camRadius = 30.0
    let camTheta = 0.0;
    let eye = [0, 15, -15, 1];
    let target = [0.0, 0.0, 0.0];
    let up = [0, 1, 0];
    
    // Update camera parameters 
    function updateCamera() {

        // update UI
        let flagsUI = getUIFlags();
        
        // create projection matrix 
        let fov = 90;
        let aspect = canvas.width / canvas.height;    
        let projMat = mat4.perspective(
            fov * Math.PI/180,
            aspect,
            1,
            3000
        );

        // Is rotate checked?
        rotate = document.querySelector('#rotate').checked;
        if (rotate) {
            // update theta 
            camTheta += 0.001;
            // rotate 
            eye = [camRadius * Math.cos(camTheta), camHeight, camRadius * Math.sin(camTheta), 1];
        }
        else {
            eye = [0, 15, -15, 1];
            target = [0.0, 0.0, 0.0];
            up = [0, 1, 0];
        }
        // create lookAt matrix
        let lookAtMat = mat4.lookAt([eye[0], eye[1], eye[2]], target, up);

        // create model matrix
        let modelMat = mat4.identity();
        // correct orientation for model matrix - Y direction is up 
        modelMat = mat4.rotation(vec3.fromValues(1, 0, 0), -Math.PI/2.0);
        
        // create modelview matrix 
        let mvMat = mat4.multiply(lookAtMat, modelMat);
        
        // create normal matrix in eye space
        let nMatEC = mat4.create();
        nMatEC = mat4.transpose(mat4.inverse(mvMat));
        // create normal matrix in world space
        let nMatWC = mat4.create();
        nMatWC = mat4.transpose(mat4.inverse(modelMat));

        // Create texture projection matrix:

        // bias matrix
        let texBiasMat = mat4.create(
            0.5, 0.0, 0.0, 0.0, 
            0.0, 0.5, 0.0, 0.0, 
            0.0, 0.0, 0.5, 0.0, 
            0.5, 0.5, 0.5, 1.0
        );
        // projection matrix
        let texProjMat = mat4.perspective(utils.degToRad(frustumParams.fov), 
            frustumParams.aspect, frustumParams.near, frustumParams.far);
        // lookat matrix 
        let texLookAtMat = mat4.lookAt(frustumParams.eye, frustumParams.target, frustumParams.up);
        
        // final texture projection matrix = texBiasMat x texProjMat x texLookAtMat
        let tmp = mat4.multiply(texProjMat, texLookAtMat);
        let texProjMatFull = mat4.multiply(texBiasMat, tmp);

        // write uniform data - torus
        let meshType = 0;
        writeUniformBuffer(device, torus.cameraBuffer, modelMat, lookAtMat, projMat, nMatEC, nMatWC, texProjMatFull, 
            light_pos, eye, 
            timeStep, flagsUI, meshType);
        
        // write uniform data - plane   
        meshType = 1; 
        writeUniformBuffer(device, plane.cameraBuffer, modelMat, lookAtMat, projMat, nMatEC, nMatWC, texProjMatFull, 
            light_pos, eye, 
            timeStep, flagsUI, meshType);

        // write uniform data - skybox
        writeUniformBuffer(device, skybox.cameraBuffer, modelMat, lookAtMat, projMat, null, null, null, 
                null, null, 
                null, null, null);
                
        // Create billboard matrix:

        // P is the center of the billboard
        let P = frustumParams.eye;
        // N is the normal which points towards the eye. N = eye - P
        let N = vec3.normalize(vec3.subtract(vec3.create(...eye), vec3.create(...P)));
        // D is the direction of the projection frustum. D = f.target - f.eye
        let D = vec3.normalize(vec3.subtract(vec3.create(...frustumParams.target), 
                                             vec3.create(...frustumParams.eye)));        
        // U is orthogonal to N and D
        let U = vec3.cross(N, D);
        // create an alignment matrix such that 
        // billboard X => D, Y=> U, and Z => N
        // also translate billboard center to P
        let bbMat = mat4.create(
            D[0], D[1], D[2], 0.0,
            U[0], U[1], U[2], 0.0,
            N[0], N[1], N[2], 0.0,
            P[0], P[1], P[2], 1.0,
        );
        
        // write uniform data - torus
        writeUniformBuffer(device, billboard.cameraBuffer, bbMat, lookAtMat, projMat, nMatEC, nMatWC, null, 
            null, null,
            null, null, null);
        
        // write uniform data - axis
        writeUniformBuffer(device, axis.cameraBuffer, null, lookAtMat, projMat, null, null, null, 
            null, null, 
            null, null, null);

        // create aligin matrix for frustum
        let alignMat = mat4.cameraAim(frustumParams.eye, frustumParams.target, frustumParams.up);
        // write uniform data - frustum
        writeUniformBuffer(device, frustum.cameraBuffer, alignMat, lookAtMat, projMat, null, null, null, 
            null, null,
            null, null, null);        
    }

    // define render function 
    function render() {

        // set texture 
        renderPassDescriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'torus encoder' });
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        // increment time step
        timeStep += 1;

        // update camera params for frame
        updateCamera();

        showTorus = document.querySelector('#show_torus').checked;
        showPlane = document.querySelector('#show_plane').checked;
        showAxis = document.querySelector('#show_axis').checked;
        showSkybox = document.querySelector('#show_skybox').checked;
        showBillboard = document.querySelector('#enable_tex_billboard').checked;    
        showFrustum = document.querySelector('#show_frustum').checked;
        
        // ********************
        // draw torus         
        // ********************
        if (showTorus) {
            // set camera bind group
            pass.setBindGroup(0, torus.uniformBindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, torus.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(torus.pipeline);
            // draw 
            pass.draw(torus.count);
        }
        
        // ********************
        // draw plane         
        // ********************
        if (showPlane) {
            // set camera bind group
            pass.setBindGroup(0, plane.uniformBindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, plane.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(plane.pipeline);
            // draw 
            pass.draw(plane.count);
        }

        // ********************
        // draw billboard         
        // ********************
        if (showBillboard) {
            // set camera bind group
            pass.setBindGroup(0, billboard.uniformBindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, billboard.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(billboard.pipeline);
            // draw 
            pass.draw(billboard.count);
        }
        
        // ********************
        // draw skybox         
        // ********************
        if (showSkybox) {
            // set camera bind group
            pass.setBindGroup(0, skybox.uniformBindGroup);
            // set the render pipeline
            pass.setPipeline(skybox.pipeline);
            // draw 
            pass.draw(skybox.count);
        }
        
        // ********************
        // draw XYZ axes         
        // ********************
        if (showAxis) {
            // set camera bind group
            pass.setBindGroup(0, axis.uniformBindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, axis.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(axis.pipeline);
            // draw 
            pass.draw(axis.count);
        }
        
        // ********************
        // draw frustum  
        // ********************
        if (showFrustum) {
            // set camera bind group
            pass.setBindGroup(0, frustum.uniformBindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, frustum.vertexBuffer);
            // set the render pipeline
            pass.setPipeline(frustum.pipeline);
            // draw
            pass.draw(frustum.count);
        }

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