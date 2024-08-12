// ----------------------------------------------------------------------
// plane.js
// 
// Texture mapping demo
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

export async function createPlane(device, side) {
    // fetch shader code as a string
    let response = await fetch("plane.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    
    // create shader module
    const shaderModule = device.createShaderModule({
        label: 'plane shader',
        code: shader_str,
    });

    // create a GPURenderPipelineDescriptor object
    const pipelineDescriptor = {
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat()
            }]
        },
        primitive: {
            topology: 'triangle-strip',
        },
        layout: 'auto'
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
    return {
        renderPipeline: renderPipeline,
    };

}
