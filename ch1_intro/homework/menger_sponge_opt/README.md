## Menger Sponge 

Use this shader for grayscale:

```
@fragment fn fragment_main(fragData: VertexOut) -> @location(0) vec4f 
{
    var grey =  0.21 * fragData.color.r + 0.72 * fragData.color.g + 0.07 * fragData.color.b;
    return vec4f(grey, grey, grey, 1);
}
```

And this MVP matrix:

```
// create projection matrix 
const aspect = canvas.width / canvas.height;
const projMat = mat4.perspective(
    (2 * Math.PI) / 20, // FOV
    aspect,
    1,
    100.0
);

// create lookAt matrix
const eye = [-3.2, -3.2, 3.2];
const target = [0, 0, 0];
const up = [0, 0, 1];
const lookAtMat = mat4.lookAt(eye, target, up);
```

