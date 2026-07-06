export default {
  command: ["cuddle", "acurrucar"],
  category: "Anime",
  description: "Envía una imagen de anime acurrucándose. Si respondes a alguien, te acurrucas con él/ella.",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    console.log("📌 Comando cuddle ejecutado por", sender);

    let mencionado = null;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      if (mentions && mentions.length > 0) {
        mencionado = mentions[0];
      }
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      mencionado = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const usuario = sender.split("@")[0];
    let texto = `@${usuario} se está acurrucando solo 🥺`;

    if (mencionado) {
      const mencionadoNum = mencionado.split("@")[0];
      texto = `@${usuario} se acurrucó con @${mencionadoNum} 🥰`;
    }

    try {
      let imageUrl = null;
      try {
        const response = await fetch("https://api.waifu.pics/sfw/cuddle");
        const data = await response.json();
        imageUrl = data.url;
      } catch (e) {
        const response2 = await fetch("https://nekos.life/api/v2/img/cuddle");
        const data2 = await response2.json();
        imageUrl = data2.url;
      }

      if (!imageUrl) throw new Error("No se obtuvo imagen");

      const mentions = [sender];
      if (mencionado) mentions.push(mencionado);

      await sock.sendMessage(
        chatId,
        {
          image: { url: imageUrl },
          caption: texto,
          mentions: mentions,
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error("❌ Error en comando cuddle:", error);
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Ocurrió un error al obtener la imagen de acurrucarse. Intenta más tarde.",
        },
        { quoted: msg }
      );
    }
  },
};