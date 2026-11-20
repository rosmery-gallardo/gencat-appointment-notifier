# gencat-appointment-notifier

Bot en Node.js que vigila una página de cita previa de la Generalitat de Catalunya y envía un aviso por Telegram cuando aparece una fecha disponible.

Lo hice porque las citas se liberaban y se agotaban en pocos minutos, y revisar la web a mano no era viable.

## Cómo funciona

1. Cada 15 minutos abre la página con Playwright (Chromium y, si falla, Firefox).
2. Espera a que cargue el calendario y extrae las fechas del texto de la página y de sus iframes.
3. Compara la primera fecha futura con la última guardada en `ultima-fecha.txt`.
4. Si la fecha es nueva o anterior a la guardada, envía un mensaje a Telegram con la fecha y el enlace para reservar.

El bot solo avisa: no reserva ni rellena formularios.

## Tecnologías

Node.js · Playwright · API de bots de Telegram · dotenv

## Puesta en marcha

```bash
npm install
npx playwright install chromium firefox
cp .env.example .env   # rellena las variables
npm run chatid         # opcional: obtener tu chat id de Telegram
npm start
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `TELEGRAM_TOKEN` | Token del bot (creado con BotFather) |
| `TELEGRAM_CHAT_ID` | Chat al que se envían los avisos |
| `CITA_URL` | URL de la página de cita previa que se quiere vigilar |
| `VER_NAVEGADOR` | `true` para ver el navegador mientras se ejecuta |
