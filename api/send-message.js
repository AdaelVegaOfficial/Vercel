// api/send-message.js
// Esta función corre en el servidor de Vercel, NUNCA en el navegador.
// Por eso aquí sí es seguro usar el token del bot.

export default async function handler(req, res) {
  // Solo aceptamos peticiones POST (las que manda el formulario)
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { name, email, message } = req.body || {};

    // Validación mínima en el servidor (nunca confíes solo en el frontend)
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' });
    }

    // Estas dos variables se configuran en Vercel, NO se escriben aquí
    const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TOKEN || !CHAT_ID) {
      console.error('Faltan variables de entorno TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID');
      return res.status(500).json({ ok: false, error: 'Configuración del servidor incompleta' });
    }

    const text =
      `📩 *Nuevo mensaje desde el portfolio*\n\n` +
      `*Nombre:* ${escapeMarkdown(name)}\n` +
      `*Email:* ${escapeMarkdown(email)}\n` +
      `*Mensaje:*\n${escapeMarkdown(message)}`;

    const telegramUrl = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    const tgResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown'
      })
    });

    const tgData = await tgResponse.json();

    if (!tgData.ok) {
      console.error('Error de Telegram:', tgData);
      return res.status(502).json({ ok: false, error: 'No se pudo enviar el mensaje' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en send-message:', err);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}

// Evita que caracteres especiales rompan el formato Markdown de Telegram
function escapeMarkdown(str) {
  return String(str).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
