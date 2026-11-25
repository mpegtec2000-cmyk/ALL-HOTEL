export function getGmailAutoSyncScript(webhookUrl: string, webhookSecret: string): string {
  return `/**
 * ALL RENT HOTELES QUINTERO - Conector Automático Gmail → Base de Datos
 * Instrucciones:
 * 1. Abre https://script.google.com con el Gmail donde recibes los correos de Airbnb
 * 2. Crea un Nuevo Proyecto, pega este código y guarda.
 * 3. En "Activadores" (icono reloj), agrega activador para syncAirbnbEmails cada 5 minutos.
 */
function syncAirbnbEmails() {
  const WEBHOOK_URL = "${webhookUrl}";
  const SECRET = "${webhookSecret}";
  const LABEL_NAME = "AllRent_Sincronizado";

  let label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) label = GmailApp.createLabel(LABEL_NAME);

  const query = '(from:airbnb.com OR subject:"Reserva confirmada" OR subject:"Reserva cancelada") -label:' + LABEL_NAME + ' newer_than:7d';
  const threads = GmailApp.search(query, 0, 15);

  for (const thread of threads) {
    const messages = thread.getMessages();
    const lastMsg = messages[messages.length - 1];

    const payload = {
      secret: SECRET,
      from: lastMsg.getFrom(),
      subject: lastMsg.getSubject(),
      textBody: lastMsg.getPlainBody(),
      htmlBody: lastMsg.getBody()
    };

    const res = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
      thread.addLabel(label);
    }
  }
}`
}
