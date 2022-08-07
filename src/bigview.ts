
export function isBigInt (n: number|BigInt): boolean {
  return typeof(n) === "bigint";
}

export class BigView extends DataView {
  
  constructor (buffer: ArrayBuffer, byteOffset?: number, byteLength?: number) {
    super(buffer, byteOffset, byteLength);
    
  }
  getInt8(byteOffset: number|BigInt): number {
    if (isBigInt(byteOffset)) {

    }
  }
}
