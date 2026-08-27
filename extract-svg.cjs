const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\1a93c72d-85fb-4635-8615-b4f460a09581\\.system_generated\\logs\\transcript_full.jsonl';
const outputPath = 'd:\\The-Agent-Harness\\src\\components\\ui\\SolaceUILogo.tsx';

async function extractSvg() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lastUserInput = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      // Ensure we get the latest message where the user pasted the SVG (which starts with <?xml)
      if (parsed.type === 'USER_INPUT' && parsed.content.includes('<svg')) {
        lastUserInput = parsed.content;
      }
    } catch (e) {
      // ignore
    }
  }

  if (lastUserInput) {
    const svgMatch = lastUserInput.match(/(<svg[\s\S]*?<\/svg>)/);
    if (svgMatch) {
      let svgCode = svgMatch[1];
      
      const componentCode = `import React from 'react';

export const SolaceUILogo = ({ className }: { className?: string }) => {
  return (
    <div 
      className={\`flex items-center justify-center \${className || ''} [&>svg]:w-full [&>svg]:h-full\`}
      dangerouslySetInnerHTML={{ __html: \`${svgCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} 
    />
  );
};
`;
      fs.writeFileSync(outputPath, componentCode);
      console.log('Successfully extracted SVG and created SolaceUILogo.tsx');
    } else {
      console.log('SVG not found in the last message.');
    }
  } else {
    console.log('User input not found.');
  }
}

extractSvg();
