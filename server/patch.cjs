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
