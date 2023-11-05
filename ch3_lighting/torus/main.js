// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for the Torus using Phong Reflection model example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';

// other imports
import {createTorus } from './torus.js';
import {createAxes } from './axis.js';
import {createPlane} from './plane.js'

// flags for lighting UI
const LightingFlags = {
    PointLightEnable: 0x01,
    PointLightDirectional: 0x02,
    PointLightAttentuate: 0x04,
    PointLightAmbient: 0x08,
    PointLightDiffuse: 0x10,
    PointLightSpecular: 0x20,
    PointLightBlinnPhong: 0x40,
    SpotLightEnable: 0x80,
    SpotLightOscillate: 0x0100
};

// Convert from hex color code to flot 
// eg. '#ff00ff' to Float32Array [1.0, 0.0, 1.0]
function hexStrToRGBFloat(hex) {
    var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    return new Float32Array([
        parseInt(m[1], 16)/255.0,
        parseInt(m[2], 16)/255.0,
        parseInt(m[3], 16)/255.0,
        1
    ]);
}

// write matrices 
function writeMatrices(device, buffer, modelMat, lookAtMat, projMat, nMat, timeStep) {

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

    // write timeStep
    if (timeStep) {
        device.queue.writeBuffer(
            buffer,
            offset,
            new Float32Array([timeStep]),
            0,
            1
        );
    }
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

    // create torus
    let r = 3;
    let R = 10;
    const torus = await createTorus(r, R, device);

    // create plane
    const plane = await createPlane(26, device);

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

    // default colors
    let def_col_torus = '#ff0000';
    let def_col_plane = '#0000ff'
    let def_col_spot = '#00ff00'

    let col_torus = hexStrToRGBFloat(def_col_torus);
    let col_plane = hexStrToRGBFloat(def_col_plane);
    let col_spot = hexStrToRGBFloat(def_col_spot);

    function updateCols(event) {
        if (event.target.id == "mat_col_torus") {
            col_torus = hexStrToRGBFloat(event.target.value);
        }
        else if (event.target.id == "mat_col_plane") {
            col_plane = hexStrToRGBFloat(event.target.value);
        }
        else if (event.target.id == "spot_col") {
            col_spot = hexStrToRGBFloat(event.target.value);
        }
        //console.log(col_torus);
    }

    // color picker for torus
    const colorPickerTorus = document.querySelector("#mat_col_torus");
    colorPickerTorus.value = def_col_torus;
    colorPickerTorus.addEventListener("input", updateCols);
    colorPickerTorus.select();

    // color picker for plane
    const colorPickerPlane = document.querySelector("#mat_col_plane");
    colorPickerPlane.value = def_col_plane;
    colorPickerPlane.addEventListener("input", updateCols);
    colorPickerPlane.select();

    // color picker for spot light
    const colorPickerSpot = document.querySelector("#spot_col");
    colorPickerSpot.value = def_col_spot;
    colorPickerSpot.addEventListener("input", updateCols);
    colorPickerSpot.select();

    // Point light position sliders:

    // X
    let pl_pos = new Float32Array([0.0, 0.0, 10.0, 0.0]);
    const x_slider = document.querySelector("#x_slider");
    x_slider.value = pl_pos[0];
    document.querySelector("#x_label").innerHTML = pl_pos[0];
    x_slider.addEventListener("input", (event) => {
        pl_pos[0] = x_slider.value;
        document.querySelector("#x_label").innerHTML = x_slider.value;
    }
    );
    // Y
    const y_slider = document.querySelector("#y_slider");
    y_slider.value = pl_pos[1];
    document.querySelector("#y_label").innerHTML = pl_pos[1];
    y_slider.addEventListener("input", (event) => {
        pl_pos[1] = y_slider.value;
        document.querySelector("#y_label").innerHTML = y_slider.value;
    }
    );
    // Z
    const z_slider = document.querySelector("#z_slider");
    z_slider.value = pl_pos[2];
    document.querySelector("#z_label").innerHTML = pl_pos[2];
    z_slider.addEventListener("input", (event) => {
        pl_pos[2] = z_slider.value;
        document.querySelector("#z_label").innerHTML = z_slider.value;
    }
    );

    // outer cone
    let outerCone = 30.0;
    const outer_cone_slider = document.querySelector("#outer_cone_slider");
    const outer_cone_label = document.querySelector("#outer_cone_label");
    outer_cone_slider.value = outerCone;
    outer_cone_label.innerHTML = outerCone;
    outer_cone_slider.addEventListener("input", (event) => {
        outerCone = outer_cone_slider.value;
        outer_cone_label.innerHTML = outer_cone_slider.value;
    }
    );

    // inner cone
    let innerConePercent = 25;
    const inner_cone_slider = document.querySelector("#inner_cone_slider");
    const inner_cone_label = document.querySelector("#inner_cone_label");
    inner_cone_slider.value = innerConePercent;
    inner_cone_label.innerHTML = innerConePercent;
    inner_cone_slider.addEventListener("input", (event) => {
        innerConePercent = inner_cone_slider.value;
        inner_cone_label.innerHTML = inner_cone_slider.value;
    }
    );

    // init show flags 
    let showTorus = document.querySelector('#show_torus').checked;
    let showPlane = document.querySelector('#show_plane').checked;
    let showAxis = document.querySelector('#show_axis').checked;

    // time step
    let timeStep = 0.0;
    let now = 0;

    // Update camera parameters 
    function updateCamera() {
    
        // create lookAt matrix
        const eye = [12, 0, 12];
        const target = [0, 0, 0];
        const up = [0, 0, 1];
        const fov = 100;
        let aspect = canvas.width / canvas.height;

        let lookAtMat = mat4.lookAt(eye, target, up);
        // create projection matrix 
        let projMat = mat4.perspective(
            fov * Math.PI/180,
            aspect,
            1,
            100
        );

        // Is rotate checked?
        let rotate = document.querySelector('#rotate').checked;
        if (rotate) {
            // update time 
            now = Date.now() / 2000;
        }

        let modelMat = mat4.identity();
        if (rotate) {
            modelMat = mat4.rotation(vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1);
        }

        let mvMat = mat4.multiply(lookAtMat, modelMat);
        let nMat = mat4.create();
        nMat = mat4.transpose(mat4.inverse(mvMat));
    
        // write matrices to GPU
        writeMatrices(device, torus.cameraBuffer, modelMat, lookAtMat, projMat, nMat, timeStep);
        writeMatrices(device, plane.cameraBuffer, modelMat, lookAtMat, projMat, nMat, timeStep);
        writeMatrices(device, axis.cameraBuffer, null, lookAtMat, projMat, null, null);

    }
    
    // update lighting params
    function updateLighting() {

        // helper function to update objects 
        function updateObj(obj, color) {
            let offset = 0;
            // write color 
            device.queue.writeBuffer(
                obj.lightingBuffer,
                offset,
                color,
                0,
                4
            );

            // write pl_pos 
            offset += 16;
            device.queue.writeBuffer(
                obj.lightingBuffer,
                offset,
                pl_pos,
                0,
                4
            );

            // sl_col
            offset += 16;
            device.queue.writeBuffer(
                obj.lightingBuffer,
                offset,
                col_spot,
                0,
                4
            );

            // write flags 
            let flags = new Uint32Array([0]);
            
            // Enable point light
            if (document.querySelector('#pl_enable').checked) {
                flags[0] |= LightingFlags.PointLightEnable;
            }
            // Point Light Directional?
            if (document.querySelector('#pl_directional').checked) {
                flags[0] |= LightingFlags.PointLightDirectional;
            }
            // Point Light Attenuate?
            if (document.querySelector('#pl_attenuate').checked) {
                flags[0] |= LightingFlags.PointLightAttentuate;
            }
            // Point Light Ambient 
            if (document.querySelector('#pl_ambient').checked) {
                flags[0] |= LightingFlags.PointLightAmbient;
            }
            // Point Light Diffuse 
            if (document.querySelector('#pl_diffuse').checked) {
                flags[0] |= LightingFlags.PointLightDiffuse;
            }
            // Point Light Specular 
            if (document.querySelector('#pl_specular').checked) {
                flags[0] |= LightingFlags.PointLightSpecular;
            }
            // Point Light Blinn-Phong 
            if (document.querySelector('#pl_blinn_phong').checked) {
                flags[0] |= LightingFlags.PointLightBlinnPhong;
            }
            // Spot Light Enable 
            if (document.querySelector('#sl_enable').checked) {
                flags[0] |= LightingFlags.SpotLightEnable;
            }
            // Spot Light Oscillate 
            if (document.querySelector('#sl_oscillate').checked) {
                flags[0] |= LightingFlags.SpotLightOscillate;
            }

            // write to GPU
            offset += 16;
            device.queue.writeBuffer(
                obj.lightingBuffer,
                offset,
                flags,
                0,
                1
            );

            var cos_theta_o = Math.cos(outerCone * Math.PI/180.0);
            var cos_theta_i = Math.cos((1 - innerConePercent/100.0) * outerCone * Math.PI/180.0);
                            
            // outer cone 
            offset += 4;
            device.queue.writeBuffer(
                obj.lightingBuffer,
                offset,
                new Float32Array([cos_theta_o]),
                0,
                1
            );

            // inner cone 
            offset += 4;
            device.queue.writeBuffer(
                obj.lightingBuffer,
                offset,
                new Float32Array([cos_theta_i]),
                0,
                1
            );

        }

        // update torus
        updateObj(torus, col_torus);
        // update plane
        updateObj(plane, col_plane);

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

        // update lighting params
        updateLighting();

        showTorus = document.querySelector('#show_torus').checked;
        showPlane = document.querySelector('#show_plane').checked;
        showAxis = document.querySelector('#show_axis').checked;
        
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