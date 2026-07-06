import baileysPkg from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { config } from "./config.js";
import { pasaFiltros, esAdminDeGrupo } from "./middlewares.js";
import { obtenerConfigGrupo } from "./groupSettings.js";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = baileysPkg;

const CARPETA_SUBBOTS = "./subbots";

// Los subbots comparten la misma lista de plugins que el bot principal.
// index.js llama a setPlugins(plugins) una vez los carga al arrancar.
let pluginsCompartidos = [];
export function setPlugins(plugins) {
  pluginsCompartidos = plugins;
}

// numero -> { sock, sessionFolder, conectado, numero }
const subbotsActivos = new Map();

function limpiarNumero(numero) {
  return String(numero || "").replace(/\D/g, "");
}

export function listarSubbots() {
  return Array.from(subbotsActivos.values()).map((s) => ({
    numero: s.numero,
    conectado: s.conectado,
  }));
}

export function existeSubbot(numero) {
  return subbotsActivos.has(limpiarNumero(numero));
}

export async function eliminarSubbot(numero) {
  const numeroLimpio = limpiarNumero(numero);
  const info = subbotsActivos.get(numeroLimpio);
  if (!info) return false;

  try {
    await info.sock?.logout?.();
  } catch (_) {}
  try {
    info.sock?.end?.(undefined);
  } catch (_) {}

  subbotsActivos.delete(numeroLimpio);

  try {
    fs.rmSync(info.sessionFolder, { recursive: true, force: true });
  } catch (_) {}

  return true;
}

/**
 * Crea (o reconecta) un subbot para el número indicado.
 * onPairingCode(code) se llama cuando WhatsApp entrega el código de 8 dígitos.
 * onEstado(texto) se llama con actualizaciones de estado legibles para el usuario.
 */
export async function crearSubbot(numeroDestino, { onPairingCode, onEstado } = {}) {
  const numeroLimpio = limpiarNumero(numeroDestino);

  if (!numeroLimpio || numeroLimpio.length < 8) {
    throw new Error("Número inválido. Escríbelo con código de país, sin + ni espacios.");
  }

  if (subbotsActivos.has(numeroLimpio)) {
    throw new Error("Ya hay un subbot activo o conectándose con ese número.");
  }

  const sessionFolder = path.join(CARPETA_SUBBOTS, numeroLimpio);
  if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true });
  }

  const registro = { sock: null, sessionFolder, conectado: false, numero: numeroLimpio };
  subbotsActivos.set(numeroLimpio, registro);

  await iniciarSocketSubbot(numeroLimpio, sessionFolder, registro, { onPairingCode, onEstado });

  return registro;
}

async function iniciarSocketSubbot(numeroLimpio, sessionFolder, registro, { onPairingCode, onEstado }) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const usePairingCode = !fs.existsSync(`${sessionFolder}/creds.json`);

  const groupMetadataCache = new Map();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    logger: pino({ level: "silent" }),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 90000,
    keepAliveIntervalMs: 25000,
    cachedGroupMetadata: async (jid) => groupMetadataCache.get(jid),
  });

  registro.sock = sock;

  async function actualizarCacheGrupo(chatId) {
    try {
      const metadata = await sock.groupMetadata(chatId);
      groupMetadataCache.set(chatId, metadata);
      return metadata;
    } catch (_) {
      return null;
    }
  }

  sock.ev.on("groups.update", async ([event]) => {
    if (event?.id) await actualizarCacheGrupo(event.id);
  });

  if (usePairingCode) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(numeroLimpio);
        console.log(
          chalk.greenBright(`\n✅ [Subbot ${numeroLimpio}] Código de vinculación: `) +
            chalk.bold.white(code)
        );
        if (onPairingCode) onPairingCode(code);
      } catch (err) {
        console.log(chalk.red(`❌ [Subbot ${numeroLimpio}] Error pidiendo el código:`), err);
        if (onEstado) onEstado(`❌ No se pudo generar el código de vinculación. Intenta de nuevo.`);
        subbotsActivos.delete(numeroLimpio);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      registro.conectado = false;

      if (shouldReconnect) {
        console.log(chalk.yellow(`⚠️  [Subbot ${numeroLimpio}] Conexión cerrada, reconectando...`));
        iniciarSocketSubbot(numeroLimpio, sessionFolder, registro, { onPairingCode, onEstado });
      } else {
        console.log(chalk.red(`⚠️  [Subbot ${numeroLimpio}] Sesión cerrada (logout).`));
        if (onEstado) onEstado(`⚠️ El subbot @${numeroLimpio} cerró sesión desde el teléfono.`);
        subbotsActivos.delete(numeroLimpio);
      }
    } else if (connection === "open") {
      registro.conectado = true;
      console.log(chalk.greenBright(`\n👑 [Subbot ${numeroLimpio}] Conectado correctamente.\n`));
      if (onEstado) onEstado(`✅ Subbot @${numeroLimpio} conectado y listo para usarse.`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("group-participants.update", async (update) => {
    const { id: chatId, participants, action } = update;

    try {
      const configGrupo = obtenerConfigGrupo(chatId);
      const metadata = await actualizarCacheGrupo(chatId);
      if (!metadata) return;
      if (!configGrupo.welcome) return;

      const nombreGrupo = metadata.subject;

      for (const participante of participants) {
        const numero = participante.split("@")[0].split(":")[0];

        if (action === "add") {
          await sock.sendMessage(chatId, {
            text: `⭐ ¡Bienvenido/a @${numero} a *${nombreGrupo}*!`,
            mentions: [participante],
          });
        } else if (action === "remove") {
          await sock.sendMessage(chatId, {
            text: `👋 @${numero} salió de *${nombreGrupo}*. ¡Hasta pronto!`,
            mentions: [participante],
          });
        }
      }
    } catch (_) {}
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    if (!body) return;

    const esGrupo = chatId.endsWith("@g.us");
    const contieneLink = /(https?:\/\/|chat\.whatsapp\.com|wa\.me\/|www\.)/i.test(body);

    if (esGrupo && contieneLink) {
      const configGrupo = obtenerConfigGrupo(chatId);

      if (configGrupo.antilink) {
        const numeroLimpioSender = sender.split("@")[0].split(":")[0];
        const esDueño = numeroLimpioSender === config.ownerNumber;
        let esAdmin = false;

        if (!esDueño) {
          try {
            esAdmin = await esAdminDeGrupo(sock, chatId, sender);
          } catch (_) {}
        }

        if (!esDueño && !esAdmin) {
          try {
            await sock.sendMessage(chatId, { delete: msg.key });
          } catch (_) {}

          await sock.sendMessage(chatId, {
            text: `🚫 @${numeroLimpioSender} no se permiten enlaces en este grupo.`,
            mentions: [sender],
          });

          return;
        }
      }
    }

    const textoLower = body.trim().toLowerCase();
    const primeraPalabra = textoLower.split(/\s+/)[0];
    const args = body.trim().split(/\s+/).slice(1);

    const context = { sender, chatId, body, allPlugins: pluginsCompartidos };

    const configGrupoActual = esGrupo ? obtenerConfigGrupo(chatId) : null;
    const botApagadoEnGrupo = esGrupo && configGrupoActual && configGrupoActual.activo === false;

    for (const plugin of pluginsCompartidos) {
      if (plugin.command.includes(primeraPalabra)) {
        if (botApagadoEnGrupo && !plugin.bypassApagado) break;

        try {
          const puedeContinuar = await pasaFiltros(sock, msg, plugin, context);
          if (!puedeContinuar) break;

          await plugin.run(sock, msg, args, context);
        } catch (err) {
          console.log(chalk.red(`❌ [Subbot ${numeroLimpio}] Error en plugin:`), err);
        }
        break;
      }
    }
  });
}
