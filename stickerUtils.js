import sharp from "sharp";
import webp from "node-webpmux";

export const PACK_DEFAULT = "𝚃𝙷𝙴𝚈𝚄𝙸🦋";
export const AUTOR_DEFAULT = "© AmilcarGit 2026";

export async function imagenABufferWebp(buffer) {
  return await sharp(buffer)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function agregarMetadataSticker(
  webpBuffer,
  packName = PACK_DEFAULT,
  authorName = AUTOR_DEFAULT
) {
  const img = new webp.Image();

  const json = {
    "sticker-pack-id": `thekael-yui-md-${Date.now()}`,
    "sticker-pack-name": packName,
    "sticker-pack-publisher": authorName,
    emojis: ["🦋"],
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);

  await img.load(webpBuffer);
  img.exif = exif;

  return await img.save(null);
}

/**
 * Convierte un buffer de imagen en un sticker .webp con metadata de pack/autor.
 * Si falla la metadata, devuelve el webp normal (el sticker igual se manda).
 */
export async function convertirImagenASticker(buffer, packName, authorName) {
  const webpBuffer = await imagenABufferWebp(buffer);

  try {
    return await agregarMetadataSticker(webpBuffer, packName, authorName);
  } catch (err) {
    console.log("No se pudo agregar metadata al sticker:", err);
    return webpBuffer;
  }
}
