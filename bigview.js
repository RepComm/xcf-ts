export function isBigInt(n) {
  return typeof n === "bigint";
}
export class BigView extends DataView {
  constructor(buffer, byteOffset, byteLength) {
    super(buffer, byteOffset, byteLength);
  }

  getInt8(byteOffset) {
    if (isBigInt(byteOffset)) {}
  }

}