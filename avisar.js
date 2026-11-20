require("dotenv").config({ quiet: true });

async function avisar(texto) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: texto,
    }),
  });
  if (!res.ok) console.error("Error al avisar:", await res.text());
}

module.exports = { avisar };

if (require.main === module) {
  avisar("✅ Prueba: el bot funciona");
}
