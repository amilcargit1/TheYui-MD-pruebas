import { resolverParticipante } from "../middlewares.js";

export default {
  command: ["promote", "ascender"],
  category: "Grupo",
  description: "Asciende a un miembro a administrador.",
  groupOnly: true,
  adminOnly: true,
  requiereBotAdmin: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    let numero = "";

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      numero = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      numero = msg.message.extendedTextMessage.contextInfo.participant
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
    } else if (args[0]) {
      numero = args[0].replace(/\D/g, "");
    }

    if (!numero) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❀ Menciona, responde un mensaje o escribe el número del usuario.",
        },
        { quoted: msg }
      );
    }

    const participante = await resolverParticipante(sock, chatId, numero);

    if (!participante) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❌ Ese usuario no pertenece al grupo.",
        },
        { quoted: msg }
      );
    }

    if (participante.admin) {
      return await sock.sendMessage(
        chatId,
        {
          text: "⚠️ Ese usuario ya es administrador.",
        },
        { quoted: msg }
      );
    }

    try {
      await sock.groupParticipantsUpdate(
        chatId,
        [participante.id], // Puede ser @lid o @s.whatsapp.net
        "promote"
      );

      await sock.sendMessage(
        chatId,
        {
          text: `✅ @${numero} ahora es administrador.`,
          mentions: [participante.id],
        },
        { quoted: msg }
      );
    } catch (e) {
      console.log(e);

      await sock.sendMessage(
        chatId,
        {
          text: "❌ No pude ascender al usuario.",
        },
        { quoted: msg }
      );
    }
  },
};