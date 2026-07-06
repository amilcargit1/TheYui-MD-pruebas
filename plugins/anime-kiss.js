export default {
  command: ["kiss", "beso"],
  category: "Anime",
  description: "Envía un beso anime. Si respondes a alguien, le das un beso.",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    console.log("📌 Comando kiss ejecutado por", sender);

    let mencionado = null;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      if (mentions && mentions.length > 0) {
        mencionado = mentions[0];
        console.log("👤 Mencionado:", mencionado);
      }
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      mencionado = msg.message.extendedTextMessage.contextInfo.participant;
      console.log("👤 Respondiendo a:", mencionado);
    }

    const usuario = sender.split("@")[0];
    let texto = `@${usuario} te ha dado un beso 💋`;

    if (mencionado) {
      const mencionadoNum = mencionado.split("@")[0];
      texto = `@${usuario} le dio un beso a @${mencionadoNum} 💋`;
    }

    try {
      // Primero intentamos con waifu.pics
      let imageUrl = null;
      try {
        const response = await fetch("https://api.waifu.pics/sfw/kiss");
        const data = await response.json();
        imageUrl = data.url;
        console.log("✅ Imagen obtenida de waifu.pics:", imageUrl);
      } catch (e) {
        console.log("⚠️ Falló waifu.pics, intentando con nekos.life");
        // Fallback a nekos.life
        const response2 = await fetch("https://nekos.life/api/v2/img/kiss");
        const data2 = await response2.json();
        imageUrl = data2.url;
        console.log("✅ Imagen obtenida de nekos.life:", imageUrl);
      }

      if (!imageUrl) throw new Error("No se obtuvo imagen de ninguna API");

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
      console.error("❌ Error en comando kiss:", error);
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Ocurrió un error al obtener la imagen de beso. Intenta más tarde.",
        },
        { quoted: msg }
      );
    }
  },
};