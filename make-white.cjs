const fs = require('fs');

const svgPath = 'public/sudharshan prabhu.svg';
let content = fs.readFileSync(svgPath, 'utf8');

// Replace all fill="..." with fill="white"
// Also remove any fill-opacity="..."
content = content.replace(/fill="[^"]+"/g, 'fill="white"');
content = content.replace(/fill-opacity="[^"]+"/g, '');

fs.writeFileSync(svgPath, content);
console.log("Made fully solid white!");
