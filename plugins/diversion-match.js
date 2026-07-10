const FRASES = [
  "💕 ¡El amor está en el aire! Son almas gemelas.",
  "🌸 Una conexión especial, como el café y la lluvia.",
  "💖 ¡Wow! Esto es destino puro.",
  "🌹 Como las rosas y el atardecer, perfectos juntos.",
  "✨ La química es innegable, ¡fue un match divino!",
  "💞 ¡Parecen sacados de un anime de romance!",
  "🍀 Tienen una suerte increíble juntos.",
  "🌙 Bajo la misma luna, su compatibilidad es alta.",
  "💎 Una joya de relación, cuídala mucho.",
  "🎀 ¡Son el ship favorito del bot!",
  "🥰 Me derrito con tanta compatibilidad.",
  "💫 El universo conspiró para que se encuentren.",
  "🎵 Su amor suena como una canción de Yui.",
  "🌟 Brillan juntos como estrellas en el cielo.",
  "💌 El destino les tiene preparada una historia hermosa."
];

function obtenerFrase() {
  return FRASES[Math.floor(Math.random() * FRASES.length)];
}

function calcularCompatibilidad(nombre1, nombre2) {
  const base = (nombre1.length + nombre2.length) * 7;
  const aleatorio = Math.floor(Math.random() * 30);
  let porcentaje = (base + aleatorio) % 101;
  if (porcentaje < 20) porcentaje += 20;
  return porcentaje;
}

function obtenerEmoji(porcentaje) {
  if (porcentaje >= 90) return "💖";
  if (porcentaje >= 70) return "💕";
  if (porcentaje >= 50) return "🌸";
  if (porcentaje >= 30) return "🌿";
  return "🍂";
}

export default {
  command: ["match", "amor", "compatibilidad"],
  category: "Diversión",
  description: "Calcula la compatibilidad entre dos personas. Usa: match @usuario1 @usuario2",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;

    let mencionados = [];
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      mencionados = msg.message.extendedTextMessage.contextInfo.mentionedJid;
    }

    if (mencionados.length < 2) {
      await sock.sendMessage(
        chatId,
        {
          text: "🌸 Menciona a dos personas para calcular su compatibilidad.\nEjemplo: *match @usuario1 @usuario2*"
        },
        { quoted: msg }
      );
      return;
    }

    const persona1 = mencionados[0].split("@")[0];
    const persona2 = mencionados[1].split("@")[0];

    const porcentaje = calcularCompatibilidad(persona1, persona2);
    const emoji = obtenerEmoji(porcentaje);
    const frase = obtenerFrase();

    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  💞 *MATCH DE YUI* 💞\n`;
    texto += `  _Calculando el amor..._ 🦋\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    texto += `👤 @${persona1}  ${emoji}  @${persona2}\n\n`;
    texto += `💖 *${porcentaje}% de compatibilidad*\n\n`;
    texto += `${frase}\n\n`;

    texto += `🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 _El amor siempre encuentra su camino_ 🌹`;

    await sock.sendMessage(
      chatId,
      {
        text: texto,
        mentions: [mencionados[0], mencionados[1]]
      },
      { quoted: msg }
    );
  }
};