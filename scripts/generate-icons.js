const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '../public/logo.svg');
const icon192 = path.join(__dirname, '../public/icon-192x192.png');
const icon512 = path.join(__dirname, '../public/icon-512x512.png');

async function process() {
    await sharp(svgPath).resize(192, 192).png().toFile(icon192);
    await sharp(svgPath).resize(512, 512).png().toFile(icon512);
    console.log('Icons generated successfully');
}
process();
