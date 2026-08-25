export async function resolve(specifier, context, nextResolve) {
  if (specifier.match(/^[a-zA-Z]:[\\\/]/)) {
    specifier = `file:///${specifier.replace(/\\/g, '/')}`;
  }
  return nextResolve(specifier, context);
}
