const fs = require('fs');
const path = require('path');

const locales = {
  de: "Firmenadresse",
  en: "Company Address",
  fr: "Adresse de l'entreprise",
  it: "Indirizzo dell'azienda",
  rm: "Adressa da la firma",
  es: "Dirección de la empresa",
  pt: "Endereço da Empresa"
};

for (const [lang, val] of Object.entries(locales)) {
  const filePath = path.join(__dirname, '../src/locales', `${lang}.json`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const target = `"contactEmailLabel":`;
  if (content.includes(target) && !content.includes("contactAddressLabel")) {
    content = content.replace(
      /"contactEmailLabel": "(.*?)",/,
      `"contactEmailLabel": "$1",\n      "contactAddressLabel": "${val}",`
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${lang}.json successfully.`);
  } else {
    console.log(`${lang}.json already contains contactAddressLabel or missing target.`);
  }
}
