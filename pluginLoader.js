import fs from "fs";
import path from "path";
import url from "url";
import chalk from "chalk";
import { config } from "./config.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const pluginsPath = path.join(__dirname, "plugins");

/**
 * Carga todos los plugins de la carpeta /plugins de forma dinámica.
 * Cada plugin debe exportar por defecto un objeto:
 * {
 *   command: ["hola", "hi"],   // palabras clave que activan el plugin (sin prefijo)
 *   description: "texto",     // opcional, para un futuro menú
 *   run: async (sock, msg, args, context) => { ... }
 * }
 */
export async function loadPlugins() {
  const plugins = [];

  if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath, { recursive: true });
  }

  const files = fs
    .readdirSync(pluginsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of files) {
    try {
      const pluginUrl = url.pathToFileURL(path.join(pluginsPath, file)).href;
      // Cache-busting para poder recargar plugins en caliente si se desea en el futuro
      const module = await import(`${pluginUrl}?update=${Date.now()}`);
      const plugin = module.default;

      if (!plugin || !plugin.command || !plugin.run) {
        console.log(
          chalk.yellow(`⚠️  Plugin inválido, se omite: ${file}`)
        );
        continue;
      }

      plugin.fileName = file;
      plugins.push(plugin);
      console.log(
        chalk.green(`✅ Plugin cargado: `) + chalk.cyan(file)
      );
    } catch (err) {
      console.log(
        chalk.red(`❌ Error cargando el plugin ${file}:`), err
      );
    }
  }

  console.log(
    chalk.magenta(`\n📦 ${config.botName} cargó ${plugins.length} plugin(s).\n`)
  );

  return plugins;
}
