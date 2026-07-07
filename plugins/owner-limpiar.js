import {
  limpiarTemporales,
  obtenerUsoMemoria,
  formatearBytes,
} from "../limpieza.js";

export default {
  command: ["limpiar", "clean", "limpieza"],
  category: "Owner",
  description: "Limpia archivos temporales y libera memoria del bot.",
  ownerOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    const memoriaAntes = obtenerUsoMemoria();
    const { archivosEliminados, bytesLiberados } = limpiarTemporales();
    const memoriaDespues = obtenerUsoMemoria();

    let texto = `╭─「 🧹 *LIMPIEZA* 」\n`;
    texto += `│ 🗑️ Archivos eliminados: ${archivosEliminados}\n`;
    texto += `│ 💾 Espacio liberado: ${formatearBytes(bytesLiberados)}\n`;
    texto += `│ 📊 Memoria antes: ${memoriaAntes.rssMB} MB\n`;
    texto += `│ 📊 Memoria después: ${memoriaDespues.rssMB} MB\n`;
    texto += `╰────────────────\n`;
    texto += `💕 ¡Ya me siento más ligera!`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  },
};
