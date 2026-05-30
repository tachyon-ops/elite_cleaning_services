const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../src/locales');

const additions = {
  en: {
    settings: {
      backofficeSettings: "Backoffice Settings",
      securityConfig: "Security Configuration",
      adminProfile: "Admin Profile",
      mfaTitle: "Multi-Factor Authentication (MFA)",
      mfaMethod: "MFA Dispatch Method",
      enableMfa: "ENABLE MULTI-FACTOR AUTH",
      disableMfa: "DISABLE 2-FACTOR AUTH",
      whatsappConfig: "WhatsApp Configuration",
      whatsappNumberLabel: "WhatsApp Number (Digits only)",
      displayLabel: "Display Label",
      saveSettings: "SAVE SETTINGS",
      whatsappSuccess: "WhatsApp settings updated successfully.",
      whatsappError: "Please enter a valid WhatsApp number (digits only).",
      totpApp: "Authenticator App (TOTP)",
      emailOtp: "Email One-Time Password (OTP)"
    }
  },
  de: {
    settings: {
      backofficeSettings: "Backoffice-Einstellungen",
      securityConfig: "Sicherheitskonfiguration",
      adminProfile: "Admin-Profil",
      mfaTitle: "Multi-Faktor-Authentifizierung (MFA)",
      mfaMethod: "MFA-Zustellungsmethode",
      enableMfa: "MULTI-FAKTOR-AUTH AKTIVIEREN",
      disableMfa: "2-FAKTOR-AUTH DEAKTIVIEREN",
      whatsappConfig: "WhatsApp-Konfiguration",
      whatsappNumberLabel: "WhatsApp-Nummer (nur Ziffern)",
      displayLabel: "Anzeigename / Label",
      saveSettings: "EINSTELLUNGEN SPEICHERN",
      whatsappSuccess: "WhatsApp-Einstellungen erfolgreich aktualisiert.",
      whatsappError: "Bitte geben Sie eine gültige WhatsApp-Nummer ein (nur Ziffern).",
      totpApp: "Authenticator-App (TOTP)",
      emailOtp: "Einmalpasswort per E-Mail (OTP)"
    }
  },
  fr: {
    settings: {
      backofficeSettings: "Paramètres du Backoffice",
      securityConfig: "Configuration de la Sécurité",
      adminProfile: "Profil Administrateur",
      mfaTitle: "Authentification Multi-Facteurs (MFA)",
      mfaMethod: "Méthode d'envoi MFA",
      enableMfa: "ACTIVER L'AUTH MULTI-FACTEURS",
      disableMfa: "DÉSACTIVER L'AUTH MULTI-FACTEURS",
      whatsappConfig: "Configuration WhatsApp",
      whatsappNumberLabel: "Numéro WhatsApp (chiffres uniquement)",
      displayLabel: "Étiquette d'affichage",
      saveSettings: "ENREGISTRER LES PARAMÈTRES",
      whatsappSuccess: "Paramètres WhatsApp mis à jour avec succès.",
      whatsappError: "Veuillez entrer un numéro WhatsApp valide (chiffres uniquement).",
      totpApp: "Application d'authentification (TOTP)",
      emailOtp: "Mot de passe unique par e-mail (OTP)"
    }
  },
  it: {
    settings: {
      backofficeSettings: "Impostazioni Backoffice",
      securityConfig: "Configurazione della Sicurezza",
      adminProfile: "Profilo Amministratore",
      mfaTitle: "Autenticazione a più fattori (MFA)",
      mfaMethod: "Metodo di invio MFA",
      enableMfa: "ABILITA AUTH MULTI-FATTORE",
      disableMfa: "DISABILITA AUTH A 2 FATTORI",
      whatsappConfig: "Configurazione WhatsApp",
      whatsappNumberLabel: "Numero WhatsApp (solo cifre)",
      displayLabel: "Etichetta di visualizzazione",
      saveSettings: "SALVA IMPOSTAZIONI",
      whatsappSuccess: "Impostazioni WhatsApp aggiornate con successo.",
      whatsappError: "Inserisci un numero WhatsApp valido (solo cifre).",
      totpApp: "App di autenticazione (TOTP)",
      emailOtp: "One-Time Password via E-mail (OTP)"
    }
  },
  es: {
    settings: {
      backofficeSettings: "Ajustes de Backoffice",
      securityConfig: "Configuración de Seguridad",
      adminProfile: "Perfil de Administrador",
      mfaTitle: "Autenticación de múltiples factores (MFA)",
      mfaMethod: "Método de envío MFA",
      enableMfa: "HABILITAR AUTH MULTIFACTOR",
      disableMfa: "DESHABILITAR AUTH DE 2 FACTORES",
      whatsappConfig: "Configuración de WhatsApp",
      whatsappNumberLabel: "Número de WhatsApp (solo dígitos)",
      displayLabel: "Etiqueta de visualización",
      saveSettings: "GUARDAR AJUSTES",
      whatsappSuccess: "Ajustes de WhatsApp actualizados con éxito.",
      whatsappError: "Por favor, introduzca un número de WhatsApp válido (solo dígitos).",
      totpApp: "Aplicación de autenticación (TOTP)",
      emailOtp: "Contraseña de un solo uso por correo electrónico (OTP)"
    }
  },
  pt: {
    settings: {
      backofficeSettings: "Definições do Backoffice",
      securityConfig: "Configuração de Segurança",
      adminProfile: "Perfil do Administrador",
      mfaTitle: "Autenticação de Dois Fatores (MFA)",
      mfaMethod: "Método de Envio MFA",
      enableMfa: "ATIVAR AUTENTICAÇÃO MULTI-FATOR",
      disableMfa: "DESATIVAR 2-FACTOR AUTH",
      whatsappConfig: "Configuração do WhatsApp",
      whatsappNumberLabel: "Número do WhatsApp (Apenas dígitos)",
      displayLabel: "Etiqueta de Exibição",
      saveSettings: "GUARDAR DEFINIÇÕES",
      whatsappSuccess: "Definições do WhatsApp atualizadas com sucesso.",
      whatsappError: "Por favor, introduza um número do WhatsApp válido (apenas dígitos).",
      totpApp: "Aplicação Autenticadora (TOTP)",
      emailOtp: "Palavra-passe Única de Email (OTP)"
    }
  },
  rm: {
    settings: {
      backofficeSettings: "Configuraziun dal Backoffice",
      securityConfig: "Configuraziun da segirezza",
      adminProfile: "Profil da l'administratur",
      mfaTitle: "Autentificaziun da plirs facturs (MFA)",
      mfaMethod: "Metoda da spediziun MFA",
      enableMfa: "ACTIVAR L'AUTENTIFICAZIUN MULTI-FACTUR",
      disableMfa: "DESACTIVAR L'AUTH DA 2 FACTURS",
      whatsappConfig: "Configuraziun da WhatsApp",
      whatsappNumberLabel: "Numero da WhatsApp (be cifras)",
      displayLabel: "Etichetta d'indicaziun",
      saveSettings: "CONSERVAR LAS CONFIGURAZIUNS",
      whatsappSuccess: "Configuraziun da WhatsApp actualisada cun success.",
      whatsappError: "Inseresch in numero da WhatsApp valid (be cifras).",
      totpApp: "App d'autentificaziun (TOTP)",
      emailOtp: "Parola d'ordine unica per e-mail (OTP)"
    }
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
  
  // Merge
  dict.admin = {
    ...dict.admin,
    settings: keyValues.settings
  };
  
  fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
}
console.log('Merge complete!');
