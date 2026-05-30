const fs = require('fs');
const path = require('path');

const locales = ['de', 'en', 'fr', 'it', 'rm', 'es', 'pt'];

const translations = {
  de: {
    text: "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Durch Klicken auf 'Alle akzeptieren' stimmen Sie der Verwendung von Cookies zu. Lesen Sie unsere",
    policyLinkText: "Cookie-Richtlinie",
    accept: "Alle akzeptieren",
    necessary: "Nur notwendige"
  },
  en: {
    text: "We use cookies to enhance your experience. By clicking 'Accept All', you consent to our use of cookies. Read our",
    policyLinkText: "Cookie Policy",
    accept: "Accept All",
    necessary: "Necessary Only"
  },
  fr: {
    text: "Nous utilisons des cookies pour améliorer votre expérience. En cliquant sur 'Tout accepter', vous consentez à l'utilisation des cookies. Lisez notre",
    policyLinkText: "Charte des cookies",
    accept: "Tout accepter",
    necessary: "Nécessaires uniquement"
  },
  it: {
    text: "Utilizziamo i cookie per migliorare la tua esperienza. Cliccando su 'Accetta tutto', acconsenti all'uso dei cookie. Leggi la nostra",
    policyLinkText: "Informativa sui cookie",
    accept: "Accetta tutto",
    necessary: "Solo necessari"
  },
  rm: {
    text: "Nus utilisain cookies per optimar Voss'experientscha. Cun cliccar sin 'Acceptar tuts' das Els Voss consentiment. Legg la",
    policyLinkText: "Directiva davart ils cookies",
    accept: "Acceptar tuts",
    necessary: "Mo necessaris"
  },
  es: {
    text: "Utilizamos cookies para mejorar su experiencia. Al hacer clic en 'Aceptar todo', consiente el uso de cookies. Lea nuestra",
    policyLinkText: "Política de cookies",
    accept: "Aceptar todo",
    necessary: "Solo necesarias"
  },
  pt: {
    text: "Utilizamos cookies para melhorar a sua experiência. Ao clicar em 'Aceitar tudo', consente a utilização de cookies. Leia a nossa",
    policyLinkText: "Política de cookies",
    accept: "Aceitar tudo",
    necessary: "Apenas necessários"
  }
};

locales.forEach(loc => {
  const filePath = path.join(__dirname, '..', 'src', 'locales', `${loc}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.cookieBanner = translations[loc];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${loc}.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
