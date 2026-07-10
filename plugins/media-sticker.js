import {
  iniciarSesionPack,
  obtenerSesionPack,
  finalizarSesionPack,
} from "../stickpackSessions.js";

export default {
  command: ["stickpack", "pack"],
  category: "Media",
  description:
    "Crea un pack de stickers. Uso: stickpack <nombre> — luego manda las imágenes que quieras convertir, una por una. Escribe stickpack fin para terminar.",

  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    const numero = sender.split("@")[0].split(":")[0];

    const primerArgumento = args[0]?.toLowerCase();

    if (primerArgumento === "fin" || primerArgumento === "terminar") {
      const sesion = finalizarSesionPack(chatId, numero);

      if (!sesion) {
        return await sock.sendMessage(
          chatId,
          { text: "💕 No tienes ningún pack en armado ahorita." },
          { quoted: msg }
        );
      }

      return await sock.sendMessage(
        chatId,
        {
          text:
            `╭─「 🦋 *PACK TERMINADO* 」\n` +
            `│ 📦 Nombre: ${sesion.packName}\n` +
            `│ 🖼️ Stickers creados: ${sesion.cantidad}\n` +
            `╰────────────────`,
        },
        { quoted: msg }
      );
    }

    const nombrePack = args.join(" ").trim();

    if (!nombrePack) {
      const sesionActual = obtenerSesionPack(chatId, numero);

      if (sesionActual) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `🦋 Ya estás armando el pack *${sesionActual.packName}* (${sesionActual.cantidad} sticker(s) hasta ahora).\n\n` +
              `Sigue mandando imágenes, o escribe *stickpack fin* para terminar.`,
          },
          { quoted: msg }
        );
      }

      return await sock.sendMessage(
        chatId,
        {
          text:
            `╭─「 🦋 *STICKPACK* 」\n` +
            `│ Uso: *stickpack <nombre del pack>*\n` +
            `│ Luego manda las imágenes que quieras,\n` +
            `│ una por una, y cada una sale como\n` +
            `│ sticker con ese nombre de pack.\n` +
            `│\n` +
            `│ Escribe *stickpack fin* para terminar.\n` +
            `│ (se cierra solo tras 5 min sin uso)\n` +
            `╰────────────────`,
        },
        { quoted: msg }
      );
    }

    iniciarSesionPack(chatId, numero, nombrePack, "© AmilcarGit 2026");

    await sock.sendMessage(
      chatId,
      {
        text:
          `╭─「 🦋 *MODO PACK ACTIVADO* 」\n` +
          `│ 📦 Nombre: ${nombrePack}\n` +
          `│\n` +
          `│ Manda las imágenes que quieras\n` +
          `│ convertir, una por una 💕\n` +
          `│\n` +
          `│ Escribe *stickpack fin* cuando termines.\n` +
          `╰────────────────`,
      },
      { quoted: msg }
    );
  },
};
