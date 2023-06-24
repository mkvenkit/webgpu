// ----------------------------------------------------------------------
// hello_triangle.js
// 
// Main JavaScript file for the Hello Triangle WebGPU example.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

// Define main function 
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

    // get shaders 
    const response = await fetch("hello_triangle.wgsl");
    if (!response.ok) {
        alert(`fetch: HTTP error! status: ${response.status}`);
        return;
    }
    const shader_str = await response.text();
    //console.log("shader = ", shader_str);

    // create shader module 
    const shaderModule = device.createShaderModule({
        label: 'Hello Triangle shaders',
        code: shader_str,
    });

    // create pipeline descriptor 
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
            topology: 'triangle-list'
        },
        layout: 'auto'
    };

    // create render pipeline 
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
  
    // create a renderpass descriptor 
    const renderPassDescriptor = {
        colorAttachments: [{
          clearValue: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView()
        }]
      };

    // define render function 
    function render() {
        // make a command encoder to start encoding commands
        const encoder = device.createCommandEncoder({ label: 'Hello Triangle encoder' });
        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        // set the render pipeline 
        pass.setPipeline(renderPipeline);
        // draw - call our vertex shader 3 times 
        pass.draw(3);  
        // end render pass
        pass.end();
        // finish 
        const commandBuffer = encoder.finish();
        // submit queue to GPU 
        device.queue.submit([commandBuffer]);
    }

    // call render function 
    render();
}

// run main function 
main();