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
export class XCFReader {
  constructor() {
    this.textDecoder = new TextDecoder();
  }

  init(ab) {
    this.view = new DataView(ab);
    this.offset = 0;
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
    this.offset += 4;
    return result;
  }

  pointer(xcfVersion) {
    if (xcfVersion < 11) {
      return this.word();
    } else {
      return this.word64();
    }
  }

  bytes(count) {
    let result = this.view.buffer.slice(this.offset, this.offset + count);
    this.offset += count;
    return result;
  }

  string(raw = false, count, rawTrailingNull = false) {
    let size = (raw ? count : this.word()) || 0;
    if (size < 1) return "";
    let strData = this.bytes(size);
    let result = this.textDecoder.decode(strData);

    if (!raw || rawTrailingNull) {
      this.offset += 1; //trailing null byte
    }

    return result;
  }

  version() {
    return this.string(true, 13, true);
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
              name = this.textDecoder.decode(strData);
              i++; //trailing null
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
        console.warn("unknown property type", out.type);
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
      properties: new Array()
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
          console.log("parasite", parasite.name);

          if (parasite.name.toLowerCase() === "gimp-comment") {
            let gimpComment = this.textDecoder.decode(parasite.payload);
            console.log("gimp comment", gimpComment);
          }
        }
      }
    }

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