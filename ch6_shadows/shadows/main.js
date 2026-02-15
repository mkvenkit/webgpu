// ----------------------------------------------------------------------
// main.js
// 
// Shadow mapping WebGPU app.
// 
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {mat4, utils, vec3} from '../../common/wgpu-matrix.module.js';
import { createCube } from './cube.js';
import { createPlane } from './plane.js';
import { createTeapot } from './teapot.js';
import { createShadowMap, createShadowMapDebug } from './shadow.js';
import { createRenderPipeline } from './render.js';
import { createSphere } from './sphere.js';

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

    // create a common GPUVertexBufferLayout object
    const vertexBufferLayout = [
        {
            attributes: [
                {
                    // position 
                    format: 'float32x3',
                    offset: 0,
                    shaderLocation: 0
                },
                {
                    // normal
                    format: 'float32x3',
                    offset: 12,
                    shaderLocation: 1
                },
            ],
            arrayStride: 24, // 6 floats x 4 bytes each 
        }
    ];
    

    // common layout for ModelParams
    const modelParamsBGL = device.createBindGroupLayout({
        entries: [
            {
                binding: 0, // modelParams
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
            },
        ]
    });

    // common uniform bind group layout and buffer 
 
    // (buffer, bindGroup) x 3 one for each object type 
    let modelParamsBGInfo = {};
    for (let key of ['teapot', 'plane', 'cube']) {
        // create uniform buffer for modelmat
        let uniformBuffer = device.createBuffer({
            size: 144, // 2 * 4 * 16 + 16
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        // create bind group 
        let uniformBindGroup = device.createBindGroup({
            label: "model params bind group",
            layout: modelParamsBGL,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: uniformBuffer,
                    },
                },
            ],
        });
        // add to object 
        modelParamsBGInfo[key] = {
            buffer: uniformBuffer,
            bindGroup: uniformBindGroup
        };
    }

    // function to create shadowmap texture 
    function createSMTexture(smWidth, smHeight) {
        const smTexture = device.createTexture({
            size: [smWidth, smHeight, 1],
            format: 'depth24plus',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        return smTexture;
    }
    // create initial texture 
    let smTexture = createSMTexture(1024, 1024);

    // update ModelParams
    function updateModelParams(modelParamsBGInfo, key, modelMat, nMat, color) {
        const data = new Float32Array(36);

        // modelMat (16 floats)
        data.set(modelMat, 0);

        // nMat (16 floats)
        data.set(nMat, 16);

        // color (4 floats)
        data.set(color, 32);

        device.queue.writeBuffer(
            modelParamsBGInfo[key].buffer,
            0,
            data
        );
    }

    // create plane
    const plane = await createPlane(device, 25);

    // create cube
    const cube = await createCube(device, 5.0);

    // create teapot
    const teapot = await createTeapot(device);

    // shadow map pipelike
    let smap;
    // normal render pipeline
    let normalRender;

    // shadow debug pipeline
    let smap_debug;

    // a function to recreate pipelines
    async function recreatePipelines() {
        // create shadow map render pipeline
        smap = await createShadowMap(device, vertexBufferLayout, modelParamsBGL, smTexture);

        // create normal render pipleline
        normalRender = await createRenderPipeline({
            device,
            canvas,
            context,
            vertexBufferLayout,
            modelParamsBGL,
            smTexture,
        });

        // shadow debug pipeline
        smap_debug = await createShadowMapDebug(device, smTexture);   
    }
    // first creation 
    await recreatePipelines();


    // compute a reasonable up vector
    function computeUpVector(eye, target) {
        const forward = vec3.normalize(
            vec3.subtract(target, eye)
        );

        // Choose a world reference that is not parallel to forward
        const worldUp = Math.abs(forward[2]) > 0.99
            ? [0, 1, 0]
            : [0, 0, 1];

        const right = vec3.normalize(
            vec3.cross(worldUp, forward)
        );

        const up = vec3.normalize(
            vec3.cross(forward, right)
        );

        return up;  
    }

    // revolving camera 
    let camTheta = 0.0;

    // enums for filter types 
    const FilterType = {
        Nearest:    0,
        Linear:     1,
        PCF:        2,
        Poisson:    3,
        PoissonRot: 4,
    };

    // UI settings
    const uiSettings = {
        rotate: false,
        zoom: false,
        shadowsEnabled: true,
        showShadowMap: false,
        lightPos: [0, 0, 0],
        shadowMapResolution: 512,
        frustum: {
            near: 1,
            far: 30
        },
        culling: false,
        shadowBias: 0.0,
        slopeScale: 1.0,
        slopeBiasEnabled: false,
        shadowFilter: FilterType.Nearest,
    };

    // function to update shadow params
    function updateShadowParams() {
        const buf = new ArrayBuffer(32);

        // u32 fields
        const u32 = new Uint32Array(buf);
        u32[0] = uiSettings.shadowsEnabled ? 1 : 0;    
        u32[3] = uiSettings.slopeBiasEnabled ? 1 : 0;   
        u32[4] = uiSettings.shadowFilter;                

        // f32 fields
        const f32 = new Float32Array(buf);
        f32[1] = uiSettings.shadowBias;                  // bias
        f32[2] = uiSettings.slopeScale;                  // slopeScale

        device.queue.writeBuffer(normalRender.shadowParamsBuffer, 0, buf);
    }


    // init UI
    function initUI() {
        // rotate
        uiSettings.rotate = document.querySelector('#rotate').checked;
        document.querySelector('#rotate').addEventListener('change', e => {
            uiSettings.rotate = e.target.checked;
        });

        // zoom 
        uiSettings.zoom = document.querySelector('#zoom').checked;
        document.querySelector('#zoom').addEventListener('change', e => {
            uiSettings.zoom = e.target.checked;
        });

        // shadows on/off
        uiSettings.shadowsEnabled = document.querySelector('#shadow_enable').checked;
        document.querySelector('#shadow_enable').addEventListener('change', e => {
            uiSettings.shadowsEnabled = e.target.checked;
            // update shadow params
            updateShadowParams();
        });

        // show shadow map
        uiSettings.showShadowMap = document.querySelector('#show_smap').checked;
        document.querySelector('#show_smap').addEventListener('change', e => {
            uiSettings.showShadowMap = e.target.checked;
        });

        // culling on/off
        uiSettings.culling = document.querySelector('#culling_enable').checked;
        document.querySelector('#culling_enable').addEventListener('change', e => {
            uiSettings.culling = e.target.checked;
        });


        // light position sliders
        uiSettings.lightPos = {
            x: parseFloat(document.querySelector('#light_x').value),
            y: parseFloat(document.querySelector('#light_y').value),
            z: parseFloat(document.querySelector('#light_z').value),
        };

        ['x', 'y', 'z'].forEach(axis => {
            const slider = document.querySelector(`#light_${axis}`);
            const label  = document.querySelector(`#light_${axis}_label`);

            slider.addEventListener('input', e => {
                uiSettings.lightPos[axis] = parseFloat(e.target.value);
                label.textContent = e.target.value;
            });
        });

        // shadow map resolution
        uiSettings.shadowMapResolution = parseInt(
            document.querySelector('input[name="smap_res"]:checked').value
        );
        document.querySelectorAll('input[name="smap_res"]').forEach(radio => {
            radio.addEventListener('change', async e => {
                uiSettings.shadowMapResolution = parseInt(e.target.value);
                // recreate texture
                smTexture = createSMTexture(uiSettings.shadowMapResolution, uiSettings.shadowMapResolution);
                // recreate pipeline
                await recreatePipelines();
                // update shadow params
                updateShadowParams();
            });
        });

        
        // bias
        uiSettings.shadowBias = parseFloat(
            document.querySelector('#shadow_bias').value
        );
        {
            const slider = document.querySelector('#shadow_bias');
            const label  = document.querySelector('#shadow_bias_label');

            slider.addEventListener('input', e => {
                uiSettings.shadowBias = parseFloat(e.target.value);
                label.textContent = e.target.value;
                // update shadow params
                updateShadowParams();
            });
        }

        // slope bias enable
        uiSettings.slopeBiasEnabled =
            document.querySelector('#slope_bias_enabled').checked;
        {
            const checkbox = document.querySelector('#slope_bias_enabled');

            checkbox.addEventListener('change', e => {
                uiSettings.slopeBiasEnabled = e.target.checked;
                // update shadow params
                updateShadowParams();
            });
        }

        // slope scale
        uiSettings.slopeScale = parseFloat(
            document.querySelector('#slope_scale').value
        );
        {
            const slider = document.querySelector('#slope_scale');
            const label  = document.querySelector('#slope_scale_label');

            slider.addEventListener('input', e => {
                uiSettings.slopeScale = parseFloat(e.target.value);
                label.textContent = e.target.value;
                // update shadow params
                updateShadowParams();
            });
        }

        // filtering
        uiSettings.shadowFilter = FilterType[
            document.querySelector('input[name="filtering"]:checked').value
        ];

        document.querySelectorAll('input[name="filtering"]').forEach(radio => {
            radio.addEventListener('change', e => {
                uiSettings.shadowFilter = FilterType[e.target.value];
                // update shadow params
                updateShadowParams();
            });
        });

    }
    // call init 
    initUI();
    // update shadow params
    updateShadowParams();

    // Update shadow map uniforms
    function updateView(isShadow) {

        // compute camera matrices:

        // camera parameters 
        const cameraParams = {
            // look at params
            eye: [0, -5, 5],
            target: [0.0, 0.0, 0.0], 
            up: [0, 0, 1],
            // perspective projection params
            fov: uiSettings.zoom ? 5: 50,
            aspect: canvas.width / canvas.height,
            near: 1.0,
            far: 50.0,
            // rotation params
            theta: 0.0,
            height: 10.0,
            radius: 15.0,
        }

        // update theta 
        if (uiSettings.rotate) {
            camTheta += 0.005;
        }
        // update eye 
        cameraParams.eye = [cameraParams.radius * Math.cos(camTheta), 
                cameraParams.radius * Math.sin(camTheta), cameraParams.height];

        // compute up vector 
        cameraParams.up = computeUpVector(new Float32Array(cameraParams.eye), new Float32Array(cameraParams.target));

        // create lookAt matrix
        let lookAtMat = mat4.lookAt(cameraParams.eye, cameraParams.target, cameraParams.up);

        // create projection matrix 
        const projMat = mat4.perspective(
            cameraParams.fov * Math.PI/180,
            cameraParams.aspect,
            cameraParams.near,
            cameraParams.far
        );

        // light parameters 
        const lightParams = {
            // look at params
            eye: [uiSettings.lightPos.x, uiSettings.lightPos.y, uiSettings.lightPos.z],
            target: [0.0, 0.0, 0.0], 
            up: [0, 0, 1],
            // orthographic projection params
            left: -10,
            right: 10,
            bottom: -10,
            top: 10,
            near: uiSettings.frustum.near,
            far: uiSettings.frustum.far
        }

        // compute a better up vector
        lightParams.up = computeUpVector(new Float32Array(lightParams.eye), new Float32Array(lightParams.target));

        // create look at matrix for shadow
        const slookAtMat = mat4.lookAt(lightParams.eye, lightParams.target, lightParams.up);
        // create projection matrix for shadow
        const sprojMat = mat4.ortho(lightParams.left, lightParams.right, 
            lightParams.bottom, lightParams.top, lightParams.near, lightParams.far);

        if (isShadow) {
            // write camera uniform
            smap.writeUniformBuffer(sprojMat, slookAtMat);
        }
        else {

            let shadowMat = mat4.multiply(sprojMat, slookAtMat);

            // bias matrix - maps xy from [-1, 1] to [0, 1]
            let biasMat = mat4.create(
                0.5, 0.0, 0.0, 0.0, 
                0.0, -0.5, 0.0, 0.0, 
                0.0, 0.0, 1.0, 0.0, 
                0.5, 0.5, 0.0, 1.0
            );
            // apply bias matrix
            shadowMat = mat4.multiply(biasMat, shadowMat);

            // write camera uniform
            let lightPosA = [uiSettings.lightPos.x, uiSettings.lightPos.y, uiSettings.lightPos.z];
            normalRender.writeToCameraBuffer(projMat, lookAtMat, shadowMat, lightPosA);
        }

        // write modeparams for cube
        let color = [0.0, 1.0, 0.0, 1.0];
        // scale and translate 
        let modelMatCube = mat4.identity();
        modelMatCube = mat4.scale(modelMatCube, [1, 1, 10]);
        modelMatCube = mat4.translate(modelMatCube, [4, 4, 0]);
        // create normal matrix - in world space
        let nMat = mat4.transpose(mat4.inverse(modelMatCube));
        updateModelParams(modelParamsBGInfo, 'cube', modelMatCube, nMat, color);

        // write modeparams for plane
        color = [1.0, 1.0, 0.0, 1.0];
        let modelMatPlane = mat4.identity();
        nMat = mat4.transpose(mat4.inverse(modelMatPlane));
        updateModelParams(modelParamsBGInfo, 'plane', modelMatPlane, nMat, color);

        // write modeparams for teapot
        color = [1.0, 0.0, 0.0, 1.0];
        // apply rotation to set it right side up
        let modelMatTeapot = mat4.identity();
        modelMatTeapot = mat4.rotate(modelMatTeapot, [1, 0, 0], utils.degToRad(90));
        nMat = mat4.transpose(mat4.inverse(modelMatTeapot));
        updateModelParams(modelParamsBGInfo, 'teapot', modelMatTeapot, nMat, color);
    }

    // define render function 
    function render() {
        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'main encoder' });

        if (uiSettings.shadowsEnabled ) {
            // render shadow casters:

            updateView(true);
        
            // begin shadow pass
            const shadowPass = encoder.beginRenderPass(smap.renderPassDescriptor);

            // common settings:

            // set camera bind group
            shadowPass.setBindGroup(0, smap.bindGroup);
            // set the render pipeline
            shadowPass.setPipeline(uiSettings.culling ? smap.pipelineCull : smap.pipeline);

            // render cube:

            // set modelparams bind group
            shadowPass.setBindGroup(1, modelParamsBGInfo['cube'].bindGroup);
            // set vertex buffer
            shadowPass.setVertexBuffer(0, cube.vertexBuffer);
            // draw 
            shadowPass.draw(cube.count);

            // render teapot:

            // set modelparams bind group
            shadowPass.setBindGroup(1, modelParamsBGInfo['teapot'].bindGroup);
            // set vertex buffer
            shadowPass.setVertexBuffer(0, teapot.vertexBuffer);
            // draw 
            shadowPass.draw(teapot.count);

            // end shadow pass
            shadowPass.end();
        }

        // display shadow map 
        if (uiSettings.showShadowMap) {
            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                }],
            });

            pass.setPipeline(smap_debug.pipeline);
            pass.setBindGroup(0, smap_debug.bindGroup);
            pass.draw(6);
            pass.end();
        }
        else {

            // render objects with shadow:

            updateView(false);

            // set view 
            normalRender.renderPassDescriptor.colorAttachments[0].view = 
                context.getCurrentTexture().createView();

            // make a render pass encoder
            const pass = encoder.beginRenderPass(normalRender.renderPassDescriptor);

            // common settings:

            // set camera bind group
            let bg = uiSettings.shadowFilter == FilterType.Nearest ? 
                normalRender.bindGroupNearest : normalRender.bindGroupLinear;
            pass.setBindGroup(0, bg);
            // set the render pipeline
            pass.setPipeline(normalRender.pipeline);

            // render plane:

            // set modelparams bind group
            pass.setBindGroup(1, modelParamsBGInfo['plane'].bindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, plane.vertexBuffer);
            // draw 
            pass.draw(plane.count);

            
            // render cube:

            // set modeldat bind group
            pass.setBindGroup(1, modelParamsBGInfo['cube'].bindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, cube.vertexBuffer);
            // draw 
            pass.draw(cube.count);

            // render teapot:

            // set modeldat bind group
            pass.setBindGroup(1, modelParamsBGInfo['teapot'].bindGroup);
            // set vertex buffer
            pass.setVertexBuffer(0, teapot.vertexBuffer);
            // draw 
            pass.draw(teapot.count);

            // end render pass
            pass.end();
        
        }

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