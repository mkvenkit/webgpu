// ----------------------------------------------------------------------
// volreader.js
// 
// Reading the data and creating a 3D texture.
// 
// Author: Mahesh Venkitachalam
// 
// ----------------------------------------------------------------------

export async function loadVolume(dirName, device) {
    // read file names from json
    const fileListUrl = `${dirName}/list.json`;
    const fileList = await fetch(fileListUrl).then(res => res.json());

    console.log(`Loading images from ${dirName}`);

    const firstBitmap = await fetch(`${dirName}/${fileList[0]}`)
        .then(res => res.blob())
        .then(createImageBitmap);

    const width = firstBitmap.width;
    const height = firstBitmap.height;
    const depth = fileList.length;

    console.log('data dims: ' + width + ' x ' + height + ' x ' + depth);

    const texture = device.createTexture({
        size: { width, height, depthOrArrayLayers: depth },
        format: "r8unorm", // grayscale / red channel only
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        dimension: "3d"
    });

    for (let z = 0; z < fileList.length; z++) {
        const fileName = fileList[z];
        const imageUrl = `${dirName}/${fileName}`;
        try {
            const bitmap = await fetch(imageUrl)
                .then(res => res.blob())
                .then(createImageBitmap);

            if (bitmap.width !== width || bitmap.height !== height) {
                console.error(`Size mismatch in ${fileName}, skipping.`);
                continue;
            }

            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(bitmap, 0, 0);
            const imageData = ctx.getImageData(0, 0, width, height);

            const redChannel = new Uint8Array(width * height);
            for (let i = 0; i < width * height; i++) {
                redChannel[i] = imageData.data[i * 4]; // R from RGBA
            }

            device.queue.writeTexture(
                {
                    texture,
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z }
                },
                redChannel,
                {
                    bytesPerRow: width,
                    rowsPerImage: height
                },
                {
                    width,
                    height,
                    depthOrArrayLayers: 1
                }
            );
        } catch (err) {
            console.warn(`Invalid image: ${imageUrl}`, err);
        }
    }

    return {
        texture,
        width,
        height,
        depth
    };
}
