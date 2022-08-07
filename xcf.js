import { KnownPropIds } from "./props.js";
export let GimpImageBaseType;
/**----XCF 4 or over
 * NOTE:
 * XCF 3 or older's precision was always
 * "8-bit_gamma_integer"
 */

(function (GimpImageBaseType) {
  GimpImageBaseType[GimpImageBaseType["RGB"] = 0] = "RGB";
  GimpImageBaseType[GimpImageBaseType["GRAYSCALE"] = 1] = "GRAYSCALE";
  GimpImageBaseType[GimpImageBaseType["INDEXED"] = 2] = "INDEXED";
})(GimpImageBaseType || (GimpImageBaseType = {}));

export let GimpPrecision;

(function (GimpPrecision) {
  GimpPrecision[GimpPrecision["8-bit_linear_integer"] = 100] = "8-bit_linear_integer";
  GimpPrecision[GimpPrecision["8-bit_gamma_integer"] = 150] = "8-bit_gamma_integer";
  GimpPrecision[GimpPrecision["16-bit_linear_integer"] = 200] = "16-bit_linear_integer";
  GimpPrecision[GimpPrecision["16-bit_gamma_integer"] = 250] = "16-bit_gamma_integer";
  GimpPrecision[GimpPrecision["32-bit_linear_integer"] = 300] = "32-bit_linear_integer";
  GimpPrecision[GimpPrecision["32-bit_gamma_integer"] = 350] = "32-bit_gamma_integer";
  GimpPrecision[GimpPrecision["16-bit_linear_floating_point"] = 500] = "16-bit_linear_floating_point";
  GimpPrecision[GimpPrecision["16-bit_gamma_floating_point"] = 550] = "16-bit_gamma_floating_point";
  GimpPrecision[GimpPrecision["32-bit_linear_floating_point"] = 600] = "32-bit_linear_floating_point";
  GimpPrecision[GimpPrecision["32-bit_gamma_floating_point"] = 650] = "32-bit_gamma_floating_point";
  GimpPrecision[GimpPrecision["64-bit_linear_floating_point"] = 700] = "64-bit_linear_floating_point";
  GimpPrecision[GimpPrecision["64-bit_gamma_floating_point"] = 750] = "64-bit_gamma_floating_point";
})(GimpPrecision || (GimpPrecision = {}));

//WORD - int32 bi
//FLOAT - 754 32bit bi
//STRING - uint32 n+1 , utf8 char[n], byte 0
//Empty string - uint32 (0)

/**(see enum GimpImageType in libgimpbase/gimpbaseenums.h)*/
export let GimpImageType;

(function (GimpImageType) {
  GimpImageType[GimpImageType["RGB_color_without alpha"] = 0] = "RGB_color_without alpha";
  GimpImageType[GimpImageType["RGB_color_with alpha"] = 1] = "RGB_color_with alpha";
  GimpImageType[GimpImageType["Grayscale_without_alpha"] = 2] = "Grayscale_without_alpha";
  GimpImageType[GimpImageType["Grayscale_with_alpha"] = 3] = "Grayscale_with_alpha";
  GimpImageType[GimpImageType["Indexed_without_alpha"] = 4] = "Indexed_without_alpha";
  GimpImageType[GimpImageType["Indexed_with_alpha"] = 5] = "Indexed_with_alpha";
})(GimpImageType || (GimpImageType = {}));

export class XCFReader {
  constructor() {
    this.textDecoder = new TextDecoder();
    this.offsetStack = new Array();
  }

  init(ab) {
    this.view = new DataView(ab);
    this.offset = 0;
    this.offsetStack.length = 0;
    return this;
  }

  push() {
    this.offsetStack.push(this.offset);
    return this;
  }

  jump(offset) {
    this.offset = offset;
    return this;
  }

  pop() {
    this.offset = this.offsetStack.pop();
    return this;
  }

  word(signed = true) {
    let result = signed ? this.view.getInt32(this.offset, false) : this.view.getUint32(this.offset, false);
    this.offset += 4;
    return result;
  }

  float() {
    let result = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return result;
  }

  word64(signed = true) {
    let result = signed ? this.view.getBigInt64(this.offset, false) : this.view.getBigUint64(this.offset, false);
    this.offset += 8;
    return result;
  }

  pointer(xcfVersion) {
    if (xcfVersion < 11) {
      return this.word(false);
    } else {
      return this.word64(false);
    }
  }

  bytes(count) {
    let result = this.view.buffer.slice(this.offset, this.offset + count);
    this.offset += count;
    return result;
  }

  rawString(size) {
    if (size < 1) return "";
    let strData = this.bytes(size);
    let result = this.textDecoder.decode(strData); //+1 for trailing null

    this.offset++;
    return result;
  }

  string() {
    let payloadLength = this.word(false);
    let size = payloadLength - 1;
    if (size < 1) return "";
    let strData = this.bytes(size);
    let result = this.textDecoder.decode(strData);
    this.offset += 1; //trailing null byte

    return result;
  }

  version() {
    return this.rawString(13);
  }
  /**
   * Reads a property from a property list into 'out'
   * @param out 
   * @returns false when type === 0 (last item in prop list), true otherwise
   */


  property(out) {
    out.type = this.word(false);
    out.length = this.word(false);
    if (out.type === 0) return false;
    out.payload = this.bytes(out.length);
    let pdv = new DataView(out.payload);

    switch (out.type) {
      case KnownPropIds.COLOR_TAG:
        out.tag = pdv.getUint32(0);
        break;

      case KnownPropIds.END:
        //Found end of property list
        break;

      case KnownPropIds.FLOAT_OPACITY:
        out.opacity = pdv.getFloat32(0);
        break;

      case KnownPropIds.LINKED:
        out.linked = pdv.getUint32(0) === 1;
        break;

      case KnownPropIds.LOCK_CONTENT:
      case KnownPropIds.LOCK_POSITION:
      case KnownPropIds.LOCK_VISIBILITY:
        out.locked = pdv.getUint32(0) === 1;
        break;

      case KnownPropIds.OPACITY:
        out.opacity = pdv.getUint32(0);
        break;

      case KnownPropIds.PARASITES:
        try {
          let parasites = out.parasites = new Array();

          for (let i = 0; i < pdv.byteLength;) {
            let nameLength = pdv.getUint32(i);
            i += 4;
            let name = "";

            if (nameLength > 1) {
              let strData = pdv.buffer.slice(i, i + nameLength - 1);
              i += nameLength;
              name = this.textDecoder.decode(strData); // i++; //trailing null
            }

            let flags = pdv.getUint32(i);
            i += 4;
            let pplength = pdv.getUint32(i);
            i += 4;
            parasites.push({
              name,
              flags,
              length: pplength,
              payload: pdv.buffer.slice(i, i + pplength)
            });
            i += pplength;
          }
        } catch (ex) {
          console.warn(ex); //we can safely skip issues here since
          //we still have the right offset in the data
        }

        break;

      case KnownPropIds.TATTOO:
        out.tattoo = pdv.getUint32(0);
        break;

      case KnownPropIds.VISIBLE:
        out.visible = pdv.getUint32(0) === 1;
        break;

      case KnownPropIds.ITEM_SET_ITEM:
        out.setId = pdv.getUint32(0);
        break;

      default:
        //TODO - handle unknown types
        // console.warn("unknown property type", out.type);
        break;
    }

    return true;
  }

  readArrayBuffer(ab) {
    this.init(ab);
    let vStr = this.version();
    let v = vStr.substring(9);
    let nv = v === "file" ? 0 : parseFloat(v.substring(1));
    let result = {
      version: v,
      versionAsNumber: nv,
      width: this.word(false),
      height: this.word(false),
      base_type: this.word(false),
      precision: nv > 3 ? this.word(false) : GimpPrecision["8-bit_gamma_integer"],
      properties: new Array(),
      layers: new Array()
    };
    let prop = {
      type: undefined,
      length: undefined
    };

    while (this.property(prop)) {
      let unique = {
        type: undefined,
        length: undefined
      };
      Object.assign(unique, prop);
      result.properties.push(unique);

      if (prop.type === KnownPropIds.PARASITES) {
        let parasitesProp = prop;

        for (let parasite of parasitesProp.parasites) {
          if (parasite.name.toLowerCase().startsWith("gimp")) {
            let parasiteData = this.textDecoder.decode(parasite.payload);
            console.log(`${parasite.name} : "${parasiteData}"`);
          }
        }
      }
    }

    let ptr = 0;
    let layerPointers = new Array();

    while ((ptr = this.pointer(nv)) != 0) {
      layerPointers.push(ptr);

      if (ptr > this.view.byteLength) {
        console.log("gtr than allowed");
      }
    }

    let channelPointers = new Array();

    while ((ptr = this.pointer(nv)) != 0) {
      channelPointers.push(ptr);

      if (ptr > this.view.byteLength) {
        console.log("gtr than allowed");
      }
    }

    this.push();

    for (let lptr of layerPointers) {
      let lptrn = new Number(lptr);
      this.jump(lptrn);
      let layer = {
        width: this.word(false),
        height: this.word(false),
        type: this.word(false),
        name: this.string(),
        properties: new Array(),
        hptr: undefined,
        mptr: undefined
      };

      while (this.property(prop)) {
        let unique = {
          type: undefined,
          length: undefined
        };
        Object.assign(unique, prop);
        layer.properties.push(unique);
      }

      layer.hptr = this.pointer(nv);
      layer.mptr = this.pointer(nv); // console.log("Layer", layer);

      result.layers.push(layer);
    }

    this.pop();
    return result;
  }

  read(url) {
    var _this = this;

    return new Promise(async function (_resolve, _reject) {
      let r;
      let ab;

      try {
        r = await fetch(url);
      } catch (ex) {
        _reject(ex);

        return;
      }

      try {
        ab = await r.arrayBuffer();
      } catch (ex) {
        _reject(ex);

        return;
      }

      let result = _this.readArrayBuffer(ab);

      _resolve(result);
    });
  }

}