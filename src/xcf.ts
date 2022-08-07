import { 
  KnownPropIds, 
  ParasiteDef, 
  PropertyBase, 
  PROP_COLOR_TAG, 
  PROP_FLOAT_OPACITY, 
  PROP_ITEM_SET_ITEM, 
  PROP_LINKED, 
  PROP_LOCK_CONTENT, 
  PROP_LOCK_POSITION, 
  PROP_LOCK_VISIBILITY, 
  PROP_OPACITY, 
  PROP_PARASITES, 
  PROP_TATTOO, 
  PROP_VISIBLE
} from "./props.js";

export enum GimpImageBaseType {
  RGB,
  GRAYSCALE,
  INDEXED
}

/**----XCF 4 or over
 * NOTE:
 * XCF 3 or older's precision was always
 * "8-bit_gamma_integer"
 */
export enum GimpPrecision {

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
  "64-bit_gamma_floating_point" = 750,

  //For XCF 4 (which was a development version, hence
  //this format should not be found often and may be
  //ignored by readers), its value may be one of:

  // "8-bit_gamma_integer" = 0,
  // "16-bit_gamma_integer" = 1,
  // "32-bit_linear_integer" = 2,
  // "16-bit_linear_floating_point" = 3,
  // "32-bit_linear_floating_point" = 4,

  //For XCF 5 or 6 (which were development versions,
  // hence these formats may be ignored by readers),
  // its value may be one of:

  // "8-bit_linear_integer" = 100,
  // "8-bit_gamma_integer" = 150,
  // "16-bit_linear_integer" = 200,
  // "16-bit_gamma_integer" = 250,
  // "32-bit_linear_integer" = 300,
  // "32-bit_gamma_integer" = 350,
  // "16-bit_linear_floating_point" = 400,
  // "16-bit_gamma_floating_point" = 450,
  // "32-bit_linear_floating_point" = 500,
  // "32-bit_gamma_floating_point" = 550,


}

export interface XCFReadResult {
  version: string;
  versionAsNumber: number;
  width?: number;
  height?: number;
  base_type?: GimpImageBaseType;
  precision?: GimpPrecision;
  properties?: Array<PropertyBase>;
  layers?: Array<LayerDef>;
}

//WORD - int32 bi
//FLOAT - 754 32bit bi
//STRING - uint32 n+1 , utf8 char[n], byte 0
//Empty string - uint32 (0)

/**(see enum GimpImageType in libgimpbase/gimpbaseenums.h)*/
export enum GimpImageType {
  "RGB_color_without alpha",
  "RGB_color_with alpha",
  "Grayscale_without_alpha",
  "Grayscale_with_alpha",
  "Indexed_without_alpha",
  "Indexed_with_alpha",
}

export type GimpPointer = number|BigInt;

export interface LayerDef {
  /**uint32*/
  width: number;
  /**uint32*/
  height: number;
  /**uint32*/
  type: GimpImageType;

  name: string;

  properties: Array<PropertyBase>;

  //Pointer to the hierarchy structure with the pixels
  hptr: GimpPointer;
  //Pointer to the layer mask (a channel structure), or 0
  mptr: GimpPointer;
}

export class XCFReader {
  view: DataView;
  offsetStack: Array<number>;
  offset: number;
  textDecoder: TextDecoder;

  constructor() {
    this.textDecoder = new TextDecoder();
    this.offsetStack = new Array();
  }
  init(ab: ArrayBuffer): this {
    this.view = new DataView(ab);
    this.offset = 0;
    this.offsetStack.length = 0;
    return this;
  }
  push (): this {
    this.offsetStack.push(this.offset);
    return this;
  }
  jump (offset: number): this {
    this.offset = offset;
    return this;
  }
  pop (): this {
    this.offset = this.offsetStack.pop();
    return this;
  }
  word(signed: boolean = true): number {
    let result = signed ?
      this.view.getInt32(this.offset, false) :
      this.view.getUint32(this.offset, false);

    this.offset += 4;
    return result;
  }
  float(): number {
    let result = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return result;
  }
  word64(signed: boolean = true): BigInt {
    let result = signed ?
      this.view.getBigInt64(this.offset, false) :
      this.view.getBigUint64(this.offset, false);

    this.offset += 8;
    return result;
  }
  pointer(xcfVersion: number): GimpPointer {
    if (xcfVersion < 11) {
      return this.word(false);
    } else {
      return this.word64(false);
    }
  }
  bytes(count: number): ArrayBuffer {
    let result = this.view.buffer.slice(
      this.offset,
      this.offset + count
    );
    this.offset += count;
    return result;
  }
  rawString (size: number): string {
    if (size < 1) return "";

    let strData = this.bytes(size);
    let result = this.textDecoder.decode(strData);

    //+1 for trailing null
    this.offset ++;

    return result;
  }
  string(): string {
    let payloadLength = this.word(false);
    let size = payloadLength - 1;
    if (size < 1) return "";

    let strData = this.bytes(size);
    let result = this.textDecoder.decode(strData);

    this.offset += 1; //trailing null byte

    return result;
  }
  version(): string {
    return this.rawString(13);
  }
  /**
   * Reads a property from a property list into 'out'
   * @param out 
   * @returns false when type === 0 (last item in prop list), true otherwise
   */
  property(out: PropertyBase): boolean {
    out.type = this.word(false);
    out.length = this.word(false);
    if (out.type === 0) return false;

    out.payload = this.bytes(out.length);

    let pdv = new DataView(out.payload);

    switch (out.type) {
      case KnownPropIds.COLOR_TAG:
        (out as PROP_COLOR_TAG).tag = pdv.getUint32(0);
        break;
      case KnownPropIds.END:
        //Found end of property list
        break;
      case KnownPropIds.FLOAT_OPACITY:
        (out as PROP_FLOAT_OPACITY).opacity = pdv.getFloat32(0);
        break;
      case KnownPropIds.LINKED:
        (out as PROP_LINKED).linked = pdv.getUint32(0) === 1;
        break;
      case KnownPropIds.LOCK_CONTENT:
      case KnownPropIds.LOCK_POSITION:
      case KnownPropIds.LOCK_VISIBILITY:
        (
          out as
          PROP_LOCK_CONTENT |
          PROP_LOCK_POSITION |
          PROP_LOCK_VISIBILITY
        ).locked = pdv.getUint32(0) === 1;
        break;
      case KnownPropIds.OPACITY:
        (out as PROP_OPACITY).opacity = pdv.getUint32(0);
        break;
      case KnownPropIds.PARASITES:
        try {
          let parasites = (out as PROP_PARASITES).parasites = new Array<ParasiteDef>();
          for (let i = 0; i < pdv.byteLength;) {
            let nameLength = pdv.getUint32(i); i += 4;
            let name = "";

            if (nameLength > 1) {
              let strData = pdv.buffer.slice(i, i + nameLength -1); i += nameLength;
              name = this.textDecoder.decode(strData);
              // i++; //trailing null
            }

            let flags = pdv.getUint32(i); i += 4;

            let pplength = pdv.getUint32(i); i += 4;

            parasites.push({
              name,
              flags,
              length: pplength,
              payload: pdv.buffer.slice(i, i + pplength)
            });
            i += pplength;

          }

        } catch (ex) {
          console.warn(ex);
          //we can safely skip issues here since
          //we still have the right offset in the data
        }
        break;
      case KnownPropIds.TATTOO:
        (out as PROP_TATTOO).tattoo = pdv.getUint32(0);
        break;
      case KnownPropIds.VISIBLE:
        (out as PROP_VISIBLE).visible = pdv.getUint32(0) === 1;
        break;
      case KnownPropIds.ITEM_SET_ITEM:
        (out as PROP_ITEM_SET_ITEM).setId = pdv.getUint32(0);
        break;
      default:
        //TODO - handle unknown types
        // console.warn("unknown property type", out.type);
        break;
    }

    return true;
  }
  readArrayBuffer(ab: ArrayBuffer): XCFReadResult {

    this.init(ab);

    let vStr = this.version();
    let v = vStr.substring(9);

    let nv = v === "file" ? 0 : parseFloat(v.substring(1));

    let result: XCFReadResult = {
      version: v,
      versionAsNumber: nv,
      width: this.word(false),
      height: this.word(false),
      base_type: this.word(false),
      precision: nv > 3 ?
        this.word(false) :
        GimpPrecision["8-bit_gamma_integer"],
      properties: new Array(),
      layers: new Array()
    };

    let prop: PropertyBase = {
      type: undefined,
      length: undefined,
    };

    while (this.property(prop)) {
      let unique: PropertyBase = {
        type: undefined,
        length: undefined,
      };

      Object.assign(unique, prop);
      result.properties.push(unique);

      if (prop.type === KnownPropIds.PARASITES) {
        let parasitesProp = prop as PROP_PARASITES;
        for (let parasite of parasitesProp.parasites) {
          if (parasite.name.toLowerCase().startsWith("gimp")) {
            let parasiteData = this.textDecoder.decode(parasite.payload);
            console.log(`${parasite.name} : "${parasiteData}"`);
          }
        }
      }
    }

    let ptr: BigInt|number = 0;
    let layerPointers = new Array<GimpPointer>();

    while ( (ptr = this.pointer(nv)) != 0) {
      layerPointers.push(ptr);
      if (ptr > this.view.byteLength) {
        console.log("gtr than allowed");
      }
    }
    
    let channelPointers = new Array<GimpPointer>();
    while ( (ptr = this.pointer(nv)) != 0) {
      channelPointers.push(ptr);
      if (ptr > this.view.byteLength) {
        console.log("gtr than allowed");
      }
    }

    this.push();
    for (let lptr of layerPointers) {
      let lptrn = new Number(lptr) as number;
      this.jump(lptrn);
      let layer: LayerDef = {
        width: this.word(false),
        height: this.word(false),
        type: this.word(false),
        name: this.string(),
        properties: new Array(),
        hptr: undefined,
        mptr: undefined
      };
      while (this.property(prop)) {
        let unique: PropertyBase = {
          type: undefined,
          length: undefined,
        };
  
        Object.assign(unique, prop);
        layer.properties.push(unique);
      }

      layer.hptr = this.pointer(nv);
      layer.mptr = this.pointer(nv);

      // console.log("Layer", layer);
      result.layers.push(layer);

    }
    this.pop();
    
    return result;
  }
  read(url: string): Promise<XCFReadResult> {
    return new Promise(async (_resolve, _reject) => {
      let r: Response;
      let ab: ArrayBuffer;

      try {
        r = await fetch(url);
      } catch (ex) { _reject(ex); return; }

      try {
        ab = await r.arrayBuffer();
      } catch (ex) { _reject(ex); return; }

      let result = this.readArrayBuffer(ab);

      _resolve(result);
    });
  }
}
