import { config } from "../config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { esOwner } from "../middlewares.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_IMAGE_PATH = path.join(__dirname, "..", "assets", "menu.jpg");

let imagenMenuCache = null;

async function obtenerImagenMenu() {
  if (imagenMenuCache) return imagenMenuCache;
  try {
    imagenMenuCache = fs.readFileSync(MENU_IMAGE_PATH);
    return imagenMenuCache;
  } catch (err) {
    return null;
  }
}

const ICONOS_CATEGORIA = {
  General: "🦋",
  Grupo: "👑",
  Descargas: "🌹",
  Anime: "💕",
  Owner: "💎",
  Info: "🎀",
  Otros: "✨",
  Diversión: "🎮",
  Utilidades: "🔧",
  Seguridad: "🛡️",
};

const ORDEN_CATEGORIAS = [
  "General",
  "Info",
  "Descargas",
  "Anime",
  "Diversión",
  "Grupo",
  "Seguridad",
  "Utilidades",
  "Otros",
  "Owner",
];

function formatearUptime(segundos) {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default {
  command: ["menu", "help", "ayuda"],
  category: "General",
  description: "Muestra el menú de comandos con estilo waifu.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId, allPlugins } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const esElDueño = esOwner(numero);

    // Ocultamos los comandos de Owner a quien no sea el dueño del bot,
    // para no exponer en el menú funciones sensibles a cualquier usuario.
    const pluginsVisibles = allPlugins.filter(
      (p) => !p.ownerOnly || esElDueño
    );

    const categorias = {};
    for (const plugin of pluginsVisibles) {
      const categoria = plugin.category || "Otros";
      if (!categorias[categoria]) categorias[categoria] = [];
      categorias[categoria].push(plugin);
    }

    // Ordenamos los comandos de cada categoría alfabéticamente
    for (const categoria of Object.keys(categorias)) {
      categorias[categoria].sort((a, b) =>
        a.command[0].localeCompare(b.command[0])
      );
    }

    const fecha = new Date().toLocaleString("es-PE", {
      timeZone: "America/Lima",
      dateStyle: "full",
      timeStyle: "short",
    });

    const totalComandos = pluginsVisibles.reduce(
      (acc, p) => acc + p.command.length,
      0
    );
    const uptime = formatearUptime(process.uptime());

    // Orden de categorías: primero las de ORDEN_CATEGORIAS (en ese orden),
    // luego cualquier categoría nueva que no esté en la lista, alfabética.
    const nombresCategorias = Object.keys(categorias).sort((a, b) => {
      const posA = ORDEN_CATEGORIAS.indexOf(a);
      const posB = ORDEN_CATEGORIAS.indexOf(b);
      if (posA === -1 && posB === -1) return a.localeCompare(b);
      if (posA === -1) return 1;
      if (posB === -1) return -1;
      return posA - posB;
    });

    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  ✨ *${config.botName.toUpperCase()}* ✨\n`;
    texto += `  _Tu waifu inteligente_ 💕\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    texto += `╭─🎀 *ESTADÍSTICAS* 🎀\n`;
    texto += `│ 👤 @${numero}\n`;
    texto += `│ 💎 ${config.creator}\n`;
    texto += `│ 💵 Yui  │ ⏱️ ${uptime}\n`;
    texto += `│ ⚡ ${totalComandos} cmd  │ 📦 ${pluginsVisibles.length} plugins\n`;
    texto += `│ 🕐 ${fecha}\n`;
    texto += `╰────────────────────╯\n\n`;

    texto += `🌹 *MIS COMANDOS* 🦋\n`;

    for (const categoria of nombresCategorias) {
      const icono = ICONOS_CATEGORIA[categoria] || "✨";
      texto += `\n╭─${icono} *${categoria}* ${icono}\n`;
      for (const plugin of categorias[categoria]) {
        const comandoPrincipal = plugin.command[0];
        const alias = plugin.command.slice(1).length > 0
          ? ` (${plugin.command.slice(1).join(", ")})`
          : "";
        texto += `│ ➤ *${comandoPrincipal}*${alias}\n`;
        texto += `│   ${plugin.description || "Sin descripción"}\n`;
      }
      texto += `╰────────────────────╯\n`;
    }

    texto += `\n🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 _Sin prefijo — escribe el comando directo_\n`;
    texto += `📚 _Bot hecho con fines educativos_\n`;
    texto += `🌹 *${config.botName}* — Leal · Rápida · Inteligente 🌹`;

    const imagen = await obtenerImagenMenu();
    if (imagen) {
      await sock.sendMessage(
        chatId,
        {
          image: imagen,
          caption: texto,
          mentions: [sender],
        },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: texto,
          mentions: [sender],
        },
        { quoted: msg }
      );
    }
  },
};