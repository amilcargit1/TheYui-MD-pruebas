import { config } from "../config.js";

const { baseUrl, apiKey } = config.apis.edward;

function esUrlPinterest(texto) {
  const pattern = /^(https?:\/\/)?(www\.)?(pinterest\.[a-z.]+|pin\.it)\/.+/i;
  return pattern.test(texto);
}

function obtenerImagenDeResultado(item) {
  return (
    item.image ||
    item.image_url ||
    item.imageUrl ||
    item.thumbnail ||
    item.url ||
    null
  );
}

export default {
  command: ["pinterest", "pin"],
  category: "Descargas",
  description: "Busca o descarga imágenes de Pinterest. Uso: pinterest <búsqueda> / pinterest <número> / pinterest <link>",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const arg = args.join(" ").trim();

    if (!arg) {
      await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe lo que quieres buscar o pega un enlace de Pinterest.\nEjemplo: *pinterest* fondos anime  o  *pinterest* https://pin.it/..." },
        { quoted: msg }
      );
      return;
    }

    if (!global.pinterestCache) global.pinterestCache = new Map();

    if (esUrlPinterest(arg)) {
      await descargarPinterest(sock, chatId, msg, arg);
      return;
    }

    const numero = parseInt(arg);
    if (!isNaN(numero) && numero > 0) {
      const resultados = global.pinterestCache.get(chatId);
      if (!resultados || resultados.length === 0) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No hay resultados de búsqueda previos. Usa *pinterest <búsqueda>* primero." },
          { quoted: msg }
        );
        return;
      }
      const index = numero - 1;
      if (index >= resultados.length) {
        await sock.sendMessage(
          chatId,
          { text: `❌ Solo hay ${resultados.length} resultado(s). Elige un número entre 1 y ${resultados.length}.` },
          { quoted: msg }
        );
        return;
      }
      await enviarImagenSeleccionada(sock, chatId, msg, resultados[index]);
      return;
    }

    await buscarPinterest(sock, chatId, msg, arg);
  },
};

async function buscarPinterest(sock, chatId, msg, query) {
  try {
    await sock.sendMessage(
      chatId,
      { text: `🔎 Buscando *${query}* en Pinterest...` },
      { quoted: msg }
    );

    const searchUrl = `${baseUrl}/api/search/pinterest?apiKey=${apiKey}&query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    let resultados = searchData.result || searchData.data || searchData.results || [];
    if (!Array.isArray(resultados)) {
      resultados = resultados ? [resultados] : [];
    }
    resultados = resultados.filter((item) => obtenerImagenDeResultado(item)).slice(0, 8);

    if (resultados.length === 0) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No encontré imágenes para esa búsqueda." },
        { quoted: msg }
      );
      return;
    }

    global.pinterestCache.set(chatId, resultados);

    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  📌 *RESULTADOS DE PINTEREST*\n`;
    texto += `  _${query}_\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    resultados.forEach((item, i) => {
      const titulo = item.title || item.description || `Resultado ${i + 1}`;
      texto += `${i + 1}. ${titulo.slice(0, 50)}\n`;
    });

    texto += `\n💕 Para ver una en alta calidad escribe: *pinterest <número>*\n`;
    texto += `🌹 Ejemplo: *pinterest 1*`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  } catch (err) {
    console.error("❌ Error en búsqueda Pinterest:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al buscar en Pinterest." },
      { quoted: msg }
    );
  }
}

async function enviarImagenSeleccionada(sock, chatId, msg, item) {
  const urlPin = item.url || item.pin_url || item.link;

  if (urlPin && esUrlPinterest(urlPin)) {
    await descargarPinterest(sock, chatId, msg, urlPin, item);
    return;
  }

  const imagen = obtenerImagenDeResultado(item);
  if (!imagen) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Ese resultado no tiene una imagen válida." },
      { quoted: msg }
    );
    return;
  }

  await enviarImagenDesdeUrl(sock, chatId, msg, imagen, item.title);
}

async function descargarPinterest(sock, chatId, msg, url, itemBusqueda) {
  try {
    await sock.sendMessage(
      chatId,
      { text: "📌 Descargando imagen de Pinterest..." },
      { quoted: msg }
    );

    const downloadUrl = `${baseUrl}/api/download/pinterest?apiKey=${apiKey}&url=${encodeURIComponent(url)}`;
    const downloadRes = await fetch(downloadUrl);
    const downloadData = await downloadRes.json().catch(() => null);

    const info = downloadData?.result || downloadData?.data;
    const imagenFinal =
      obtenerImagenDeResultado(info || {}) ||
      (itemBusqueda ? obtenerImagenDeResultado(itemBusqueda) : null);

    if (!imagenFinal) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No pude obtener esa imagen de Pinterest. Verifica el enlace." },
        { quoted: msg }
      );
      return;
    }

    const titulo = info?.title || itemBusqueda?.title || "Imagen de Pinterest";
    await enviarImagenDesdeUrl(sock, chatId, msg, imagenFinal, titulo);
  } catch (err) {
    console.error("❌ Error descargando Pinterest:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al descargar la imagen de Pinterest." },
      { quoted: msg }
    );
  }
}

async function enviarImagenDesdeUrl(sock, chatId, msg, imagenUrl, titulo) {
  const res = await fetch(imagenUrl);
  const tipoContenido = res.headers.get("content-type") || "";

  if (!res.ok || !tipoContenido.startsWith("image")) {
    await sock.sendMessage(
      chatId,
      { text: "❌ El servidor no devolvió una imagen válida." },
      { quoted: msg }
    );
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  await sock.sendMessage(
    chatId,
    {
      image: buffer,
      caption: `📌 *${(titulo || "Imagen de Pinterest").slice(0, 60)}*\n✨ TheYui-MD`,
    },
    { quoted: msg }
  );
}
