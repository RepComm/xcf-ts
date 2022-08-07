
export enum ColorTag {
  None,
  Blue,
  Green,
  Yellow,
  Orange,
  Brown,
  Red,
  Violet,
  Gray
}

export interface PropertyBase {
  /**uint32*/
  type: number;
  /**uint32*/
  length: number;
  payload?: any;
}

/**PROP_COLOR_TAG can be assigned to layers, channels and paths. They are
 * only organisational properties and have no consequence on render*/
export interface PROP_COLOR_TAG extends PropertyBase {
  type: 34;
  /**uint32*/
  tag: ColorTag;
}

/**The PROP_END pseudo-property marks the end of any property list.*/
export interface PROP_END extends PropertyBase {
  type: 0;
  length: 0;
}

/**PROP_FLOAT_OPACITY records the overall opacity setting for the layer
  or channel. Since GIMP 2.10.0, it always appears in the property list
  of layers and channels after PROP_OPACITY, which saves the same value,
  yet with integer precision. This way, new readers can overwrite the
  8-bit value with proper precision whereas older readers can simply
  skip PROP_FLOAT_OPACITY if unknown.*/
export interface PROP_FLOAT_OPACITY extends PropertyBase {
  type: 33;
  /**float*/
  opacity: number;
}

/**
 * @depreciated
 * PROP_LINKED controls the behavior of Transform tools with a layer,
  channel or path. If a Transform tool is used to transform one of them
  all other linked elements will be transformed the same way.
  It appears in the property list for layers, channels and paths.

  PROP_LINKED property is deprecated and must not be used since XCF
  version 16. XCF readers and writers are expected to convert linked
  items into item sets instead (see PROP_ITEM_SET).
  */
export interface PROP_LINKED extends PropertyBase {
  type: 9;
  length: 4;
  /**uint32*/
  linked: boolean;
}

/**PROP_LOCK_CONTENT specifies whether the layer, channel or path is locked,
  i.e. cannot be edited.*/
export interface PROP_LOCK_CONTENT extends PropertyBase {
  type: 28;
  length: 4;
  /**uint32*/
  locked: boolean;
}

/**PROP_LOCK_POSITION specifies whether the layer, channel or path's
  position is locked, i.e. cannot be transformed (translation, etc.).

  Up to XCF 16, this could not be set on layer groups. It is possible
  since XCF 17.*/
export interface PROP_LOCK_POSITION extends PropertyBase {
  type: 32;
  length: 4;
  /**uint32*/
  locked: boolean;
}

/**PROP_LOCK_VISIBILITY prevents the visibility to be switched (either
  explicitly for the item or when using features changing visibility to
  a range of items).*/
export interface PROP_LOCK_VISIBILITY extends PropertyBase {
  type: 42;
  length: 4;
  /**uint32*/
  locked: boolean;
}

/**PROP_OPACITY records the overall opacity setting for the layer or channel.
  It appears in the property list of layers and channels.

  Note that though GIMP's user interface displays the opacity as a percentage,
  it is actually stored on a 0-255 scale. Also note that this opacity value
  is stored as a 32-bit quantity even though it has been scaled to
  fit exactly in a single byte.

  When reading old XCF files that lack this property, full opacity
  should be assumed.

  While this property continues to be stored for compatibility, the new
  property PROP_FLOAT_OPACITY since GIMP 2.10.0 must override the value
  of PROP_OPACITY with float precision.*/
export interface PROP_OPACITY extends PropertyBase {
  type: 6;
  length: 4;
  /**uint32*/
  opacity: number;
}

export interface ParasiteDef {
  name: string;
  /**uint32*/
  flags: number;
  /**uint32 - length of parasite payload bytes*/
  length: number;
  /**parasite-specific payload*/
  payload: ArrayBuffer;
}

/**PROP_PARASITES stores parasites. It can contain multiple parasite records.
  See "Basic concepts" and the file parasites.txt for more information about
  parasites.
  This property can appear in any property list.*/
export interface PROP_PARASITES extends PropertyBase {
  type: 21;
  /**uint32 - total length of parasite(s) bytes to follow*/
  length: number;
  parasites: Array<ParasiteDef>;
}

/** PROP_TATTOO is an unique identifier for the denoted image, channel or layer.
  It appears in the property list of layers, channels, and the image.*/
export interface PROP_TATTOO extends PropertyBase {
  type: 20;
  length: 4;
  /**uint32 - nonzero unsigned integer id*/
  tattoo: number;
}

/** PROP_VISIBLE specifies the visibility of a layer or channel.
  It appears in the property list for layers and channels.
  For the visibility of a path see the PROP_VECTORS property.

  When reading old XCF files that lack this property, assume that
  layers are visible and channels are not.*/
export interface PROP_VISIBLE extends PropertyBase {
  type: 8;
  length: 4;
  /**uint32*/
  visible: boolean;
}

/**PROP_ITEM_SET_ITEM can be assigned to layers, channels and paths. They are
  only organisational properties and have no consequence on render.

  The 'set' attribute corresponds to the numbered PROP_ITEM_SET this
  item belongs to, considering that the appearance order of
  PROP_ITEM_SET properties matter. It can only belong to a named item
  set and all items in a set must be of the proper type.*/
export interface PROP_ITEM_SET_ITEM extends PropertyBase {
  type: 41;
  length: 4;
  /**uint32*/
  setId: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**PROP_COLORMAP stores the color map.
  It appears in all indexed images.

  The property will be ignored if it is encountered in an RGB or grayscale
  image. The current GIMP will not write a color map with RGB or
  grayscale images, but some older ones occasionally did, and readers
  should be prepared to gracefully ignore it in those cases.

  Note that in contrast to the palette data model of, for example, the
  PNG format, an XCF color map does not contain alpha components, and
  there is no color map entry for "transparent"; the alpha channel of
  layers that have one is always represented separately.

  The structure here is that of since XCF version 1.  Comments in the
  GIMP source code indicate that XCF version 0 could not store indexed
  images in a sane way; contemporary GIMP versions will complain and
  reinterpret the pixel data as a grayscale image if they meet a
  version-0 indexed image.

  Beware that the payload length of the PROP_COLORMAP in particular
  cannot be trusted: some historic releases of GIMP erroneously
  wrote n+4 instead of 3*n+4 into the length word (but still actually
  followed it by 3*n+4 bytes of payload).*/
export interface PROP_COLOR_MAP extends PropertyBase {
  type: 1;
  /**supposed to be
    * ```
    * 3*colorCount+4
    * ````
    * evidently colorCount is most trust worthy
    */
  length: number;
  /**uint32*/
  colorCount: number;
  colors: Array<RGB>;
}

export enum CompressionType {
  None,
  RLE,
  zlib,
  Reserved
}

/**PROP_COMPRESSION defines the encoding of pixels in tile data blocks in the
  entire XCF file. See chapter 7 for details.

  Note that unlike most other properties whose payload is always a
  small integer, PROP_COMPRESSION does _not_ pad the value to a full
  32-bit integer.

  Contemporary GIMP versions always write files with comp=1. It is unknown to
  the author of this document whether versions that wrote completely
  uncompressed (comp=0) files ever existed.*/
export interface PROP_COMPRESSION extends PropertyBase {
  type: 17;
  length: 1;
  comp: CompressionType;
}


/**PROP_GUIDES stores the horizontal or vertical positions of guides.
 It appears if any guides have been defined.
 
 Some old XCF files define guides with negative coordinates; those
 should be ignored by readers for XCF < 15. Since XCF 15, off-canvas
 guides are possible, such as negative coordinates or bigger than the
 canvas width/height.*/
 export interface PROP_GUIDES extends PropertyBase {
   type: 18;
   /**
    * ```
    * 5*n
    */
   length: number;
   /**int32*/
   coord: number;
   /**byte - 1 = y, 2 = x*/
   orientation: number;
   
}

export interface Path {
  //TODO impl
}

export interface PROP_PATHS extends PropertyBase {
  type: 23;
  length: number;
  pathActiveIndex: number;
  pathCount: number;
  paths: Array<Path>;
}

export enum KnownPropIds {
  END = 0,
  COLOR_TAG = 34,
  FLOAT_OPACITY = 33,
  LINKED = 9,
  LOCK_CONTENT = 28,
  LOCK_POSITION = 32,
  LOCK_VISIBILITY = 42,
  OPACITY = 6,
  PARASITES = 21,
  TATTOO = 20,
  VISIBLE = 8,
  ITEM_SET_ITEM = 41,

  COLOR_MAP = 1,
  COMPRESSION = 17,
  GUIDES = 18,


}
