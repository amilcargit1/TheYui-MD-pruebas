import { config } from "../config.js";
import { descargarPorResultado } from "./descargas-tiktok.js";

const { baseUrl, apiKey } = config.apis.edward;
const CANTIDAD_A_DESCARGAR = 3;

export default {
  command: ["tiktoksearch", "ttsearch"],
  category: "Descargas",
  description: "Busca en TikTok y descarga automáticamente los primeros 3 videos (costo: 15 Yui c/u). Uso: tiktoksearch <búsqueda>",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    const query = args.join(" ").trim();

    if (!query) {
      await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe lo que quieres buscar en TikTok.\nEjemplo: *tiktoksearch* baile" },
        { quoted: msg }
      );
      return;
    }

    try {
      await sock.sendMessage(
        chatId,
        { text: `🔎 Buscando *${query}* en TikTok...` },
        { quoted: msg }
      );

      const searchUrl = `${baseUrl}/api/search/tiktok?apiKey=${apiKey}&query=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      let resultados = searchData.result || searchData.data || searchData.results || [];
      if (!Array.isArray(resultados)) {
        resultados = resultados ? [resultados] : [];
      }
      resultados = resultados.slice(0, CANTIDAD_A_DESCARGAR);

      if (resultados.length === 0) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No encontré videos para esa búsqueda." },
          { quoted: msg }
        );
        return;
      }

      await sock.sendMessage(
        chatId,
        {
          text: `🌸 Encontré resultados para *${query}*, descargando los primeros ${resultados.length}...\n💵 Se te cobrarán 15 Yui por cada video.`,
        },
        { quoted: msg }
      );

      for (const video of resultados) {
        await descargarPorResultado(sock, chatId, msg, video, sender);
      }
    } catch (err) {
      console.error("❌ Error en tiktoksearch:", err);
      await sock.sendMessage(
        chatId,
        { text: "❌ Ocurrió un error buscando en TikTok." },
        { quoted: msg }
      );
    }
  },
};
