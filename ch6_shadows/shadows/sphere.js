// ----------------------------------------------------------------------
// sphere.js
//
// Create a unit sphere using recursive subdivision.
//
// Author: Mahesh Venkitachalam
// ----------------------------------------------------------------------

// normalize a vec3
function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
}

// midpoint of two vec3s, projected to unit sphere
function midpoint(a, b) {
    return normalize([
        0.5 * (a[0] + b[0]),
        0.5 * (a[1] + b[1]),
        0.5 * (a[2] + b[2]),
    ]);
}

// spherical UVs from normal
function computeUV(n) {
    const u = 0.5 + Math.atan2(n[2], n[0]) / (2 * Math.PI);
    const v = 0.5 - Math.asin(n[1]) / Math.PI;
    return [u, v];
}

// recursive subdivision
function subdivide(v0, v1, v2, level, out) {
    if (level === 0) {
        for (const v of [v0, v1, v2]) {
            const n = v; // unit sphere: position == normal
            const uv = computeUV(n);

            out.push(
                v[0], v[1], v[2],
                n[0], n[1], n[2],
                uv[0], uv[1]
            );
        }
        return;
    }

    const v01 = midpoint(v0, v1);
    const v12 = midpoint(v1, v2);
    const v20 = midpoint(v2, v0);

    level--;

    subdivide(v0,  v01, v20, level, out);
    subdivide(v01, v1,  v12, level, out);
    subdivide(v20, v12, v2,  level, out);
    subdivide(v01, v12, v20, level, out);
}

// Create sphere vertices
// level = subdivision depth (0..5 typical)
function createSphereVertices(level) {
    const vertices = [];

    // octahedron base
    const Xp = [ 1, 0, 0];
    const Xm = [-1, 0, 0];
    const Yp = [ 0, 1, 0];
    const Ym = [ 0,-1, 0];
    const Zp = [ 0, 0, 1];
    const Zm = [ 0, 0,-1];

    // 8 faces
    subdivide(Xp, Zp, Yp, level, vertices);
    subdivide(Yp, Zp, Xm, level, vertices);
    subdivide(Xm, Zp, Ym, level, vertices);
    subdivide(Ym, Zp, Xp, level, vertices);

    subdivide(Yp, Zm, Xp, level, vertices);
    subdivide(Xp, Zm, Ym, level, vertices);
    subdivide(Ym, Zm, Xm, level, vertices);
    subdivide(Xm, Zm, Yp, level, vertices);

    return new Float32Array(vertices);
}

// Create renderable sphere
export async function createSphere(device, level = 3) {

    const vertices = createSphereVertices(level);

    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    return {
        vertexBuffer: vertexBuffer,
        count: vertices.length / 8,
    };
}
