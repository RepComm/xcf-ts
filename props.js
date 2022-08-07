export let ColorTag;

(function (ColorTag) {
  ColorTag[ColorTag["None"] = 0] = "None";
  ColorTag[ColorTag["Blue"] = 1] = "Blue";
  ColorTag[ColorTag["Green"] = 2] = "Green";
  ColorTag[ColorTag["Yellow"] = 3] = "Yellow";
  ColorTag[ColorTag["Orange"] = 4] = "Orange";
  ColorTag[ColorTag["Brown"] = 5] = "Brown";
  ColorTag[ColorTag["Red"] = 6] = "Red";
  ColorTag[ColorTag["Violet"] = 7] = "Violet";
  ColorTag[ColorTag["Gray"] = 8] = "Gray";
})(ColorTag || (ColorTag = {}));

export let CompressionType;
/**PROP_COMPRESSION defines the encoding of pixels in tile data blocks in the
  entire XCF file. See chapter 7 for details.

  Note that unlike most other properties whose payload is always a
  small integer, PROP_COMPRESSION does _not_ pad the value to a full
  32-bit integer.

  Contemporary GIMP versions always write files with comp=1. It is unknown to
  the author of this document whether versions that wrote completely
  uncompressed (comp=0) files ever existed.*/

(function (CompressionType) {
  CompressionType[CompressionType["None"] = 0] = "None";
  CompressionType[CompressionType["RLE"] = 1] = "RLE";
  CompressionType[CompressionType["zlib"] = 2] = "zlib";
  CompressionType[CompressionType["Reserved"] = 3] = "Reserved";
})(CompressionType || (CompressionType = {}));

export let KnownPropIds;

(function (KnownPropIds) {
  KnownPropIds[KnownPropIds["END"] = 0] = "END";
  KnownPropIds[KnownPropIds["COLOR_TAG"] = 34] = "COLOR_TAG";
  KnownPropIds[KnownPropIds["FLOAT_OPACITY"] = 33] = "FLOAT_OPACITY";
  KnownPropIds[KnownPropIds["LINKED"] = 9] = "LINKED";
  KnownPropIds[KnownPropIds["LOCK_CONTENT"] = 28] = "LOCK_CONTENT";
  KnownPropIds[KnownPropIds["LOCK_POSITION"] = 32] = "LOCK_POSITION";
  KnownPropIds[KnownPropIds["LOCK_VISIBILITY"] = 42] = "LOCK_VISIBILITY";
  KnownPropIds[KnownPropIds["OPACITY"] = 6] = "OPACITY";
  KnownPropIds[KnownPropIds["PARASITES"] = 21] = "PARASITES";
  KnownPropIds[KnownPropIds["TATTOO"] = 20] = "TATTOO";
  KnownPropIds[KnownPropIds["VISIBLE"] = 8] = "VISIBLE";
  KnownPropIds[KnownPropIds["ITEM_SET_ITEM"] = 41] = "ITEM_SET_ITEM";
  KnownPropIds[KnownPropIds["COLOR_MAP"] = 1] = "COLOR_MAP";
  KnownPropIds[KnownPropIds["COMPRESSION"] = 17] = "COMPRESSION";
  KnownPropIds[KnownPropIds["GUIDES"] = 18] = "GUIDES";
})(KnownPropIds || (KnownPropIds = {}));