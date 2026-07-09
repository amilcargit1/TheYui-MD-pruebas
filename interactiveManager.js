const manejadores = new Map();

export function registrarManejador(prefijo, callback) {
  manejadores.set(prefijo, callback);
}

export function extraerRowId(msg) {
  return (
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.templateButtonReplyMessage?.selectedId ||
    null
  );
}

export async function manejarRespuestaInteractiva(sock, msg, context) {
  const rowId = extraerRowId(msg);
  if (!rowId) return false;

  const prefijo = rowId.split(":")[0];
  const manejador = manejadores.get(prefijo);
  if (!manejador) return false;

  await manejador(sock, msg, context, rowId);
  return true;
}
