import * as bufferModule from "buffer";

const bufferAny = bufferModule as any;

if (!bufferAny.SlowBuffer) {
	bufferAny.SlowBuffer = bufferAny.Buffer;
}

