// Polyfill for SlowBuffer in Node.js 25+
// This must be loaded before any module that uses buffer-equal-constant-time
const bufferModule = require('buffer');

// Node.js 25+ removed SlowBuffer, but some packages still need it
if (!bufferModule.SlowBuffer) {
    // Create SlowBuffer as an alias to Buffer
    bufferModule.SlowBuffer = bufferModule.Buffer;
    
    // Ensure SlowBuffer.prototype exists for packages that access it
    if (bufferModule.Buffer && !bufferModule.SlowBuffer.prototype) {
        bufferModule.SlowBuffer.prototype = bufferModule.Buffer.prototype;
    }
}

