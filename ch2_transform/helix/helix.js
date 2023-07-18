// ----------------------------------------------------------------------
// helix.js
// 
// Main JavaScript file for the Helix WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {vec3, mat4} from '../../common/wgpu-matrix.module.js';

// define helix parameters 
const r = 2;
const R = 10;
const N = 20;

function compute_pt_helix(t) {
    // compute vertex from parametric equation
    let x = (R + r*Math.cos(N*t))*Math.cos(t);
    let y = (R + r*Math.cos(N*t))*Math.sin(t);
    let z = r*Math.sin(N*t);
    return [x, y, z];
}

// Create a helix wrapped around a torus of minor radius r and major radius R
function createHelixVertices(vert) {
    // generate vertices
    let count = 0;
    for (let t = 0; t <= 2*Math.PI; t += 0.001) {    
        // compute vertex from parametric equation
        let P = compute_pt_helix(t);         // add vertex 
        vert.push(...P);
        // keep count
        count++;
    }
    return count;
}

// Create a circle on XY plane with center (0, 0, 0) and radius R
function createCircleVertices(vert) {
    // set radius
    let R = 10;
    // generate circle
    let count = 0;
    for (let t = 0; t <= 2*Math.PI; t += 0.001) {
        let x = R*Math.cos(t);
        let y = R*Math.sin(t);
        let z = 0;
        // add vertex 
        vert.push(x, y, z);
        // keep count
        count++;
    }
    return count;
}

function compute_tangent_helix(t) {
    // compute tangent T = dP/dt
    let Tx = -(R + r*Math.cos(N*t))*Math.sin(t) - r*N*Math.sin(N*t)*Math.cos(t);
    let Ty =  (R + r*Math.cos(N*t))*Math.cos(t) - r*N*Math.sin(N*t)*Math.sin(t);
    let Tz =  r*N*Math.cos(N*t);
    let T = vec3.create(Tx, Ty, Tz)
    //console.log(Tx, Ty, Tz);
    return vec3.normalize(T);  
}

// Given t, compute T, N, S 
export function computeHelixTNS(t) {

    // compute point 
    let P = vec3.create(...compute_pt_helix(t));
    
    // compute tangent T = dP/dt
    let T = compute_tangent_helix(t);

    // compute normal N = dT_n/dt where T_n = T/|T|
    var dt = 0.01;
    var T_p = compute_tangent_helix(t + dt);
    var T_m = compute_tangent_helix(t - dt);
    let N = vec3.mulScalar(vec3.subtract(T_p, T_m), 1/(2.0*dt));
    N = vec3.normalize(N);

    // compute the side vector T x N 
    let S = vec3.cross(T, N);

    // return T, N, S
    return {
        P : P,
        T : T,
        N : N,
        S : S
    }
}

// Create helix 
export async function createHelix(device, pipelineLayout) {
    
    // fetch shader code as a string
    let response = await fetch("helix.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'Helix shader',
        code: shader_str,
    });

    // fetch shader code as a string
    response = await fetch("cube.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str_cube = await response.text();

    // create shader module
    const shaderModuleCube = device.createShaderModule({
        label: 'Cube shader',
        code: shader_str_cube,
    });


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

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: vertexBufferLayout
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat()
            }]
        },
        primitive: {
            topology: 'line-strip',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        layout: pipelineLayout
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    // return helix params 
    return {
        pipeline: renderPipeline,
        vertexBuffer: vertexBuffer,
        countH: countH,
        countC: countC
    };
}

