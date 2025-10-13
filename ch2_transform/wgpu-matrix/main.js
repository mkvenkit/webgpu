// ----------------------------------------------------------------------
// main.js
// 
// Main JavaScript file for the wpu-matrix example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// imports from wgpu-matrix 
import {utils, vec3, vec4, mat4} from '../../common/wgpu-matrix.module.js';

function main() {
    
    console.log("Starting wgpu-matrix examples...")

    let v1 = vec3.create(1, 0, 0);
    let v2 = vec3.create(0, 1, 0);
    let v3 = vec3.create(0, 0, 1);

    let sum = vec3.add(v1, v2);
    let dotProduct = vec3.dot(v1, v2);
    let crossProduct = vec3.cross(v1, v2);

    console.log("v1 = " + v1);
    console.log("sum = " + sum);
    console.log("dotProduct = " + dotProduct);
    console.log("crossProduct = " + crossProduct);

    let m1 = mat4.create();
    console.log("m1 = " + m1);

    let identityMat = mat4.identity();
    console.log("identityMat = " + identityMat);

    let translationMat = mat4.translation([1, 2, 3]);
    console.log("translationMat = " + translationMat);
    console.log("translationMat (transpose) = " + mat4.transpose(translationMat));

    let scaleMat = mat4.scaling([1, 2, 3]);
    console.log("scaleMat = " + scaleMat);

    let rotZMat = mat4.rotationZ(utils.degToRad(45));
    console.log("rotZMat = " + rotZMat);
    let P = vec4.transformMat4([1, 0, 0, 1], rotZMat);
    console.log("P = " + P);

    let M = mat4.lookAt([0, 0, 1], [10, 10, 1], [0, 0, 1]);
    console.log("M = " + M);

    let OP = mat4.ortho(-10, 10, -5, 5, 5, 10);
    console.log("OP = " + OP);

    let PP = mat4.frustum(-10, 10, -5, 5, 5, 10);
    console.log("PP = " + PP);
    PP = mat4.perspective(90, 1, 1, 50);
    console.log("PP = " + PP);

}

main();