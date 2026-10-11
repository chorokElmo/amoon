import sharp from "sharp";
import { MAX_BRANDING_BYTES, type BrandingSlot } from "./branding-validation";

// Reconstruct a deliberately small SVG grammar before passing it to a decoder.
// No text, CSS, entities, namespaces, links, images, scripts or external resources.
export function sanitizeLogoSvg(input: Buffer): Buffer {
  let source = input.toString("utf8").trim().replace(/^<\?xml\s+version=["']1\.0["'](?:\s+encoding=["']UTF-8["'])?\s*\?>/i, "").trim();
  if (source.length > 256_000 || /[&\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(source)) throw new Error("SVG non pris en charge.");
  const tags = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "linearGradient", "radialGradient", "stop"]);
  const attributes = new Set(["id", "viewBox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points", "transform", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "fill-rule", "clip-rule", "opacity", "fill-opacity", "stroke-opacity", "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "spreadMethod"]);
  const stack: string[] = [];
  const output: string[] = [];
  let roots = 0, count = 0;
  while (source) {
    const token = /^<\s*(\/?)\s*([A-Za-z][A-Za-z0-9]*)\b([^<>]*?)\s*(\/?)>/.exec(source);
    if (!token || ++count > 3000) throw new Error("SVG non pris en charge.");
    const [, closing, name, rawAttributes, selfClosing] = token;
    if (!tags.has(name)) throw new Error("Élément SVG non autorisé.");
    if (closing) {
      if (rawAttributes.trim() || selfClosing || stack.pop() !== name) throw new Error("SVG mal formé.");
      output.push(`</${name}>`);
    } else {
      if (!stack.length && (name !== "svg" || roots++)) throw new Error("SVG mal formé.");
      if (name === "svg" && stack.length) throw new Error("SVG imbriqué non pris en charge.");
      let rest = rawAttributes;
      const seen = new Set<string>();
      const safe: string[] = [];
      while (rest.trim()) {
        const attribute = /^\s+([A-Za-z][A-Za-z0-9-]*)\s*=\s*(["'])(.*?)\2/s.exec(rest);
        if (!attribute) throw new Error("Attribut SVG mal formé.");
        const [, key, , value] = attribute;
        if (seen.has(key)) throw new Error("Attribut SVG dupliqué.");
        seen.add(key);
        if (key === "xmlns" && name === "svg" && value === "http://www.w3.org/2000/svg") { rest = rest.slice(attribute[0].length); continue; }
        if (!attributes.has(key) || !/^[A-Za-z0-9 .,+%#()_-]{0,20000}$/.test(value)) throw new Error("Attribut SVG non autorisé.");
        if (/url/i.test(value) && (!(["fill", "stroke"].includes(key)) || !/^url\(#[A-Za-z][A-Za-z0-9_-]*\)$/.test(value))) throw new Error("Référence SVG non autorisée.");
        safe.push(`${key}="${value}"`);
        rest = rest.slice(attribute[0].length);
      }
      output.push(`<${name}${name === "svg" ? ' xmlns="http://www.w3.org/2000/svg"' : ""}${safe.length ? " " + safe.join(" ") : ""}${selfClosing ? "/" : ""}>`);
      if (!selfClosing) stack.push(name);
    }
    source = source.slice(token[0].length).trimStart();
  }
  if (stack.length || roots !== 1) throw new Error("SVG mal formé.");
  return Buffer.from(output.join(""));
}

async function decodeIco(input: Buffer): Promise<Buffer> {
  if (input.length < 22 || input.readUInt16LE(0) !== 0 || input.readUInt16LE(2) !== 1) throw new Error("ICO invalide.");
  const count = input.readUInt16LE(4);
  if (!count || count > 20 || input.length < 6 + count * 16) throw new Error("ICO invalide.");
  const entries = Array.from({ length: count }, (_, index) => {
    const at = 6 + index * 16;
    const width = input[at] || 256, height = input[at + 1] || 256;
    const length = input.readUInt32LE(at + 8), offset = input.readUInt32LE(at + 12);
    if (width !== height || width < 16 || offset < 6 + count * 16 || !length || offset + length > input.length) throw new Error("ICO invalide.");
    return { width, height, bytes: input.subarray(offset, offset + length) };
  }).sort((a, b) => b.width - a.width);
  // Validate every frame; use the largest supported image for the public favicon.
  const decoded: Buffer[] = [];
  for (const { width, height, bytes } of entries) {
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      const decoder = sharp(bytes, { limitInputPixels: 512 * 512, failOn: "warning" });
      const meta = await decoder.metadata();
      if (meta.width !== width || meta.height !== height || (meta.pages ?? 1) !== 1) throw new Error("ICO invalide.");
      decoded.push(await decoder.png().toBuffer());
    } else {
      if (bytes.length < 40 || bytes.readUInt32LE(0) !== 40 || bytes.readInt32LE(4) !== width || bytes.readInt32LE(8) !== height * 2 || bytes.readUInt16LE(12) !== 1 || bytes.readUInt32LE(16) !== 0) throw new Error("ICO non pris en charge : PNG ou bitmap 24/32 bits requis.");
      const bits = bytes.readUInt16LE(14);
      if (![24, 32].includes(bits)) throw new Error("ICO non pris en charge : PNG ou bitmap 24/32 bits requis.");
      const stride = Math.ceil(width * bits / 32) * 4, maskStride = Math.ceil(width / 32) * 4;
      const maskAt = 40 + stride * height;
      if (bytes.length < maskAt + maskStride * height) throw new Error("ICO tronqué.");
      const rgba = Buffer.alloc(width * height * 4);
      let hasAlpha = false;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const at = 40 + (height - y - 1) * stride + x * (bits / 8), out = (y * width + x) * 4;
        rgba[out] = bytes[at + 2]; rgba[out + 1] = bytes[at + 1]; rgba[out + 2] = bytes[at]; rgba[out + 3] = bits === 32 ? bytes[at + 3] : 255;
        if (bits === 32 && rgba[out + 3]) hasAlpha = true;
      }
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const at = (y * width + x) * 4 + 3;
        if (bits === 32 && !hasAlpha) rgba[at] = 255;
        if (bytes[maskAt + (height - y - 1) * maskStride + (x >> 3)] & (128 >> (x % 8))) rgba[at] = 0;
      }
      decoded.push(await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer());
    }
  }
  return decoded[0];
}

export async function validateBrandingImage(content: string, mimeType: string, slot: BrandingSlot) {
  let input: Buffer = Buffer.from(content, "base64");
  const maximum = slot === "favicon" ? 1024 * 1024 : MAX_BRANDING_BYTES;
  if (!input.length || input.length > maximum) throw new Error("Fichier trop volumineux.");
  const ico = ["image/x-icon", "image/vnd.microsoft.icon"].includes(mimeType);
  if (slot === "favicon" && !ico && mimeType !== "image/png") throw new Error("Utilisez un PNG ou ICO pour le favicon.");
  if (slot !== "favicon" && (ico || !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(mimeType))) throw new Error("Format de logo non pris en charge.");
  if (mimeType === "image/svg+xml") input = sanitizeLogoSvg(input);
  if (ico) input = await decodeIco(input);
  const expected = ico ? "png" : { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp", "image/svg+xml": "svg" }[mimeType];
  const decoder = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });
  const metadata = await decoder.metadata();
  if (metadata.format !== expected || !metadata.width || !metadata.height || metadata.width > 4096 || metadata.height > 4096 || (metadata.pages ?? 1) > 1) throw new Error("Image invalide ou dimensions trop grandes.");
  if (slot === "favicon" && (metadata.width !== metadata.height || metadata.width < 16 || metadata.width > 512)) throw new Error("Le favicon doit être carré, de 16 à 512 pixels.");
  const { data, info } = await decoder.rotate().png().toBuffer({ resolveWithObject: true });
  if (data.length > MAX_BRANDING_BYTES) throw new Error("Image traitée trop volumineuse.");
  return { data, width: info.width, height: info.height, mime_type: "image/png", extension: "png" };
}
