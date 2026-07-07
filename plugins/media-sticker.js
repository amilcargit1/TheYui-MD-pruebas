import baileysPkg from "@whiskeysockets/baileys";
import sharp from "sharp";

const { downloadMediaMessage } = baileysPkg;

export default {
  command: ["sticker", "s", "stiker"],
  category: "Media",
  description:
    "Convierte una imagen en sticker. Responde a una imagen con *sticker*, o envía la imagen con ese texto en el mensaje.",

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mensajeCitado = contextInfo?.quotedMessage;

    let mensajeObjetivo = msg;

    if (mensajeCitado?.imageMessage) {
      mensajeObjetivo = {
        key: {
          remoteJid: chatId,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant,
        },
        message: mensajeCitado,
      };
    }

    const tieneImagen = Boolean(mensajeObjetivo.message?.imageMessage);
    const tieneVideoOGif = Boolean(
      mensajeObjetivo.message?.videoMessage ||
        mensajeCitado?.videoMessage
    );

    if (!tieneImagen && !tieneVideoOGif) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "💕 Responde a una imagen con *sticker* (o envíala junto con ese texto) para convertirla.",
        },
        { quoted: msg }
      );
    }

    if (tieneVideoOGif) {
      return await sock.sendMessage(
        chatId,
        {
          text: "⚠️ Por ahora solo puedo convertir *imágenes* a sticker, los videos/GIFs aún no.",
        },
        { quoted: msg }
      );
    }

    try {
      const buffer = await downloadMediaMessage(mensajeObjetivo, "buffer", {});

      const webpBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 80 })
        .toBuffer();

      await sock.sendMessage(
        chatId,
        { sticker: webpBuffer },
        { quoted: msg }
      );
    } catch (err) {
      console.log(err);
      await sock.sendMessage(
        chatId,
        { text: "❌ No pude convertir la imagen a sticker. Intenta con otra imagen." },
        { quoted: msg }
      );
    }
  },
};
