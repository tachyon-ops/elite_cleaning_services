const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../src/locales');

const additions = {
  en: {
    autoCheckoutLabel: "Enable Auto-Checkout & Online Deposits",
    autoCheckoutDesc: "When enabled, clients check out and pay deposits online via credit card. When disabled, bookings are routed to WhatsApp dispatch for manual validation."
  },
  de: {
    autoCheckoutLabel: "Auto-Checkout & Online-Anzahlungen aktivieren",
    autoCheckoutDesc: "Wenn aktiviert, checken Kunden online aus und zahlen Anzahlungen per Kreditkarte. Wenn deaktiviert, werden Buchungen an den WhatsApp-Dispatch weitergeleitet."
  },
  fr: {
    autoCheckoutLabel: "Activer l'auto-checkout et les dépôts en ligne",
    autoCheckoutDesc: "Lorsqu'il est activé, les clients paient leurs acomptes en ligne par carte de crédit. Sinon, les réservations sont redirigées vers la répartition WhatsApp."
  },
  it: {
    autoCheckoutLabel: "Abilita auto-checkout e depositi online",
    autoCheckoutDesc: "Se abilitato, i clienti completano il pagamento del deposito online. Altrimenti, le prenotazioni vengono reindirizzate al dispatcher su WhatsApp."
  },
  es: {
    autoCheckoutLabel: "Activar auto-checkout y depósitos en línea",
    autoCheckoutDesc: "Cuando está activado, los clientes pagan depósitos en línea con tarjeta. Cuando está desactivado, las reservas se redirigen al despacho de WhatsApp."
  },
  pt: {
    autoCheckoutLabel: "Ativar Auto-Checkout e Depósitos Online",
    autoCheckoutDesc: "Quando ativado, os clientes finalizam a compra e pagam depósitos online via cartão de crédito. Quando desativado, as reservas são redirecionadas para o despacho do WhatsApp."
  },
  rm: {
    autoCheckoutLabel: "Activar auto-checkout & deposits online",
    autoCheckoutDesc: "Sche activà, ils clients pajan ils deposits online cun carta da credit. Sche desactivà, las reservaziuns vegnan reorientadas a la spediziun da WhatsApp."
  }
};

for (const [lang, keyValues] of Object.entries(additions)) {
  const filePath = path.join(localesPath, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const dict = JSON.parse(content);
  
  // Merge into admin.settings
  dict.admin = dict.admin || {};
  dict.admin.settings = dict.admin.settings || {};
  dict.admin.settings.autoCheckoutLabel = keyValues.autoCheckoutLabel;
  dict.admin.settings.autoCheckoutDesc = keyValues.autoCheckoutDesc;
  
  fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
  console.log(`Updated ${lang}.json with checkout flags`);
}
console.log('Merge complete!');
