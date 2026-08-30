// Load .env file manually so TrueForge picks up PORT=8000 locally
const fs = require('fs');
const path = require('path');
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        // Native env vars take precedence (important for Render)
        if (!process.env[key]) {
          process.env[key] = match[2].trim();
        }
      }
    });
  }
} catch (e) {
  // ignore
}

const originalFetch = globalThis.fetch;

if (originalFetch) {
  globalThis.fetch = async function (url, options) {
    if (url && typeof url === 'string' && url.includes('chat/completions') && options && options.body) {
      try {
        const bodyStr = typeof options.body === 'string' ? options.body : options.body.toString();
        const body = JSON.parse(bodyStr);
        if (body.messages && Array.isArray(body.messages)) {
          let changed = false;
          body.messages.forEach(msg => {
            if (msg.role === 'assistant' && 'reasoning_content' in msg) {
              delete msg.reasoning_content;
              changed = true;
            }
          });
          if (changed) {
            options.body = JSON.stringify(body);
          }
        }
      } catch (e) {
        console.error("[fetch patch] Error parsing body:", e);
      }
    }
    return originalFetch.apply(this, arguments);
  };
  console.log("[Backend Patch] Global fetch patched to strip reasoning_content from history.");
} else {
  console.log("[Backend Patch] Warning: globalThis.fetch is not defined.");
}

// Render Port Binding Patch: Force the server to listen on 0.0.0.0 instead of localhost
const net = require('net');
const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function(...args) {
  if (args.length > 0) {
    let port = null;
    let hostIdx = -1;

    if (typeof args[0] === 'number' || typeof args[0] === 'string') {
      port = args[0];
      if (typeof args[1] === 'string') {
        hostIdx = 1;
      }
    } else if (typeof args[0] === 'object' && args[0] !== null) {
      if (args[0].host === 'localhost' || args[0].host === '127.0.0.1') {
        args[0].host = '0.0.0.0';
      } else if (!args[0].host) {
        args[0].host = '0.0.0.0';
      }
    }

    if (hostIdx !== -1) {
      if (args[hostIdx] === 'localhost' || args[hostIdx] === '127.0.0.1') {
        args[hostIdx] = '0.0.0.0';
      }
    } else if (port !== null && args.length >= 1 && typeof args[1] !== 'string') {
      // e.g. listen(8000, () => ...) -> listen(8000, '0.0.0.0', () => ...)
      args.splice(1, 0, '0.0.0.0');
    }
  }
  return originalListen.apply(this, args);
};
console.log("[Backend Patch] net.Server.listen patched to bind to 0.0.0.0");

// CORS Patch: Automatically add CORS headers to all responses and handle OPTIONS preflight
const http = require('http');
const originalEmit = http.Server.prototype.emit;
http.Server.prototype.emit = function(event, req, res) {
  if (event === 'request') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return true; // Stop event propagation for OPTIONS
    }
  }
  return originalEmit.apply(this, arguments);
};
console.log("[Backend Patch] CORS headers injected.");

