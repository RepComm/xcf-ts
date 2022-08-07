export declare enum GimpImageBaseType {
    RGB = 0,
    GRAYSCALE = 1,
    INDEXED = 2
}
/**----XCF 4 or over
 * NOTE:
 * XCF 3 or older's precision was always
 * "8-bit_gamma_integer"
 */
export declare enum GimpPrecision {
    "8-bit_linear_integer" = 100,
    "8-bit_gamma_integer" = 150,
    "16-bit_linear_integer" = 200,
    "16-bit_gamma_integer" = 250,
    "32-bit_linear_integer" = 300,
    "32-bit_gamma_integer" = 350,
    "16-bit_linear_floating_point" = 500,
    "16-bit_gamma_floating_point" = 550,
    "32-bit_linear_floating_point" = 600,
    "32-bit_gamma_floating_point" = 650,
    "64-bit_linear_floating_point" = 700,
    "64-bit_gamma_floating_point" = 750
}
export interface XCFReadResult {
    version: string;
    versionAsNumber: number;
    width?: number;
    height?: number;
    base_type?: GimpImageBaseType;
    precision?: GimpPrecision;
}
export declare class XCFReader {
    view: DataView;
    offset: number;
    textDecoder: TextDecoder;
    constructor();
    init(ab: ArrayBuffer): this;
    word(signed?: boolean): number;
    float(): number;
    pointer(): void;
    bytes(count: number): ArrayBuffer;
    string(raw?: boolean, count?: number, rawTrailingNull?: boolean): string;
    version(): string;
    read(url: string): Promise<XCFReadResult>;
}
