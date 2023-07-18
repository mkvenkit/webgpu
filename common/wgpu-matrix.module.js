/* wgpu-matrix@2.1.0, license MIT */
var arrayLike = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
let EPSILON = 0.000001;
/**
 * Set the value for EPSILON for various checks
 * @param v - Value to use for EPSILON.
 * @returns previous value of EPSILON;
 */
function setEpsilon(v) {
    const old = EPSILON;
    EPSILON = v;
    return old;
}
/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns angle converted to radians
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns angle converted to degrees
 */
function radToDeg(radians) {
    return radians * 180 / Math.PI;
}
/**
 * Lerps between a and b via t
 * @param a - starting value
 * @param b - ending value
 * @param t - value where 0 = a and 1 = b
 * @returns a + (b - a) * t
 */
function lerp$3(a, b, t) {
    return a + (b - a) * t;
}
/**
 * Compute the opposite of lerp. Given a and b and a value between
 * a and b returns a value between 0 and 1. 0 if a, 1 if b.
 * Note: no clamping is done.
 * @param a - start value
 * @param b - end value
 * @param v - value between a and b
 * @returns (v - a) / (b - a)
 */
function inverseLerp(a, b, v) {
    const d = b - a;
    return (Math.abs(b - a) < EPSILON)
        ? a
        : (v - a) / d;
}
/**
 * Compute the euclidean modulo
 *
 * ```
 * // table for n / 3
 * -5, -4, -3, -2, -1,  0,  1,  2,  3,  4,  5   <- n
 * ------------------------------------
 * -2  -1  -0  -2  -1   0,  1,  2,  0,  1,  2   <- n % 3
 *  1   2   0   1   2   0,  1,  2,  0,  1,  2   <- euclideanModule(n, 3)
 * ```
 *
 * @param n - dividend
 * @param m - divisor
 * @returns the euclidean modulo of n / m
 */
function euclideanModulo(n, m) {
    return ((n % m) + m) % m;
}

var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get EPSILON () { return EPSILON; },
    setEpsilon: setEpsilon,
    degToRad: degToRad,
    radToDeg: radToDeg,
    lerp: lerp$3,
    inverseLerp: inverseLerp,
    euclideanModulo: euclideanModulo
});

/**
 *
 * Vec2 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new Vec2. In other words you can do this
 *
 *     const v = vec2.cross(v1, v2);  // Creates a new Vec2 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec2.create();
 *     vec2.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec2.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$2 = Float32Array;
/**
 * Sets the type this library creates for a Vec2
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Vec2
 */
function setDefaultType$5(ctor) {
    const oldType = VecType$2;
    VecType$2 = ctor;
    return oldType;
}
/**
 * Creates a Vec2; may be called with x, y, z to set initial values.
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Vec2's specified type
 * it would be faster to use
 *
 * ```
 * const v = vec2.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Vec2Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `vec2.create` is usually used
 * to create a Vec2 to be filled out as in
 *
 * ```
 * const sum = vec2.create();
 * vec2.add(v1, v2, sum);
 * ```
 *
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
function create$4(x = 0, y = 0) {
    const dst = new VecType$2(2);
    if (x !== undefined) {
        dst[0] = x;
        if (y !== undefined) {
            dst[1] = y;
        }
    }
    return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a Vec2; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
const fromValues$2 = create$4;
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$2(v, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = Math.ceil(v[0]);
    dst[1] = Math.ceil(v[1]);
    return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$2(v, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = Math.floor(v[0]);
    dst[1] = Math.floor(v[1]);
    return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$2(v, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = Math.round(v[0]);
    dst[1] = Math.round(v[1]);
    return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$2(v, min = 0, max = 1, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = Math.min(max, Math.max(min, v[0]));
    dst[1] = Math.min(max, Math.max(min, v[1]));
    return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$2(a, b, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] + b[0];
    dst[1] = a[1] + b[1];
    return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$2(a, b, scale, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] + b[0] * scale;
    dst[1] = a[1] + b[1] * scale;
    return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle$1(a, b) {
    const ax = a[0];
    const ay = a[1];
    const bx = a[0];
    const by = a[1];
    const mag1 = Math.sqrt(ax * ax + ay * ay);
    const mag2 = Math.sqrt(bx * bx + by * by);
    const mag = mag1 * mag2;
    const cosine = mag && dot$2(a, b) / mag;
    return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$2(a, b, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$2 = subtract$2;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$4(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON &&
        Math.abs(a[1] - b[1]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$4(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The linear interpolated result.
 */
function lerp$2(a, b, t, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] + t * (b[0] - a[0]);
    dst[1] = a[1] + t * (b[1] - a[1]);
    return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$2(a, b, t, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] + t[0] * (b[0] - a[0]);
    dst[1] = a[1] + t[1] * (b[1] - a[1]);
    return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The max components vector.
 */
function max$2(a, b, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = Math.max(a[0], b[0]);
    dst[1] = Math.max(a[1], b[1]);
    return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The min components vector.
 */
function min$2(a, b, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = Math.min(a[0], b[0]);
    dst[1] = Math.min(a[1], b[1]);
    return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function mulScalar$2(v, k, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = v[0] * k;
    dst[1] = v[1] * k;
    return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
const scale$4 = mulScalar$2;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function divScalar$2(v, k, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = v[0] / k;
    dst[1] = v[1] / k;
    return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
function inverse$4(v, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = 1 / v[0];
    dst[1] = 1 / v[1];
    return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
const invert$4 = inverse$4;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of a cross b.
 */
function cross$1(a, b, dst) {
    dst = dst || new VecType$2(3);
    const z = a[0] * b[1] - a[1] * b[0];
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = z;
    return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$2(a, b) {
    return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$2(v) {
    const v0 = v[0];
    const v1 = v[1];
    return Math.sqrt(v0 * v0 + v1 * v1);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$2 = length$2;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$2(v) {
    const v0 = v[0];
    const v1 = v[1];
    return v0 * v0 + v1 * v1;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$2 = lengthSq$2;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$2(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$2 = distance$2;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$2(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$2 = distanceSq$2;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The normalized vector.
 */
function normalize$2(v, dst) {
    dst = dst || new VecType$2(2);
    const v0 = v[0];
    const v1 = v[1];
    const len = Math.sqrt(v0 * v0 + v1 * v1);
    if (len > 0.00001) {
        dst[0] = v0 / len;
        dst[1] = v1 / len;
    }
    else {
        dst[0] = 0;
        dst[1] = 0;
    }
    return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns -v.
 */
function negate$4(v, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = -v[0];
    dst[1] = -v[1];
    return dst;
}
/**
 * Copies a vector. (same as clone)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
function copy$4(v, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = v[0];
    dst[1] = v[1];
    return dst;
}
/**
 * Clones a vector. (same as copy)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
const clone$4 = copy$4;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$4(a, b, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] * b[0];
    dst[1] = a[1] * b[1];
    return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$4 = multiply$4;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$2(a, b, dst) {
    dst = dst || new VecType$2(2);
    dst[0] = a[0] / b[0];
    dst[1] = a[1] / b[1];
    return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$2 = divide$2;
/**
 * Creates a random unit vector * scale
 * @param scale - Default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns The random vector.
 */
function random$1(scale = 1, dst) {
    dst = dst || new VecType$2(2);
    const angle = Math.random() * 2 * Math.PI;
    dst[0] = Math.cos(angle) * scale;
    dst[1] = Math.sin(angle) * scale;
    return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not new one is created.
 * @returns The zeroed vector.
 */
function zero$2(dst) {
    dst = dst || new VecType$2(2);
    dst[0] = 0;
    dst[1] = 0;
    return dst;
}
/**
 * transform Vec2 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$2(v, m, dst) {
    dst = dst || new VecType$2(2);
    const x = v[0];
    const y = v[1];
    dst[0] = x * m[0] + y * m[4] + m[12];
    dst[1] = x * m[1] + y * m[5] + m[13];
    return dst;
}
/**
 * Transforms vec4 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3$1(v, m, dst) {
    dst = dst || new VecType$2(2);
    const x = v[0];
    const y = v[1];
    dst[0] = m[0] * x + m[4] * y + m[8];
    dst[1] = m[1] * x + m[5] * y + m[9];
    return dst;
}

var vec2Impl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$4,
    setDefaultType: setDefaultType$5,
    fromValues: fromValues$2,
    ceil: ceil$2,
    floor: floor$2,
    round: round$2,
    clamp: clamp$2,
    add: add$2,
    addScaled: addScaled$2,
    angle: angle$1,
    subtract: subtract$2,
    sub: sub$2,
    equalsApproximately: equalsApproximately$4,
    equals: equals$4,
    lerp: lerp$2,
    lerpV: lerpV$2,
    max: max$2,
    min: min$2,
    mulScalar: mulScalar$2,
    scale: scale$4,
    divScalar: divScalar$2,
    inverse: inverse$4,
    invert: invert$4,
    cross: cross$1,
    dot: dot$2,
    length: length$2,
    len: len$2,
    lengthSq: lengthSq$2,
    lenSq: lenSq$2,
    distance: distance$2,
    dist: dist$2,
    distanceSq: distanceSq$2,
    distSq: distSq$2,
    normalize: normalize$2,
    negate: negate$4,
    copy: copy$4,
    clone: clone$4,
    multiply: multiply$4,
    mul: mul$4,
    divide: divide$2,
    div: div$2,
    random: random$1,
    zero: zero$2,
    transformMat4: transformMat4$2,
    transformMat3: transformMat3$1
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * 3x3 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat3.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat3.create();
 *     mat3.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat3.identity();
 *     const trans = mat3.translation([1, 2, 3]);
 *     mat3.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType$1 = Float32Array;
// This mess is because with Mat3 we have 3 unused elements.
// For Float32Array and Float64Array that's not an issue
// but for Array it's troublesome
const ctorMap = new Map([
    [Float32Array, () => new Float32Array(12)],
    [Float64Array, () => new Float64Array(12)],
    [Array, () => new Array(12).fill(0)],
]);
let newMat3 = ctorMap.get(Float32Array);
/**
 * Sets the type this library creates for a Mat3
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Mat3
 */
function setDefaultType$4(ctor) {
    const oldType = MatType$1;
    MatType$1 = ctor;
    newMat3 = ctorMap.get(ctor);
    return oldType;
}
/**
 * Create a Mat3 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat3's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat3.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat3Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat3.create` is usually used
 * to create a Mat3 to be filled out as in
 *
 * ```
 * const m = mat3.create();
 * mat3.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @returns matrix created from values.
 */
function create$3(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
    const dst = newMat3();
    // to make the array homogenous
    dst[3] = 0;
    dst[7] = 0;
    dst[11] = 0;
    if (v0 !== undefined) {
        dst[0] = v0;
        if (v1 !== undefined) {
            dst[1] = v1;
            if (v2 !== undefined) {
                dst[2] = v2;
                if (v3 !== undefined) {
                    dst[4] = v3;
                    if (v4 !== undefined) {
                        dst[5] = v4;
                        if (v5 !== undefined) {
                            dst[6] = v5;
                            if (v6 !== undefined) {
                                dst[8] = v6;
                                if (v7 !== undefined) {
                                    dst[9] = v7;
                                    if (v8 !== undefined) {
                                        dst[10] = v8;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return dst;
}
/**
 * Creates a Mat3 from the upper left 3x3 part of a Mat4
 * @param m4 - source matrix
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 made from m4
 */
function fromMat4(m4, dst) {
    dst = dst || newMat3();
    dst[0] = m4[0];
    dst[1] = m4[1];
    dst[2] = m4[2];
    dst[3] = 0;
    dst[4] = m4[4];
    dst[5] = m4[5];
    dst[6] = m4[6];
    dst[7] = 0;
    dst[8] = m4[8];
    dst[9] = m4[9];
    dst[10] = m4[10];
    dst[11] = 0;
    return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$3(m, dst) {
    dst = dst || newMat3();
    dst[0] = -m[0];
    dst[1] = -m[1];
    dst[2] = -m[2];
    dst[4] = -m[4];
    dst[5] = -m[5];
    dst[6] = -m[6];
    dst[8] = -m[8];
    dst[9] = -m[9];
    dst[10] = -m[10];
    return dst;
}
/**
 * Copies a matrix.
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$3(m, dst) {
    dst = dst || newMat3();
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    return dst;
}
/**
 * Copies a matrix (same as copy)
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$3 = copy$3;
/**
 * Check if 2 matrices are approximately equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$3(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON &&
        Math.abs(a[1] - b[1]) < EPSILON &&
        Math.abs(a[2] - b[2]) < EPSILON &&
        Math.abs(a[4] - b[4]) < EPSILON &&
        Math.abs(a[5] - b[5]) < EPSILON &&
        Math.abs(a[6] - b[6]) < EPSILON &&
        Math.abs(a[8] - b[8]) < EPSILON &&
        Math.abs(a[9] - b[9]) < EPSILON &&
        Math.abs(a[10] - b[10]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$3(a, b) {
    return a[0] === b[0] &&
        a[1] === b[1] &&
        a[2] === b[2] &&
        a[4] === b[4] &&
        a[5] === b[5] &&
        a[6] === b[6] &&
        a[8] === b[8] &&
        a[9] === b[9] &&
        a[10] === b[10];
}
/**
 * Creates a 3-by-3 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 3-by-3 identity matrix.
 */
function identity$1(dst) {
    dst = dst || newMat3();
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose$1(m, dst) {
    dst = dst || newMat3();
    if (dst === m) {
        let t;
        // 0 1 2
        // 4 5 6
        // 8 9 10
        t = m[1];
        m[1] = m[4];
        m[4] = t;
        t = m[2];
        m[2] = m[8];
        m[8] = t;
        t = m[6];
        m[6] = m[9];
        m[9] = t;
        return dst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    dst[0] = m00;
    dst[1] = m10;
    dst[2] = m20;
    dst[4] = m01;
    dst[5] = m11;
    dst[6] = m21;
    dst[8] = m02;
    dst[9] = m12;
    dst[10] = m22;
    return dst;
}
/**
 * Computes the inverse of a 3-by-3 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$3(m, dst) {
    dst = dst || newMat3();
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m11_x_m22 = m11 * m22;
    const m21_x_m12 = m21 * m12;
    const m01_x_m22 = m01 * m22;
    const m21_x_m02 = m21 * m02;
    const m01_x_m12 = m01 * m12;
    const m11_x_m02 = m11 * m02;
    const invDet = 1 / (m00 * (m11_x_m22 - m21_x_m12) -
        m10 * (m01_x_m22 - m21_x_m02) +
        m20 * (m01_x_m12 - m11_x_m02));
    dst[0] = +(m11_x_m22 - m21_x_m12) * invDet;
    dst[1] = -(m10 * m22 - m20 * m12) * invDet;
    dst[2] = +(m10 * m21 - m20 * m11) * invDet;
    dst[4] = -(m01_x_m22 - m21_x_m02) * invDet;
    dst[5] = +(m00 * m22 - m20 * m02) * invDet;
    dst[6] = -(m00 * m21 - m20 * m01) * invDet;
    dst[8] = +(m01_x_m12 - m11_x_m02) * invDet;
    dst[9] = -(m00 * m12 - m10 * m02) * invDet;
    dst[10] = +(m00 * m11 - m10 * m01) * invDet;
    return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant$1(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    return m00 * (m11 * m22 - m21 * m12) -
        m10 * (m01 * m22 - m21 * m02) +
        m20 * (m01 * m12 - m11 * m02);
}
/**
 * Computes the inverse of a 3-by-3 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$3 = inverse$3;
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$3(a, b, dst) {
    dst = dst || newMat3();
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    dst[0] = a00 * b00 + a10 * b01 + a20 * b02;
    dst[1] = a01 * b00 + a11 * b01 + a21 * b02;
    dst[2] = a02 * b00 + a12 * b01 + a22 * b02;
    dst[4] = a00 * b10 + a10 * b11 + a20 * b12;
    dst[5] = a01 * b10 + a11 * b11 + a21 * b12;
    dst[6] = a02 * b10 + a12 * b11 + a22 * b12;
    dst[8] = a00 * b20 + a10 * b21 + a20 * b22;
    dst[9] = a01 * b20 + a11 * b21 + a21 * b22;
    dst[10] = a02 * b20 + a12 * b21 + a22 * b22;
    return dst;
}
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$3 = multiply$3;
/**
 * Sets the translation component of a 3-by-3 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation$1(a, v, dst) {
    dst = dst || identity$1();
    if (a !== dst) {
        dst[0] = a[0];
        dst[1] = a[1];
        dst[2] = a[2];
        dst[4] = a[4];
        dst[5] = a[5];
        dst[6] = a[6];
    }
    dst[8] = v[0];
    dst[9] = v[1];
    dst[10] = 1;
    return dst;
}
/**
 * Returns the translation component of a 3-by-3 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation$1(m, dst) {
    dst = dst || create$4();
    dst[0] = m[8];
    dst[1] = m[9];
    return dst;
}
/**
 * Returns an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y,
 * @returns The axis component of m.
 */
function getAxis$1(m, axis, dst) {
    dst = dst || create$4();
    const off = axis * 4;
    dst[0] = m[off + 0];
    dst[1] = m[off + 1];
    return dst;
}
/**
 * Sets an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis$1(m, v, axis, dst) {
    if (dst !== m) {
        dst = copy$3(m, dst);
    }
    const off = axis * 4;
    dst[off + 0] = v[0];
    dst[off + 1] = v[1];
    return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling$1(m, dst) {
    dst = dst || create$4();
    const xx = m[0];
    const xy = m[1];
    const yx = m[4];
    const yy = m[5];
    dst[0] = Math.sqrt(xx * xx + xy * xy);
    dst[1] = Math.sqrt(yx * yx + yy * yy);
    return dst;
}
/**
 * Creates a 3-by-3 matrix which translates by the given vector v.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation$1(v, dst) {
    dst = dst || newMat3();
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[8] = v[0];
    dst[9] = v[1];
    dst[10] = 1;
    return dst;
}
/**
 * Translates the given 3-by-3 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate$1(m, v, dst) {
    dst = dst || newMat3();
    const v0 = v[0];
    const v1 = v[1];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    if (m !== dst) {
        dst[0] = m00;
        dst[1] = m01;
        dst[2] = m02;
        dst[4] = m10;
        dst[5] = m11;
        dst[6] = m12;
    }
    dst[8] = m00 * v0 + m10 * v1 + m20;
    dst[9] = m01 * v0 + m11 * v1 + m21;
    dst[10] = m02 * v0 + m12 * v1 + m22;
    return dst;
}
/**
 * Creates a 3-by-3 matrix which rotates  by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotation$1(angleInRadians, dst) {
    dst = dst || newMat3();
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    return dst;
}
/**
 * Rotates the given 3-by-3 matrix  by the given angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotate$1(m, angleInRadians, dst) {
    dst = dst || newMat3();
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c * m00 + s * m10;
    dst[1] = c * m01 + s * m11;
    dst[2] = c * m02 + s * m12;
    dst[4] = c * m10 - s * m00;
    dst[5] = c * m11 - s * m01;
    dst[6] = c * m12 - s * m02;
    if (m !== dst) {
        dst[8] = m[8];
        dst[9] = m[9];
        dst[10] = m[10];
    }
    return dst;
}
/**
 * Creates a 3-by-3 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     2 entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling$1(v, dst) {
    dst = dst || newMat3();
    dst[0] = v[0];
    dst[1] = 0;
    dst[2] = 0;
    dst[4] = 0;
    dst[5] = v[1];
    dst[6] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    return dst;
}
/**
 * Scales the given 3-by-3 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of 2 entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$3(m, v, dst) {
    dst = dst || newMat3();
    const v0 = v[0];
    const v1 = v[1];
    dst[0] = v0 * m[0 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2];
    dst[4] = v1 * m[1 * 4 + 0];
    dst[5] = v1 * m[1 * 4 + 1];
    dst[6] = v1 * m[1 * 4 + 2];
    if (m !== dst) {
        dst[8] = m[8];
        dst[9] = m[9];
        dst[10] = m[10];
    }
    return dst;
}

var mat3Impl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    setDefaultType: setDefaultType$4,
    create: create$3,
    fromMat4: fromMat4,
    negate: negate$3,
    copy: copy$3,
    clone: clone$3,
    equalsApproximately: equalsApproximately$3,
    equals: equals$3,
    identity: identity$1,
    transpose: transpose$1,
    inverse: inverse$3,
    determinant: determinant$1,
    invert: invert$3,
    multiply: multiply$3,
    mul: mul$3,
    setTranslation: setTranslation$1,
    getTranslation: getTranslation$1,
    getAxis: getAxis$1,
    setAxis: setAxis$1,
    getScaling: getScaling$1,
    translation: translation$1,
    translate: translate$1,
    rotation: rotation$1,
    rotate: rotate$1,
    scaling: scaling$1,
    scale: scale$3
});

/**
 *
 * Vec3 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec3`. In other words you can do this
 *
 *     const v = vec3.cross(v1, v2);  // Creates a new Vec3 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec3.create();
 *     vec3.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec3.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$1 = Float32Array;
/**
 * Sets the type this library creates for a Vec3
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Vec3
 */
function setDefaultType$3(ctor) {
    const oldType = VecType$1;
    VecType$1 = ctor;
    return oldType;
}
/**
 * Creates a vec3; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
function create$2(x, y, z) {
    const dst = new VecType$1(3);
    if (x !== undefined) {
        dst[0] = x;
        if (y !== undefined) {
            dst[1] = y;
            if (z !== undefined) {
                dst[2] = z;
            }
        }
    }
    return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a vec3; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
const fromValues$1 = create$2;
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$1(v, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = Math.ceil(v[0]);
    dst[1] = Math.ceil(v[1]);
    dst[2] = Math.ceil(v[2]);
    return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$1(v, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = Math.floor(v[0]);
    dst[1] = Math.floor(v[1]);
    dst[2] = Math.floor(v[2]);
    return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$1(v, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = Math.round(v[0]);
    dst[1] = Math.round(v[1]);
    dst[2] = Math.round(v[2]);
    return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$1(v, min = 0, max = 1, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = Math.min(max, Math.max(min, v[0]));
    dst[1] = Math.min(max, Math.max(min, v[1]));
    dst[2] = Math.min(max, Math.max(min, v[2]));
    return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$1(a, b, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] + b[0];
    dst[1] = a[1] + b[1];
    dst[2] = a[2] + b[2];
    return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$1(a, b, scale, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] + b[0] * scale;
    dst[1] = a[1] + b[1] * scale;
    dst[2] = a[2] + b[2] * scale;
    return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = a[0];
    const by = a[1];
    const bz = a[2];
    const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
    const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
    const mag = mag1 * mag2;
    const cosine = mag && dot$1(a, b) / mag;
    return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$1(a, b, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    dst[2] = a[2] - b[2];
    return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$1 = subtract$1;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$2(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON &&
        Math.abs(a[1] - b[1]) < EPSILON &&
        Math.abs(a[2] - b[2]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$2(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The linear interpolated result.
 */
function lerp$1(a, b, t, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] + t * (b[0] - a[0]);
    dst[1] = a[1] + t * (b[1] - a[1]);
    dst[2] = a[2] + t * (b[2] - a[2]);
    return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$1(a, b, t, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] + t[0] * (b[0] - a[0]);
    dst[1] = a[1] + t[1] * (b[1] - a[1]);
    dst[2] = a[2] + t[2] * (b[2] - a[2]);
    return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The max components vector.
 */
function max$1(a, b, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = Math.max(a[0], b[0]);
    dst[1] = Math.max(a[1], b[1]);
    dst[2] = Math.max(a[2], b[2]);
    return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The min components vector.
 */
function min$1(a, b, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = Math.min(a[0], b[0]);
    dst[1] = Math.min(a[1], b[1]);
    dst[2] = Math.min(a[2], b[2]);
    return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function mulScalar$1(v, k, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = v[0] * k;
    dst[1] = v[1] * k;
    dst[2] = v[2] * k;
    return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
const scale$2 = mulScalar$1;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function divScalar$1(v, k, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = v[0] / k;
    dst[1] = v[1] / k;
    dst[2] = v[2] / k;
    return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
function inverse$2(v, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = 1 / v[0];
    dst[1] = 1 / v[1];
    dst[2] = 1 / v[2];
    return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
const invert$2 = inverse$2;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of a cross b.
 */
function cross(a, b, dst) {
    dst = dst || new VecType$1(3);
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    dst[0] = a[1] * b[2] - a[2] * b[1];
    dst[1] = t1;
    dst[2] = t2;
    return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$1(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$1(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$1 = length$1;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$1(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return v0 * v0 + v1 * v1 + v2 * v2;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$1 = lengthSq$1;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$1(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$1 = distance$1;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$1(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$1 = distanceSq$1;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The normalized vector.
 */
function normalize$1(v, dst) {
    dst = dst || new VecType$1(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
    if (len > 0.00001) {
        dst[0] = v0 / len;
        dst[1] = v1 / len;
        dst[2] = v2 / len;
    }
    else {
        dst[0] = 0;
        dst[1] = 0;
        dst[2] = 0;
    }
    return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns -v.
 */
function negate$2(v, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = -v[0];
    dst[1] = -v[1];
    dst[2] = -v[2];
    return dst;
}
/**
 * Copies a vector. (same as clone)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
function copy$2(v, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = v[0];
    dst[1] = v[1];
    dst[2] = v[2];
    return dst;
}
/**
 * Clones a vector. (same as copy)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
const clone$2 = copy$2;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$2(a, b, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] * b[0];
    dst[1] = a[1] * b[1];
    dst[2] = a[2] * b[2];
    return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$2 = multiply$2;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$1(a, b, dst) {
    dst = dst || new VecType$1(3);
    dst[0] = a[0] / b[0];
    dst[1] = a[1] / b[1];
    dst[2] = a[2] / b[2];
    return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$1 = divide$1;
/**
 * Creates a random vector
 * @param scale - Default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns The random vector.
 */
function random(scale = 1, dst) {
    dst = dst || new VecType$1(3);
    const angle = Math.random() * 2 * Math.PI;
    const z = Math.random() * 2 - 1;
    const zScale = Math.sqrt(1 - z * z) * scale;
    dst[0] = Math.cos(angle) * zScale;
    dst[1] = Math.sin(angle) * zScale;
    dst[2] = z * scale;
    return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not new one is created.
 * @returns The zeroed vector.
 */
function zero$1(dst) {
    dst = dst || new VecType$1(3);
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    return dst;
}
/**
 * transform vec3 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$1(v, m, dst) {
    dst = dst || new VecType$1(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = (m[3] * x + m[7] * y + m[11] * z + m[15]) || 1;
    dst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    dst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    dst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return dst;
}
/**
 * Transform vec4 by upper 3x3 matrix inside 4x4 matrix.
 * @param v - The direction.
 * @param m - The matrix.
 * @param dst - optional Vec3 to store result. If not passed a new one is created.
 * @returns The transformed vector.
 */
function transformMat4Upper3x3(v, m, dst) {
    dst = dst || new VecType$1(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
    return dst;
}
/**
 * Transforms vec4 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3(v, m, dst) {
    dst = dst || new VecType$1(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    dst[0] = x * m[0] + y * m[4] + z * m[8];
    dst[1] = x * m[1] + y * m[5] + z * m[9];
    dst[2] = x * m[2] + y * m[6] + z * m[10];
    return dst;
}

var vec3Impl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$2,
    setDefaultType: setDefaultType$3,
    fromValues: fromValues$1,
    ceil: ceil$1,
    floor: floor$1,
    round: round$1,
    clamp: clamp$1,
    add: add$1,
    addScaled: addScaled$1,
    angle: angle,
    subtract: subtract$1,
    sub: sub$1,
    equalsApproximately: equalsApproximately$2,
    equals: equals$2,
    lerp: lerp$1,
    lerpV: lerpV$1,
    max: max$1,
    min: min$1,
    mulScalar: mulScalar$1,
    scale: scale$2,
    divScalar: divScalar$1,
    inverse: inverse$2,
    invert: invert$2,
    cross: cross,
    dot: dot$1,
    length: length$1,
    len: len$1,
    lengthSq: lengthSq$1,
    lenSq: lenSq$1,
    distance: distance$1,
    dist: dist$1,
    distanceSq: distanceSq$1,
    distSq: distSq$1,
    normalize: normalize$1,
    negate: negate$2,
    copy: copy$2,
    clone: clone$2,
    multiply: multiply$2,
    mul: mul$2,
    divide: divide$1,
    div: div$1,
    random: random,
    zero: zero$1,
    transformMat4: transformMat4$1,
    transformMat4Upper3x3: transformMat4Upper3x3,
    transformMat3: transformMat3
});

/**
 * 4x4 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat4.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat4.create();
 *     mat4.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat4.identity();
 *     const trans = mat4.translation([1, 2, 3]);
 *     mat4.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType = Float32Array;
/**
 * Sets the type this library creates for a Mat4
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Mat4
 */
function setDefaultType$2(ctor) {
    const oldType = MatType;
    MatType = ctor;
    return oldType;
}
/**
 * Create a Mat4 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat4's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat4.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat4Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat4.create` is usually used
 * to create a Mat4 to be filled out as in
 *
 * ```
 * const m = mat4.create();
 * mat4.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param v9 - value for element 9
 * @param v10 - value for element 10
 * @param v11 - value for element 11
 * @param v12 - value for element 12
 * @param v13 - value for element 13
 * @param v14 - value for element 14
 * @param v15 - value for element 15
 * @returns created from values.
 */
function create$1(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
    const dst = new MatType(16);
    if (v0 !== undefined) {
        dst[0] = v0;
        if (v1 !== undefined) {
            dst[1] = v1;
            if (v2 !== undefined) {
                dst[2] = v2;
                if (v3 !== undefined) {
                    dst[3] = v3;
                    if (v4 !== undefined) {
                        dst[4] = v4;
                        if (v5 !== undefined) {
                            dst[5] = v5;
                            if (v6 !== undefined) {
                                dst[6] = v6;
                                if (v7 !== undefined) {
                                    dst[7] = v7;
                                    if (v8 !== undefined) {
                                        dst[8] = v8;
                                        if (v9 !== undefined) {
                                            dst[9] = v9;
                                            if (v10 !== undefined) {
                                                dst[10] = v10;
                                                if (v11 !== undefined) {
                                                    dst[11] = v11;
                                                    if (v12 !== undefined) {
                                                        dst[12] = v12;
                                                        if (v13 !== undefined) {
                                                            dst[13] = v13;
                                                            if (v14 !== undefined) {
                                                                dst[14] = v14;
                                                                if (v15 !== undefined) {
                                                                    dst[15] = v15;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return dst;
}
/**
 * Creates a Mat4 from a Mat3
 * @param m3 - source matrix
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 made from m3
 */
function fromMat3(m3, dst) {
    dst = dst || new MatType(16);
    dst[0] = m3[0];
    dst[1] = m3[1];
    dst[2] = m3[2];
    dst[3] = 0;
    dst[4] = m3[4];
    dst[5] = m3[5];
    dst[6] = m3[6];
    dst[7] = 0;
    dst[8] = m3[8];
    dst[9] = m3[9];
    dst[10] = m3[10];
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$1(m, dst) {
    dst = dst || new MatType(16);
    dst[0] = -m[0];
    dst[1] = -m[1];
    dst[2] = -m[2];
    dst[3] = -m[3];
    dst[4] = -m[4];
    dst[5] = -m[5];
    dst[6] = -m[6];
    dst[7] = -m[7];
    dst[8] = -m[8];
    dst[9] = -m[9];
    dst[10] = -m[10];
    dst[11] = -m[11];
    dst[12] = -m[12];
    dst[13] = -m[13];
    dst[14] = -m[14];
    dst[15] = -m[15];
    return dst;
}
/**
 * Copies a matrix.
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$1(m, dst) {
    dst = dst || new MatType(16);
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[3] = m[3];
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[7] = m[7];
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
    return dst;
}
/**
 * Copies a matrix (same as copy)
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$1 = copy$1;
/**
 * Check if 2 matrices are approximately equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$1(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON &&
        Math.abs(a[1] - b[1]) < EPSILON &&
        Math.abs(a[2] - b[2]) < EPSILON &&
        Math.abs(a[3] - b[3]) < EPSILON &&
        Math.abs(a[4] - b[4]) < EPSILON &&
        Math.abs(a[5] - b[5]) < EPSILON &&
        Math.abs(a[6] - b[6]) < EPSILON &&
        Math.abs(a[7] - b[7]) < EPSILON &&
        Math.abs(a[8] - b[8]) < EPSILON &&
        Math.abs(a[9] - b[9]) < EPSILON &&
        Math.abs(a[10] - b[10]) < EPSILON &&
        Math.abs(a[11] - b[11]) < EPSILON &&
        Math.abs(a[12] - b[12]) < EPSILON &&
        Math.abs(a[13] - b[13]) < EPSILON &&
        Math.abs(a[14] - b[14]) < EPSILON &&
        Math.abs(a[15] - b[15]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$1(a, b) {
    return a[0] === b[0] &&
        a[1] === b[1] &&
        a[2] === b[2] &&
        a[3] === b[3] &&
        a[4] === b[4] &&
        a[5] === b[5] &&
        a[6] === b[6] &&
        a[7] === b[7] &&
        a[8] === b[8] &&
        a[9] === b[9] &&
        a[10] === b[10] &&
        a[11] === b[11] &&
        a[12] === b[12] &&
        a[13] === b[13] &&
        a[14] === b[14] &&
        a[15] === b[15];
}
/**
 * Creates a 4-by-4 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 4-by-4 identity matrix.
 */
function identity(dst) {
    dst = dst || new MatType(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose(m, dst) {
    dst = dst || new MatType(16);
    if (dst === m) {
        let t;
        t = m[1];
        m[1] = m[4];
        m[4] = t;
        t = m[2];
        m[2] = m[8];
        m[8] = t;
        t = m[3];
        m[3] = m[12];
        m[12] = t;
        t = m[6];
        m[6] = m[9];
        m[9] = t;
        t = m[7];
        m[7] = m[13];
        m[13] = t;
        t = m[11];
        m[11] = m[14];
        m[14] = t;
        return dst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    dst[0] = m00;
    dst[1] = m10;
    dst[2] = m20;
    dst[3] = m30;
    dst[4] = m01;
    dst[5] = m11;
    dst[6] = m21;
    dst[7] = m31;
    dst[8] = m02;
    dst[9] = m12;
    dst[10] = m22;
    dst[11] = m32;
    dst[12] = m03;
    dst[13] = m13;
    dst[14] = m23;
    dst[15] = m33;
    return dst;
}
/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$1(m, dst) {
    dst = dst || new MatType(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;
    const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
        (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
        (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
        (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
        (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
        (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    dst[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
        (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    dst[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
        (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    dst[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
        (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    dst[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
        (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    dst[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
        (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    dst[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
        (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    dst[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
        (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    dst[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
        (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    dst[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
        (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    dst[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
        (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    dst[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
        (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
        (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
        (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
        (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
        (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
}
/**
 * Computes the inverse of a 4-by-4 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$1 = inverse$1;
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$1(a, b, dst) {
    dst = dst || new MatType(16);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a13 = a[4 + 3];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const a23 = a[8 + 3];
    const a30 = a[12 + 0];
    const a31 = a[12 + 1];
    const a32 = a[12 + 2];
    const a33 = a[12 + 3];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b13 = b[4 + 3];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    const b23 = b[8 + 3];
    const b30 = b[12 + 0];
    const b31 = b[12 + 1];
    const b32 = b[12 + 2];
    const b33 = b[12 + 3];
    dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return dst;
}
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$1 = multiply$1;
/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation(a, v, dst) {
    dst = dst || identity();
    if (a !== dst) {
        dst[0] = a[0];
        dst[1] = a[1];
        dst[2] = a[2];
        dst[3] = a[3];
        dst[4] = a[4];
        dst[5] = a[5];
        dst[6] = a[6];
        dst[7] = a[7];
        dst[8] = a[8];
        dst[9] = a[9];
        dst[10] = a[10];
        dst[11] = a[11];
    }
    dst[12] = v[0];
    dst[13] = v[1];
    dst[14] = v[2];
    dst[15] = 1;
    return dst;
}
/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation(m, dst) {
    dst = dst || create$2();
    dst[0] = m[12];
    dst[1] = m[13];
    dst[2] = m[14];
    return dst;
}
/**
 * Returns an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y, 2 = z;
 * @returns The axis component of m.
 */
function getAxis(m, axis, dst) {
    dst = dst || create$2();
    const off = axis * 4;
    dst[0] = m[off + 0];
    dst[1] = m[off + 1];
    dst[2] = m[off + 2];
    return dst;
}
/**
 * Sets an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y, 2 = z;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis(a, v, axis, dst) {
    if (dst !== a) {
        dst = copy$1(a, dst);
    }
    const off = axis * 4;
    dst[off + 0] = v[0];
    dst[off + 1] = v[1];
    dst[off + 2] = v[2];
    return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling(m, dst) {
    dst = dst || create$2();
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 *
 * Note: If you pass `Infinity` for zFar then it will produce a projection matrix
 * returns -Infinity for Z when transforming coordinates with Z <= 0 and +Infinity for Z
 * otherwise.
 *
 * @param fieldOfViewYInRadians - The camera angle from top to bottom (in radians).
 * @param aspect - The aspect ratio width / height.
 * @param zNear - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param zFar - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The perspective matrix.
 */
function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
    dst = dst || new MatType(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    dst[0] = f / aspect;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = f;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[15] = 0;
    if (zFar === Infinity) {
        dst[10] = -1;
        dst[14] = -zNear;
    }
    else {
        const rangeInv = 1 / (zNear - zFar);
        dst[10] = zFar * rangeInv;
        dst[14] = zFar * zNear * rangeInv;
    }
    return dst;
}
/**
 * Computes a 4-by-4 orthogonal transformation matrix that transforms from
 * the given the left, right, bottom, and top dimensions to -1 +1 in x, and y
 * and 0 to +1 in z.
 * @param left - Left side of the near clipping plane viewport.
 * @param right - Right side of the near clipping plane viewport.
 * @param bottom - Bottom of the near clipping plane viewport.
 * @param top - Top of the near clipping plane viewport.
 * @param near - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param far - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The orthographic projection matrix.
 */
function ortho(left, right, bottom, top, near, far, dst) {
    dst = dst || new MatType(16);
    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1 / (near - far);
    dst[11] = 0;
    dst[12] = (right + left) / (left - right);
    dst[13] = (top + bottom) / (bottom - top);
    dst[14] = near / (near - far);
    dst[15] = 1;
    return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param left - The x coordinate of the left plane of the box.
 * @param right - The x coordinate of the right plane of the box.
 * @param bottom - The y coordinate of the bottom plane of the box.
 * @param top - The y coordinate of the right plane of the box.
 * @param near - The negative z coordinate of the near plane of the box.
 * @param far - The negative z coordinate of the far plane of the box.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The perspective projection matrix.
 */
function frustum(left, right, bottom, top, near, far, dst) {
    dst = dst || new MatType(16);
    const dx = (right - left);
    const dy = (top - bottom);
    const dz = (near - far);
    dst[0] = 2 * near / dx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 * near / dy;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = (left + right) / dx;
    dst[9] = (top + bottom) / dy;
    dst[10] = far / dz;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = near * far / dz;
    dst[15] = 0;
    return dst;
}
let xAxis;
let yAxis;
let zAxis;
/**
 * Computes a 4-by-4 aim transformation.
 *
 * This is a matrix which positions an object aiming down positive Z.
 * toward the target.
 *
 * Note: this is **NOT** the inverse of lookAt as lookAt looks at negative Z.
 *
 * @param position - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The aim matrix.
 */
function aim(position, target, up, dst) {
    dst = dst || new MatType(16);
    xAxis = xAxis || create$2();
    yAxis = yAxis || create$2();
    zAxis = zAxis || create$2();
    normalize$1(subtract$1(target, position, zAxis), zAxis);
    normalize$1(cross(up, zAxis, xAxis), xAxis);
    normalize$1(cross(zAxis, xAxis, yAxis), yAxis);
    dst[0] = xAxis[0];
    dst[1] = xAxis[1];
    dst[2] = xAxis[2];
    dst[3] = 0;
    dst[4] = yAxis[0];
    dst[5] = yAxis[1];
    dst[6] = yAxis[2];
    dst[7] = 0;
    dst[8] = zAxis[0];
    dst[9] = zAxis[1];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = position[0];
    dst[13] = position[1];
    dst[14] = position[2];
    dst[15] = 1;
    return dst;
}
/**
 * Computes a 4-by-4 camera aim transformation.
 *
 * This is a matrix which positions an object aiming down negative Z.
 * toward the target.
 *
 * Note: this is the inverse of `lookAt`
 *
 * @param eye - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The aim matrix.
 */
function cameraAim(eye, target, up, dst) {
    dst = dst || new MatType(16);
    xAxis = xAxis || create$2();
    yAxis = yAxis || create$2();
    zAxis = zAxis || create$2();
    normalize$1(subtract$1(eye, target, zAxis), zAxis);
    normalize$1(cross(up, zAxis, xAxis), xAxis);
    normalize$1(cross(zAxis, xAxis, yAxis), yAxis);
    dst[0] = xAxis[0];
    dst[1] = xAxis[1];
    dst[2] = xAxis[2];
    dst[3] = 0;
    dst[4] = yAxis[0];
    dst[5] = yAxis[1];
    dst[6] = yAxis[2];
    dst[7] = 0;
    dst[8] = zAxis[0];
    dst[9] = zAxis[1];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = eye[0];
    dst[13] = eye[1];
    dst[14] = eye[2];
    dst[15] = 1;
    return dst;
}
/**
 * Computes a 4-by-4 view transformation.
 *
 * This is a view matrix which transforms all other objects
 * to be in the space of the view defined by the parameters.
 *
 * @param eye - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The look-at matrix.
 */
function lookAt(eye, target, up, dst) {
    dst = dst || new MatType(16);
    xAxis = xAxis || create$2();
    yAxis = yAxis || create$2();
    zAxis = zAxis || create$2();
    normalize$1(subtract$1(eye, target, zAxis), zAxis);
    normalize$1(cross(up, zAxis, xAxis), xAxis);
    normalize$1(cross(zAxis, xAxis, yAxis), yAxis);
    dst[0] = xAxis[0];
    dst[1] = yAxis[0];
    dst[2] = zAxis[0];
    dst[3] = 0;
    dst[4] = xAxis[1];
    dst[5] = yAxis[1];
    dst[6] = zAxis[1];
    dst[7] = 0;
    dst[8] = xAxis[2];
    dst[9] = yAxis[2];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
    dst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
    dst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
    dst[15] = 1;
    return dst;
}
/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation(v, dst) {
    dst = dst || new MatType(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = v[0];
    dst[13] = v[1];
    dst[14] = v[2];
    dst[15] = 1;
    return dst;
}
/**
 * Translates the given 4-by-4 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate(m, v, dst) {
    dst = dst || new MatType(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    if (m !== dst) {
        dst[0] = m00;
        dst[1] = m01;
        dst[2] = m02;
        dst[3] = m03;
        dst[4] = m10;
        dst[5] = m11;
        dst[6] = m12;
        dst[7] = m13;
        dst[8] = m20;
        dst[9] = m21;
        dst[10] = m22;
        dst[11] = m23;
    }
    dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationX(angleInRadians, dst) {
    dst = dst || new MatType(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = c;
    dst[6] = s;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the x-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateX(m, angleInRadians, dst) {
    dst = dst || new MatType(16);
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[4] = c * m10 + s * m20;
    dst[5] = c * m11 + s * m21;
    dst[6] = c * m12 + s * m22;
    dst[7] = c * m13 + s * m23;
    dst[8] = c * m20 - s * m10;
    dst[9] = c * m21 - s * m11;
    dst[10] = c * m22 - s * m12;
    dst[11] = c * m23 - s * m13;
    if (m !== dst) {
        dst[0] = m[0];
        dst[1] = m[1];
        dst[2] = m[2];
        dst[3] = m[3];
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }
    return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationY(angleInRadians, dst) {
    dst = dst || new MatType(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c;
    dst[1] = 0;
    dst[2] = -s;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = s;
    dst[9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the y-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateY(m, angleInRadians, dst) {
    dst = dst || new MatType(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c * m00 - s * m20;
    dst[1] = c * m01 - s * m21;
    dst[2] = c * m02 - s * m22;
    dst[3] = c * m03 - s * m23;
    dst[8] = c * m20 + s * m00;
    dst[9] = c * m21 + s * m01;
    dst[10] = c * m22 + s * m02;
    dst[11] = c * m23 + s * m03;
    if (m !== dst) {
        dst[4] = m[4];
        dst[5] = m[5];
        dst[6] = m[6];
        dst[7] = m[7];
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }
    return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationZ(angleInRadians, dst) {
    dst = dst || new MatType(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the z-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateZ(m, angleInRadians, dst) {
    dst = dst || new MatType(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst[0] = c * m00 + s * m10;
    dst[1] = c * m01 + s * m11;
    dst[2] = c * m02 + s * m12;
    dst[3] = c * m03 + s * m13;
    dst[4] = c * m10 - s * m00;
    dst[5] = c * m11 - s * m01;
    dst[6] = c * m12 - s * m02;
    dst[7] = c * m13 - s * m03;
    if (m !== dst) {
        dst[8] = m[8];
        dst[9] = m[9];
        dst[10] = m[10];
        dst[11] = m[11];
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }
    return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
function axisRotation(axis, angleInRadians, dst) {
    dst = dst || new MatType(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    dst[0] = xx + (1 - xx) * c;
    dst[1] = x * y * oneMinusCosine + z * s;
    dst[2] = x * z * oneMinusCosine - y * s;
    dst[3] = 0;
    dst[4] = x * y * oneMinusCosine - z * s;
    dst[5] = yy + (1 - yy) * c;
    dst[6] = y * z * oneMinusCosine + x * s;
    dst[7] = 0;
    dst[8] = x * z * oneMinusCosine + y * s;
    dst[9] = y * z * oneMinusCosine - x * s;
    dst[10] = zz + (1 - zz) * c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle. (same as axisRotation)
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
const rotation = axisRotation;
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle.
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function axisRotate(m, axis, angleInRadians, dst) {
    dst = dst || new MatType(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    const r00 = xx + (1 - xx) * c;
    const r01 = x * y * oneMinusCosine + z * s;
    const r02 = x * z * oneMinusCosine - y * s;
    const r10 = x * y * oneMinusCosine - z * s;
    const r11 = yy + (1 - yy) * c;
    const r12 = y * z * oneMinusCosine + x * s;
    const r20 = x * z * oneMinusCosine + y * s;
    const r21 = y * z * oneMinusCosine - x * s;
    const r22 = zz + (1 - zz) * c;
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
    dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
    dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
    dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
    dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
    dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
    dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
    dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
    dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
    dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
    dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
    if (m !== dst) {
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }
    return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle. (same as rotate)
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
const rotate = axisRotate;
/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling(v, dst) {
    dst = dst || new MatType(16);
    dst[0] = v[0];
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = v[1];
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = v[2];
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
}
/**
 * Scales the given 4-by-4 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$1(m, v, dst) {
    dst = dst || new MatType(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    dst[0] = v0 * m[0 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2];
    dst[3] = v0 * m[0 * 4 + 3];
    dst[4] = v1 * m[1 * 4 + 0];
    dst[5] = v1 * m[1 * 4 + 1];
    dst[6] = v1 * m[1 * 4 + 2];
    dst[7] = v1 * m[1 * 4 + 3];
    dst[8] = v2 * m[2 * 4 + 0];
    dst[9] = v2 * m[2 * 4 + 1];
    dst[10] = v2 * m[2 * 4 + 2];
    dst[11] = v2 * m[2 * 4 + 3];
    if (m !== dst) {
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }
    return dst;
}

var mat4Impl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    setDefaultType: setDefaultType$2,
    create: create$1,
    fromMat3: fromMat3,
    negate: negate$1,
    copy: copy$1,
    clone: clone$1,
    equalsApproximately: equalsApproximately$1,
    equals: equals$1,
    identity: identity,
    transpose: transpose,
    inverse: inverse$1,
    determinant: determinant,
    invert: invert$1,
    multiply: multiply$1,
    mul: mul$1,
    setTranslation: setTranslation,
    getTranslation: getTranslation,
    getAxis: getAxis,
    setAxis: setAxis,
    getScaling: getScaling,
    perspective: perspective,
    ortho: ortho,
    frustum: frustum,
    aim: aim,
    cameraAim: cameraAim,
    lookAt: lookAt,
    translation: translation,
    translate: translate,
    rotationX: rotationX,
    rotateX: rotateX,
    rotationY: rotationY,
    rotateY: rotateY,
    rotationZ: rotationZ,
    rotateZ: rotateZ,
    axisRotation: axisRotation,
    rotation: rotation,
    axisRotate: axisRotate,
    rotate: rotate,
    scaling: scaling,
    scale: scale$1
});

/**
 *
 * Vec4 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec4`. In other words you can do this
 *
 *     const v = vec4.cross(v1, v2);  // Creates a new Vec4 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec4.create();
 *     vec4.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec4.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType = Float32Array;
/**
 * Sets the type this library creates for a Vec4
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Vec4
 */
function setDefaultType$1(ctor) {
    const oldType = VecType;
    VecType = ctor;
    return oldType;
}
/**
 * Creates a vec4; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param w - Initial w value.
 * @returns the created vector
 */
function create(x, y, z, w) {
    const dst = new VecType(4);
    if (x !== undefined) {
        dst[0] = x;
        if (y !== undefined) {
            dst[1] = y;
            if (z !== undefined) {
                dst[2] = z;
                if (w !== undefined) {
                    dst[3] = w;
                }
            }
        }
    }
    return dst;
}
/**
 * Creates a vec4; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param z - Initial w value.
 * @returns the created vector
 */
const fromValues = create;
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil(v, dst) {
    dst = dst || new VecType(4);
    dst[0] = Math.ceil(v[0]);
    dst[1] = Math.ceil(v[1]);
    dst[2] = Math.ceil(v[2]);
    dst[3] = Math.ceil(v[3]);
    return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor(v, dst) {
    dst = dst || new VecType(4);
    dst[0] = Math.floor(v[0]);
    dst[1] = Math.floor(v[1]);
    dst[2] = Math.floor(v[2]);
    dst[3] = Math.floor(v[3]);
    return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round(v, dst) {
    dst = dst || new VecType(4);
    dst[0] = Math.round(v[0]);
    dst[1] = Math.round(v[1]);
    dst[2] = Math.round(v[2]);
    dst[3] = Math.round(v[3]);
    return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp(v, min = 0, max = 1, dst) {
    dst = dst || new VecType(4);
    dst[0] = Math.min(max, Math.max(min, v[0]));
    dst[1] = Math.min(max, Math.max(min, v[1]));
    dst[2] = Math.min(max, Math.max(min, v[2]));
    dst[3] = Math.min(max, Math.max(min, v[3]));
    return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add(a, b, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] + b[0];
    dst[1] = a[1] + b[1];
    dst[2] = a[2] + b[2];
    dst[3] = a[3] + b[3];
    return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled(a, b, scale, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] + b[0] * scale;
    dst[1] = a[1] + b[1] * scale;
    dst[2] = a[2] + b[2] * scale;
    dst[3] = a[3] + b[3] * scale;
    return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract(a, b, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    dst[2] = a[2] - b[2];
    dst[3] = a[3] - b[3];
    return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub = subtract;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON &&
        Math.abs(a[1] - b[1]) < EPSILON &&
        Math.abs(a[2] - b[2]) < EPSILON &&
        Math.abs(a[3] - b[3]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The linear interpolated result.
 */
function lerp(a, b, t, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] + t * (b[0] - a[0]);
    dst[1] = a[1] + t * (b[1] - a[1]);
    dst[2] = a[2] + t * (b[2] - a[2]);
    dst[3] = a[3] + t * (b[3] - a[3]);
    return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns the linear interpolated result.
 */
function lerpV(a, b, t, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] + t[0] * (b[0] - a[0]);
    dst[1] = a[1] + t[1] * (b[1] - a[1]);
    dst[2] = a[2] + t[2] * (b[2] - a[2]);
    dst[3] = a[3] + t[3] * (b[3] - a[3]);
    return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The max components vector.
 */
function max(a, b, dst) {
    dst = dst || new VecType(4);
    dst[0] = Math.max(a[0], b[0]);
    dst[1] = Math.max(a[1], b[1]);
    dst[2] = Math.max(a[2], b[2]);
    dst[3] = Math.max(a[3], b[3]);
    return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The min components vector.
 */
function min(a, b, dst) {
    dst = dst || new VecType(4);
    dst[0] = Math.min(a[0], b[0]);
    dst[1] = Math.min(a[1], b[1]);
    dst[2] = Math.min(a[2], b[2]);
    dst[3] = Math.min(a[3], b[3]);
    return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function mulScalar(v, k, dst) {
    dst = dst || new VecType(4);
    dst[0] = v[0] * k;
    dst[1] = v[1] * k;
    dst[2] = v[2] * k;
    dst[3] = v[3] * k;
    return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
const scale = mulScalar;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function divScalar(v, k, dst) {
    dst = dst || new VecType(4);
    dst[0] = v[0] / k;
    dst[1] = v[1] / k;
    dst[2] = v[2] / k;
    dst[3] = v[3] / k;
    return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
function inverse(v, dst) {
    dst = dst || new VecType(4);
    dst[0] = 1 / v[0];
    dst[1] = 1 / v[1];
    dst[2] = 1 / v[2];
    dst[3] = 1 / v[3];
    return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
const invert = inverse;
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]) + (a[3] * b[3]);
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len = length;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq = lengthSq;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist = distance;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return dx * dx + dy * dy + dz * dz + dw * dw;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq = distanceSq;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The normalized vector.
 */
function normalize(v, dst) {
    dst = dst || new VecType(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len > 0.00001) {
        dst[0] = v0 / len;
        dst[1] = v1 / len;
        dst[2] = v2 / len;
        dst[3] = v3 / len;
    }
    else {
        dst[0] = 0;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
    }
    return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns -v.
 */
function negate(v, dst) {
    dst = dst || new VecType(4);
    dst[0] = -v[0];
    dst[1] = -v[1];
    dst[2] = -v[2];
    dst[3] = -v[3];
    return dst;
}
/**
 * Copies a vector. (same as clone)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
function copy(v, dst) {
    dst = dst || new VecType(4);
    dst[0] = v[0];
    dst[1] = v[1];
    dst[2] = v[2];
    dst[3] = v[3];
    return dst;
}
/**
 * Clones a vector. (same as copy)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
const clone = copy;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply(a, b, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] * b[0];
    dst[1] = a[1] * b[1];
    dst[2] = a[2] * b[2];
    dst[3] = a[3] * b[3];
    return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul = multiply;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide(a, b, dst) {
    dst = dst || new VecType(4);
    dst[0] = a[0] / b[0];
    dst[1] = a[1] / b[1];
    dst[2] = a[2] / b[2];
    dst[3] = a[3] / b[3];
    return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div = divide;
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not new one is created.
 * @returns The zeroed vector.
 */
function zero(dst) {
    dst = dst || new VecType(4);
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    return dst;
}
/**
 * transform vec4 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec4 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4(v, m, dst) {
    dst = dst || new VecType(4);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = v[3];
    dst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    dst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    dst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    dst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return dst;
}

var vec4Impl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    setDefaultType: setDefaultType$1,
    create: create,
    fromValues: fromValues,
    ceil: ceil,
    floor: floor,
    round: round,
    clamp: clamp,
    add: add,
    addScaled: addScaled,
    subtract: subtract,
    sub: sub,
    equalsApproximately: equalsApproximately,
    equals: equals,
    lerp: lerp,
    lerpV: lerpV,
    max: max,
    min: min,
    mulScalar: mulScalar,
    scale: scale,
    divScalar: divScalar,
    inverse: inverse,
    invert: invert,
    dot: dot,
    length: length,
    len: len,
    lengthSq: lengthSq,
    lenSq: lenSq,
    distance: distance,
    dist: dist,
    distanceSq: distanceSq,
    distSq: distSq,
    normalize: normalize,
    negate: negate,
    copy: copy,
    clone: clone,
    multiply: multiply,
    mul: mul,
    divide: divide,
    div: div,
    zero: zero,
    transformMat4: transformMat4
});

/**
 * Sets the type this library creates for all types
 * @remarks
 *
 * example:
 *
 * ```
 * setDefaultType(Float64Array);
 * ```
 *
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 */
function setDefaultType(ctor) {
    setDefaultType$4(ctor);
    setDefaultType$2(ctor);
    setDefaultType$5(ctor);
    setDefaultType$3(ctor);
    setDefaultType$1(ctor);
}

export { mat3Impl as mat3, mat4Impl as mat4, setDefaultType, arrayLike as types, utils, vec2Impl as vec2, vec3Impl as vec3, vec4Impl as vec4 };
//# sourceMappingURL=wgpu-matrix.module.js.map
