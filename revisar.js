require("dotenv").config({ quiet: true });
const fs = require("fs");
const { chromium, firefox } = require("playwright");
const { avisar } = require("./avisar");

const URL = process.env.CITA_URL;
const FICHERO = "ultima-fecha.txt";
const MINUTOS = 15;
const VER_NAVEGADOR = process.env.VER_NAVEGADOR === "true";
const NAVEGADORES = [
  { nombre: "Chromium", motor: chromium },
  { nombre: "Firefox", motor: firefox },
];

if (!URL) {
  console.error("Falta la variable CITA_URL en el archivo .env");
  process.exit(1);
}

// "01/03/2027" -> Date
function aFecha(texto) {
  const [dia, mes, anio] = texto.split("/").map(Number);
  return new Date(anio, mes - 1, dia);
}

async function buscarPrimeraFecha({ nombre, motor }) {
  const browser = await motor.launch({ headless: !VER_NAVEGADOR });
  try {
    const context = await browser.newContext({
      geolocation: { latitude: 41.5463, longitude: 2.1086 },
      permissions: ["geolocation"],
      locale: "ca-ES",
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

    // Espera a que salgan las horas del calendario (ej. "09:00 h.") o el error de la web
    const horas = page.getByText(/\d{2}:\d{2} h\./).first();
    const errorWeb = page.getByText("S'ha produït un error").first();
    const resultado = await Promise.race([
      horas.waitFor({ state: "visible", timeout: 90000 }).then(() => "ok"),
      errorWeb
        .waitFor({ state: "visible", timeout: 90000 })
        .then(() => "error"),
    ]).catch(() => "timeout");

    await page.screenshot({ path: "ultima-captura.png", fullPage: true });

    if (resultado === "error") {
      console.log(`${nombre}: la web ha devuelto un error.`);
      return null;
    }
    if (resultado === "timeout") {
      console.log(`${nombre}: el calendario no ha cargado en 90 segundos.`);
      return null;
    }
    await page.waitForTimeout(2000);

    // Valores de los campos + texto visible de la página y de sus iframes
    let texto = "";
    for (const frame of page.frames()) {
      texto +=
        " " +
        (await frame
          .evaluate(() => {
            const campos = [...document.querySelectorAll("input")]
              .map((c) => c.value)
              .join(" ");
            return campos + " " + document.body.innerText;
          })
          .catch(() => ""));
    }
    const encontradas = [
      ...new Set(texto.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) || []),
    ];
    console.log(`${nombre}: fechas encontradas en la página:`, encontradas);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const futuras = encontradas
      .filter((f) => aFecha(f) >= hoy)
      .sort((a, b) => aFecha(a) - aFecha(b));

    return futuras[0] || null;
  } catch (error) {
    console.log(`${nombre}: error al abrir la página:`, error.message);
    return null;
  } finally {
    await browser.close();
  }
}

async function revisar() {
  const hora = new Date().toLocaleTimeString("es-ES");
  try {
    let fecha = null;
    for (const navegador of NAVEGADORES) {
      fecha = await buscarPrimeraFecha(navegador);
      if (fecha) break;
    }

    if (!fecha) {
      console.log(
        `[${hora}] Sin fecha en esta revisión. Se reintentará en ${MINUTOS} minutos.`
      );
      return;
    }

    const anterior = fs.existsSync(FICHERO)
      ? fs.readFileSync(FICHERO, "utf8").trim()
      : null;
    console.log(
      `[${hora}] Primera fecha: ${fecha} (anterior: ${anterior ?? "ninguna"})`
    );

    if (!anterior || aFecha(fecha) < aFecha(anterior)) {
      await avisar(`📅 Nueva cita disponible: ${fecha}\nReserva aquí: ${URL}`);
    }
    fs.writeFileSync(FICHERO, fecha);
  } catch (error) {
    console.error(`[${hora}] Error:`, error.message);
  }
}

revisar();
setInterval(revisar, MINUTOS * 60 * 1000);
