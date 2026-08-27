const fs = require('fs');

const svgPath = 'public/sudharshan prabhu.svg';
let content = fs.readFileSync(svgPath, 'utf8');

// Find all unique fill colors
const fillRegex = /fill="#([A-Fa-f0-9]{6})"/g;
const matches = [...content.matchAll(fillRegex)];
const uniqueColors = [...new Set(matches.map(m => m[1]))];

console.log("Unique colors found:", uniqueColors);

// The colors are all shades of yellow/gold/brown.
// Let's compute their relative brightness (luminance) and map that to opacity.
function getLuminance(hex) {
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const colorLuminance = {};
let maxLum = 0;
let minLum = 1;

uniqueColors.forEach(hex => {
    const lum = getLuminance(hex);
    colorLuminance[hex] = lum;
    if (lum > maxLum) maxLum = lum;
    if (lum < minLum) minLum = lum;
});

// Replace each color with white and calculate opacity
uniqueColors.forEach(hex => {
    const lum = colorLuminance[hex];
    // Map luminance to opacity. 
    // Brighter color -> higher opacity (more solid white)
    // Darker color -> lower opacity (more transparent white)
    // Let's map minLum to 0.3 and maxLum to 1.0
    let opacity = 1.0;
    if (maxLum > minLum) {
        opacity = 0.3 + 0.7 * ((lum - minLum) / (maxLum - minLum));
    }
    opacity = Math.round(opacity * 100) / 100; // round to 2 decimals

    const replaceRegex = new RegExp(`fill="#${hex}"`, 'g');
    content = content.replace(replaceRegex, `fill="white" fill-opacity="${opacity}"`);
});

fs.writeFileSync(svgPath, content);
console.log("Replaced colors with white + opacity!");
