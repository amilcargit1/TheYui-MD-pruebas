import { obtenerEstadoUltimaCarga } from "../pluginLoader.js";

export default {
  command: ["plugins", "checarplugins"],
  category: "Owner",
  description: "Muestra el estado de los plugins cargados, inválidos y con error.",
  ownerOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId, allPlugins } = context;
    const { invalidos, errores } = obtenerEstadoUltimaCarga();

    const categorias = {};
    for (const p of allPlugins) {
      const cat = p.category || "Otros";
      categorias[cat] = (categorias[cat] || 0) + 1;
    }

    let texto = `📦 *Estado de los plugins*\n\n`;
    texto += `✅ ${allPlugins.length} plugin(s) cargado(s) correctamente\n\n`;

    for (const [cat, cantidad] of Object.entries(categorias).sort()) {
      texto += `   · ${cat}: ${cantidad}\n`;
    }

    if (invalidos.length > 0) {
      texto += `\n⚠️ ${invalidos.length} inválido(s) (sin command o run):\n`;
      for (const file of invalidos) {
        texto += `   · ${file}\n`;
      }
    }

    if (errores.length > 0) {
      texto += `\n❌ ${errores.length} con error al cargar:\n`;
      for (const { file, err } of errores) {
        texto += `   · ${file} → ${err.message || err}\n`;
      }
    }

    if (invalidos.length === 0 && errores.length === 0) {
      texto += `\n🎉 Sin errores ni plugins inválidos.`;
    }

    texto += `\n\n_Esta info es de la última vez que arrancó el bot. Si acabas de subir un plugin nuevo, reinicia el bot con *reiniciar* para que aparezca aquí._`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  },
};
