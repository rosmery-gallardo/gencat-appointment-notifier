require("dotenv").config({ quiet: true });

async function sacarChatId() {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getUpdates`;
  const res = await fetch(url);
  const datos = await res.json();

  if (!datos.ok) {
    console.log("Error de Telegram:", datos.description);
    return;
  }
  if (datos.result.length === 0) {
    console.log(
      'No hay mensajes. Escríbele "hola" a tu bot en Telegram y vuelve a ejecutar.'
    );
    return;
  }

  const ultimo = datos.result[datos.result.length - 1];
  console.log("Tu chat id es:", ultimo.message.chat.id);
}

sacarChatId();
