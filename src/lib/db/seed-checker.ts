import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";

export async function checkAndSeedDb() {
  try {
    // Migrate plain-text passwords to hashed passwords (if any exist)
    const plainUsers = await db.user.findMany();
    for (const u of plainUsers) {
      if (u.passwordHash && !u.passwordHash.includes(":")) {
        const hashed = hashPassword(u.passwordHash);
        await db.user.update({
          where: { id: u.id },
          data: { passwordHash: hashed }
        });
        console.log(`Migrated password for user ${u.email} to secure hash.`);
      }
    }

    // Seed localized pages
    const pageKeys = ["privacy", "terms", "cookies", "about", "provider-terms", "impressum"];
    for (const key of pageKeys) {
      let page = await db.page.findUnique({ where: { key } });
      if (!page) {
        console.log(`Seeding page: ${key}`);
        page = await db.page.create({ data: { key } });
      }
      
      // Define default translations based on key
      let translations: Array<{ locale: string; slug: string; title: string; content: string }> = [];
      
      if (key === "privacy") {
        translations = [
          {
            locale: "de",
            slug: "rechtliches/datenschutz",
            title: "Datenschutzerklärung",
            content: `# Datenschutzerklärung

## 1. Verantwortliche Stelle
Verantwortlich für die Datenverarbeitung auf dieser Plattform ist die **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Zürich, Schweiz (E-Mail: ops@elite-cleaning.ch).

## 2. Erhebung und Speicherung personenbezogener Daten
Wir verarbeiten personenbezogene Daten, die Sie uns bei der Nutzung der Plattform, bei Buchungsanfragen oder bei der Registrierung übermitteln (Name, Adresse, E-Mail-Adresse, Telefonnummer, Zahlungsdaten sowie spezifische Objektdaten der Buchungsstrecke). Zudem erfassen unsere Server Logfiles (IP-Adresse, Datum/Uhrzeit der Anfrage, Browsertyp).

## 3. Zweck und Rechtsgrundlage der Datenverarbeitung
Die Verarbeitung erfolgt zur Vertragserfüllung oder vorvertraglichen Massnahmen (Art. 31 Abs. 2 lit. a DSG / Art. 6 Abs. 1 lit. b DSGVO) zur Erbringung und Vermittlung von Reinigungsdienstleistungen, zur Rechnungsstellung und zur Kundenbetreuung. Die Einwilligung für optionale Services (z.B. Marketing) erfolgt separat (Art. 6 Abs. 1 lit. a DSGVO). Des Weiteren besteht ein berechtigtes Interesse an der Sicherheit und Funktionsfähigkeit unserer Systeme.

## 4. Weitergabe von Daten an Dritte
Zur Ausführung des Auftrags werden relevante Daten (Reinigungsdetails, Adresse, Name) an den jeweils zugewiesenen, geprüften Reinigungs-Subunternehmer weitergegeben. Die Zahlungsabwicklung erfolgt verschlüsselt über den externen Zahlungsdienstleister Stripe. Hosting- und Datenbankdienste werden über Supabase in europäischen Rechenzentren bezogen.

## 5. Aufbewahrung und Ihre Rechte
Ihre Daten werden so lange gespeichert, wie es für den Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten (z.B. 10 Jahre nach dem Schweizer Obligationenrecht für Buchungsbelege) dies vorschreiben. Sie haben das Recht auf Auskunft, Berichtigung, Löschung oder Einschränkung der Verarbeitung sowie ein Recht auf Datenübertragbarkeit und den Widerruf erteilter Einwilligungen.`
          },
          {
            locale: "en",
            slug: "legal/privacy",
            title: "Privacy Policy",
            content: `# Privacy Policy

## 1. Data Controller
The data controller responsible for processing your personal data is **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Zürich, Switzerland (Email: ops@elite-cleaning.ch).

## 2. Collection and Storage of Personal Data
We collect and process personal data that you provide directly during booking, registration, or contact inquiries (name, address, email, phone number, payment details, and cleaning-specific property dimensions/configurations). Our web servers also automatically log technical details such as your IP address, browser type, and time of access.

## 3. Purpose and Legal Basis of Processing
Your data is processed primarily to execute the contract or take pre-contractual steps (Art. 6(1)(b) GDPR / Art. 31(2)(a) Swiss FADP) to broker and coordinate specialty cleaning services, process transactions, and communicate updates. Legitimate interests apply for site security and quality audits. Marketing emails require explicit consent (Art. 6(1)(a) GDPR).

## 4. Sharing with Third Parties
To complete your bookings, relevant operational details (address, name, intake details) are shared with the vetted subcontractor partner assigned to your job. Secure payment processing is handled by Stripe. Application hosting and database systems are provided by Supabase in EU-based data centers.

## 5. Data Retention and Your Rights
We retain your personal data only as long as necessary for the specified purposes, or to comply with statutory retention requirements (such as the 10-year commercial retention requirement under the Swiss Code of Obligations). You have the right to access, rectify, delete, restrict processing, request data portability, and revoke any given consents at any time.`
          },
          {
            locale: "fr",
            slug: "juridique/confidentialite",
            title: "Politique de confidentialité",
            content: `# Politique de confidentialité

## 1. Responsable du traitement
Le responsable du traitement des données est **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Zurich, Suisse (E-mail: ops@elite-cleaning.ch).

## 2. Données collectées
Nous collectons les données fournies lors des réservations ou inscriptions (nom, adresse, téléphone, e-mail, données de paiement et caractéristiques de l'objet à nettoyer). De plus, nos serveurs enregistrent des données techniques (adresse IP, date/heure).

## 3. Finalité et bases légales
Le traitement est nécessaire à l'exécution du contrat (Art. 6(1)(b) RGPD / Art. 31(2)(a) LPD suisse) afin de coordonner les prestations de nettoyage, traiter les paiements et assurer le support client.

## 4. Destinataires des données
Vos données sont transmises au prestataire sous-traitant agréé affecté à votre nettoyage. Les paiements sont traités par Stripe et les données hébergées sur Supabase en Europe.

## 5. Vos droits
Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles, ainsi que du droit de retirer votre consentement à tout moment.`
          },
          {
            locale: "it",
            slug: "legale/privacy",
            title: "Informativa sulla privacy",
            content: `# Informativa sulla privacy

## 1. Titolare del trattamento
Il titolare del trattamento è **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Zurigo, Svizzera (E-mail: ops@elite-cleaning.ch).

## 2. Dati trattati
Raccogliamo i dati forniti durante la prenotazione o registrazione (nome, indirizzo, telefono, e-mail, dati di pagamento e dettagli dell'immobile). Registriamo inoltre l'indirizzo IP e log tecnici di navigazione.

## 3. Finalità e basi giuridiche
Il trattamento avviene per l'adempimento del contratto (Art. 6(1)(b) GDPR / Art. 31(2)(a) LPD svizzera) per gestire i servizi di pulizia specializzata e processare le transazioni.

## 4. Comunicazione a terzi
I dettagli del servizio sono condivisi con il subappaltatore selezionato assegnato al lavoro. I pagamenti avvengono tramite Stripe e i dati sono su Supabase in UE.

## 5. I vostri diritti
Avete il diritto di accedere, rettificare, cancellare o limitare il trattamento dei vostri dati, nonché di opporvi o revocare il consenso in qualsiasi momento.`
          },
          {
            locale: "rm",
            slug: "legal/datas",
            title: "Declaraziun da datas",
            content: `# Declaraziun da datas

## 1. Post responsabel
Il post responsabel per las datas è **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Turitg, Svizra (E-mail: ops@elite-cleaning.ch).

## 2. Datas rimnadas
Nus rimnain datas ch'Els transmettan tras la reservaziun u registraziun (num, adressa, telefon, e-mail, datas da pajament, detagls dal object).

## 3. Intent ed ordinaziun legala
L'elaboraziun serva per ademplir il contract (Art. 31 al. 2 lit. a DSG svizzer / Art. 6 al. 1 lit. b GDPR) per coordinar ils servetschs da nettegiada.

## 4. Transmissiun a terzs
Datas relevantas vegnan tarmessas al sutcontractur assignà. Ils pajaments vegnan elaborads tras Stripe e las datas èn sin Supabase en l'Europa.

## 5. Voss dretgs
Els han il dretg d'infurmaziun, rectificaziun, stizzada ed access a lur datas u da revocitgar consentiments dad open.`
          },
          {
            locale: "es",
            slug: "legal/privacidad",
            title: "Política de privacidad",
            content: `# Política de privacidad

## 1. Responsable del tratamiento
El responsable del tratamiento de datos es **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Zúrich, Suiza (E-mail: ops@elite-cleaning.ch).

## 2. Datos recopilados
Recopilamos información al reservar o registrarse (nombre, dirección, e-mail, teléfono, datos de pago y especificaciones de la limpieza). También registramos logs técnicos (dirección IP, hora de acceso).

## 3. Finalidad y base jurídica
El tratamiento se realiza para la ejecución del contrato (Art. 6(1)(b) RGPD / Art. 31(2)(a) LPD suiza) con el fin de coordinar los servicios de limpieza y gestionar transacciones.

## 4. Transferencia a terceros
Los datos del servicio se comparten con el socio subcontratado asignado. Los pagos seguros son procesados por Stripe y el hosting es provisto por Supabase en la UE.

## 5. Sus derechos
Tiene derecho a acceder, rectificar, eliminar o limitar el tratamiento de sus datos personales, así como a revocar sus consentimientos.`
          },
          {
            locale: "pt",
            slug: "legal/privacidade",
            title: "Política de privacidade",
            content: `# Política de privacidade

## 1. Responsável pelo Tratamento de Dados
O responsável pelo tratamento dos seus dados pessoais é a **Elite Cleaning Platform AG**, Bahnhofstrasse 12, 8001 Zurique, Suíça (E-mail: ops@elite-cleaning.ch).

## 2. Recolha e Armazenamento de Dados Pessoais
Recolhemos dados pessoais fornecidos diretamente por si no momento da reserva, registo ou contacto (nome, morada, e-mail, telefone, dados de pagamento e detalhes específicos do imóvel a limpar). Os nossos servidores web também registam automaticamente informações técnicas como o endereço IP, tipo de navegador e hora do acesso.

## 3. Finalidade e Base Legal do Tratamento
O tratamento dos seus dados destina-se principalmente à execução do contrato ou diligências pré-contratuais (Art. 6.º, n.º 1, alínea b do RGPD / Art. 31.º, n.º 2, alínea a da LPD Suíça) para agendar e coordenar os serviços de limpeza especializada, processar pagamentos e comunicar atualizações. O envio de comunicações de marketing requer o seu consentimento explícito.

## 4. Partilha de Dados com Terceiros
Para realizar os serviços de limpeza, os detalhes operacionais relevantes (morada, nome, especificações do serviço) são partilhados com o subcontratado parceiro avaliado que foi designado para o serviço. O processamento de pagamentos é efetuado de forma segura através do Stripe. O alojamento da aplicação e base de dados são fornecidos pela Supabase em servidores na União Europeia.

## 5. Retenção de Dados e os Seus Direitos
Retemos os seus dados apenas durante o período necessário para as finalidades descritas, ou para cumprir requisitos legais de retenção (tais como o dever de guarda de 10 anos sob o Código das Obrigações Suíço). Tem o direito de aceder, retificar, eliminar, limitar o tratamento, solicitar a portabilidade dos dados e revogar consentimentos a qualquer momento.`
          }
        ];
      } else if (key === "terms") {
        translations = [
          {
            locale: "de",
            slug: "rechtliches/agb",
            title: "Allgemeine Geschäftsbedingungen",
            content: `# Allgemeine Geschäftsbedingungen (AGB)

## 1. Geltungsbereich und Vermittlungsmodell
Diese AGB regeln die Nutzung der Buchungsplattform der **Elite Cleaning Platform AG** (nachfolgend "Elite"). Elite betreibt ein Vermittlungsmodell (Brokerage) für Spezialreinigungen in der Schweiz. Der Vertrag über die physische Ausführung der Reinigung kommt direkt zwischen dem Kunden und dem von Elite zugewiesenen, geprüften Subunternehmer-Partner zustande. Elite agiert als Vermittler, Inkassostelle und Hauptansprechpartner für Kundendienst und Rechnungsstellung.

## 2. Buchung, Zuweisung und Vertragsabschluss
Durch das Absenden einer Buchungsanfrage gibt der Kunde ein verbindliches Angebot ab. Der Vertrag über die Reinigungsleistung ist abgeschlossen, sobald Elite die Zuteilung eines Subunternehmers bestätigt. Bei Spezialreinigungen (z.B. Luftfahrt, Yachten) wird dem Kunden vorab eine individuelle Offerte unterbreitet, die dieser annehmen muss.

## 3. Preise und Zahlungsbedingungen
Alle Preise verstehen sich in Schweizer Franken (CHF). Die Zahlung erfolgt über den sicheren Zahlungsanbieter Stripe. Bei Buchung wird je nach Service-Sparte eine Anzahlung von 30 % oder die vollständige Vorauszahlung fällig. Elite zieht den Betrag im Namen des ausführenden Partners ein.

## 4. Stornierungs- und Umbuchungsbedingungen
Kunden können Buchungen bis zu 24 Stunden vor dem geplanten Ausführungszeitpunkt kostenlos stornieren oder verschieben. Bei Stornierungen innerhalb von 24 Stunden vor dem Termin wird eine Stornogebühr von 50 % des Gesamtbetrages einbehalten, um die reservierten Kapazitäten des Partners zu entschädigen.

## 5. Haftung und Versicherung
Die ausführenden Subunternehmer-Partner sind selbständige Unternehmen und verpflichtet, eine Betriebshaftpflichtversicherung mit einer Deckungssumme von mindestens CHF 5 Mio. zu unterhalten. Elite übernimmt keine direkte Haftung für Schäden, Mängel oder Verzögerungen, die durch den Subunternehmer verursacht wurden, vermittelt jedoch aktiv bei der Schadensregulierung.

## 6. Anwendbares Recht und Gerichtsstand
Es gilt Schweizer Recht. Ausschliesslicher Gerichtsstand für alle Streitigkeiten ist Zürich, Schweiz.`
          },
          {
            locale: "en",
            slug: "legal/terms",
            title: "Terms & Conditions",
            content: `# Terms & Conditions

## 1. Scope and Brokerage Model
These terms and conditions govern the use of the booking platform operated by **Elite Cleaning Platform AG** ("Elite"). Elite operates a vetted brokerage model for specialty cleaning services in Switzerland. The contract for the physical cleaning performance is formed directly between the customer and the vetted subcontractor partner assigned by Elite. Elite acts as the broker, payment collector, and primary point of contact for customer support and invoicing.

## 2. Booking, Assignment, and Contract Formation
By submitting a booking request, the customer places a binding offer. The contract for cleaning services is officially formed once Elite confirms the assignment of a subcontractor partner. For specialty verticals (e.g., aviation, yacht), an individual quote will be provided, which the customer must accept to finalize the booking.

## 3. Pricing and Payments
All prices are in Swiss Francs (CHF). Payments are processed securely via Stripe. Depending on the service category, either a 30% deposit or full prepayment is captured at booking. Elite collects these funds on behalf of the performing partner.

## 4. Cancellation and Rescheduling Policy
Customers may cancel or reschedule bookings free of charge up to 24 hours prior to the scheduled window. Cancellations or rescheduling requests made within 24 hours of the start window will incur a 50% fee, which is credited to the assigned partner to compensate for reserved capacity.

## 5. Liability and Insurance
The performing subcontractor partners are independent businesses and are contractually required to maintain commercial liability insurance with a minimum coverage of CHF 5 million. Elite is not directly liable for damages, deficiencies, or delays caused by the subcontractor, but will actively mediate and assist in resolving claims.

## 6. Governing Law and Jurisdiction
These terms are governed by Swiss law. The exclusive venue of jurisdiction for all disputes is Zurich, Switzerland.`
          },
          {
            locale: "fr",
            slug: "juridique/conditions-generales",
            title: "Conditions Générales",
            content: `# Conditions Générales (CG)

## 1. Modèle d'intermédiaire
Ces CG régissent l'utilisation de la plateforme de **Elite Cleaning Platform AG** ("Elite"). Elite agit en tant qu'intermédiaire de courtage. Le contrat pour la prestation de nettoyage est conclu directement entre le client et le prestataire sous-traitant affecté.

## 2. Prix et paiement
Tous les prix sont en CHF. Le paiement s'effectue via Stripe. Un acompte de 30% ou le paiement complet est prélevé à la réservation.

## 3. Conditions d'annulation
L'annulation ou la modification est gratuite jusqu'à 24 heures avant l'intervention. Passé ce délai, des frais d'annulation de 50% sont appliqués.

## 4. Responsabilité et assurances
Les sous-traitants sont des entreprises indépendantes possédant une assurance responsabilité civile professionnelle de CHF 5 millions minimum. Elite n'assume aucune responsabilité directe pour la prestation mais intervient comme médiateur.`
          },
          {
            locale: "it",
            slug: "legale/termini",
            title: "Termini e Condizioni",
            content: `# Termini e Condizioni

## 1. Modello di intermediazione
I presenti termini regolano l'uso della piattaforma di **Elite Cleaning Platform AG** ("Elite"). Il contratto di pulizia è stipulato direttamente tra il cliente e il subappaltatore selezionato assegnato da Elite.

## 2. Prezzi e pagamenti
Tutti i prezzi sono in CHF. I pagamenti sono elaborati tramite Stripe. All'atto della prenotazione è dovuto un acconto del 30% o il saldo totale.

## 3. Politica di cancellazione
La cancellazione è gratuita fino a 24 ore prima dell'intervento. In caso contrario, verrà trattenuta una penale del 50%.

## 4. Responsabilità e assicurazione
I subappaltatori sono autonomi e dispongono di assicurazione RC aziendale con copertura minima di CHF 5 milioni.`
          },
          {
            locale: "rm",
            slug: "legal/cundizions",
            title: "Cundizions generalas",
            content: `# Cundizions generalas (CG)

## 1. Model d'intermediaziun
Questas CG reglan l'utilisaziun da la plattafurma da **Elite Cleaning Platform AG** ("Elite"). Il contract per la nettegiada vegn serrà directamain tranter il client ed il sutcontractur assignà.

## 2. Pretschs e pajaments
Tuts pretschs èn en CHF. Ils pajaments vegnan fatgs tras Stripe. In deposit da 30% u il pajament total vegn cargà a la reservaziun.

## 3. Regulaziun da stornar
Stornaments u spustaments èn gratuits fin 24 uras avant il termin. Pli tard vegn cargà 50% per stornar.

## 4. Segirezza ed assicuranza
Ils sutcontracturs èn independents ed obligads d'avair ina assicuranza da responsabladad da CHF 5 milliuns.`
          },
          {
            locale: "es",
            slug: "legal/condiciones",
            title: "Términos y condiciones",
            content: `# Términos y condiciones

## 1. Modelo de corretaje
Estos términos regulan la plataforma de **Elite Cleaning Platform AG** ("Elite"). El contrato de limpieza se formaliza directamente entre el cliente y el socio subcontratado asignado.

## 2. Precios y pagos
Precios en CHF. Pagos mediante Stripe. Se requiere un depósito del 30% o el prepago completo al realizar la reserva.

## 3. Política de cancelación
Cancelaciones gratuitas hasta 24 horas antes del servicio. Dentro de las 24 horas previas, se aplicará un recargo del 50%.

## 4. Responsabilidad y seguros
Los socios son empresas independientes con seguro de responsabilidad civil comercial de mínimo CHF 5 millones.`
          },
          {
            locale: "pt",
            slug: "legal/termos",
            title: "Termos e condições",
            content: `# Termos e condições

## 1. Âmbito e Modelo de Corretagem
Estes termos e condições regulam a utilização da plataforma de reservas operada pela **Elite Cleaning Platform AG** ("Elite"). A Elite opera um modelo de corretagem avaliado para serviços de limpeza especializada na Suíça. O contrato para a realização física da limpeza é estabelecido diretamente entre o cliente e o parceiro subcontratado avaliado designado pela Elite. A Elite atua como corretor, cobrador de pagamentos e ponto de contacto principal para apoio ao cliente e faturação.

## 2. Reserva, Atribuição e Formalização do Contrato
Ao submeter um pedido de reserva, o cliente efetua uma proposta vinculativa. O contrato de prestação de serviços de limpeza considera-se formalizado assim que a Elite confirmar a designação do parceiro subcontratado. Para divisões especializadas (ex. aviação, iates), será fornecido um orçamento individual que o cliente deverá aceitar para finalizar a reserva.

## 3. Preços e Pagamento
Todos os preços são indicados em Francos Suíços (CHF). Os pagamentos são processados de forma segura através do Stripe. Conforme a categoria do serviço, é cobrado no momento da reserva um depósito de 30% ou o valor total do serviço. A Elite cobra estes valores em nome do parceiro que executará o serviço.

## 4. Cancelamentos e Reagendamento
Os clientes podem cancelar ou reagendar reservas gratuitamente até 24 horas antes do início agendado. Cancelamentos ou pedidos de reagendamento efetuados a menos de 24 horas do início do serviço incorrem numa taxa de 50% do valor total, a qual é creditada ao parceiro designado para compensar a reserva de capacidade.

## 5. Responsabilidade e Seguro
Os parceiros subcontratados que realizam os serviços são empresas independentes e estão contratualmente obrigados a manter um seguro de responsabilidade civil comercial com uma cobertura mínima de CHF 5 milhões. A Elite não se responsabiliza diretamente por danos, falhas ou atrasos causados pelo subcontratado, mas mediará e ajudará ativamente na resolução de reclamações.

## 6. Lei Aplicável e Foro de Jurisdição
Estes termos são regidos pela lei Suíça. O foro exclusivo de jurisdição para qualquer litígio é Zurique, Suíça.`
          }
        ];
      } else if (key === "cookies") {
        translations = [
          {
            locale: "de",
            slug: "rechtliches/cookies",
            title: "Cookie-Richtlinie",
            content: `# Cookie-Richtlinie

## 1. Was sind Cookies?
Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie helfen uns, die Benutzerfreundlichkeit unserer Plattform zu verbessern, Anmeldesitzungen aufrechtzuerhalten und Buchungen zu ermöglichen.

## 2. Notwendige Cookies
Diese Cookies sind für das einwandfreie Funktionieren der Website zwingend erforderlich. Dazu gehören Sitzungs-Cookies zur Authentifizierung von Administratoren und Partnern, Cookies zur Steuerung der Sprachauswahl (\`NEXT_LOCALE\`) und Sicherheits-Cookies zur CSRF-Verhinderung sowie Cookies von Stripe zur Zahlungsabwicklung. Sie können in Ihrem Browser nicht deaktiviert werden.

## 3. Analyse- und Performance-Cookies
Sofern Sie Ihre Zustimmung erteilt haben, verwenden wir datenschutzfreundliche Webanalyse-Tools, um die Interaktion mit unserer Website anonymisiert auszuwerten. Wir verwenden keine Cookies, die Ihr Verhalten über mehrere Websites hinweg verfolgen.

## 4. Verwaltung von Cookies
Sie können Ihre Cookie-Einstellungen jederzeit über unser Einwilligungs-Banner anpassen oder das Speichern von Cookies in den Einstellungen Ihres Webbrowsers blockieren oder einschränken.`
          },
          {
            locale: "en",
            slug: "legal/cookies",
            title: "Cookie Policy",
            content: `# Cookie Policy

## 1. What are Cookies?
Cookies are small text files stored on your computer or mobile device. They help us provide a Booking experience, maintain active authorizations, and recall preferences.

## 2. Essential Cookies
These cookies are strictly necessary for the operation of our platform. They include session cookies for admin and partner authentication, language selection markers (\`NEXT_LOCALE\`), CSRF security protection, and payment processing tokens from Stripe. These cannot be disabled.

## 3. Analytics and Performance Cookies
Subject to your consent, we employ privacy-friendly web analytics to measure how visitors interact with our site in an anonymized way. We do not use third-party cookies that track your browsing habits across other websites.

## 4. Managing Cookie Consent
You can manage or revoke your consent preferences at any time using our cookie banner, or by adjusting your web browser settings to block or delete cookies.`
          },
          {
            locale: "fr",
            slug: "juridique/cookies",
            title: "Charte des cookies",
            content: `# Charte des cookies

## 1. Définition
Les cookies sont des petits fichiers texte déposés sur votre terminal afin de faciliter votre navigation et sécuriser les processus de réservation.

## 2. Cookies essentiels
Indispensables pour maintenir votre connexion (administrateurs/partenaires), mémoriser la langue (\`NEXT_LOCALE\`), prévenir les attaques CSRF et traiter les paiements avec Stripe.

## 3. Cookies analytiques
Utilisés, sous réserve de consentement, pour mesurer anonymement l'audience de notre site, sans vous suivre sur d'autres sites.

## 4. Gestion du consentement
Vous pouvez modifier vos choix à tout moment depuis notre bannière ou dans les options de votre navigateur.`
          },
          {
            locale: "it",
            slug: "legale/cookie",
            title: "Informativa sui cookie",
            content: `# Informativa sui cookie

## 1. Cosa sono i cookie
I cookie sono piccoli file memorizzati sul dispositivo dell'utente per migliorare la navigazione e consentire la prenotazione dei servizi.

## 2. Cookie tecnici necessari
Essenziali per l'autenticazione, la selezione della lingua (\`NEXT_LOCALE\`), la sicurezza CSRF e la gestione dei pagamenti sicuri tramite Stripe.

## 3. Cookie di terze parti
Se approvati, servono al monitoraggio anonimo dell'uso della piattaforma, rispettando la vostra privacy.

## 4. Gestione dei cookie
È possibile modificare il consenso in qualsiasi momento tramite il banner dedicato o disattivando i cookie direttamente dal browser.`
          },
          {
            locale: "rm",
            slug: "legal/cookies",
            title: "Directiva davart ils cookies",
            content: `# Directiva davart ils cookies

## 1. Tge èn cookies
Cookies èn pitschens datars da text per optimar la navigaziun e permetter las reservaziuns.

## 2. Cookies necessaris
Importants per il process da log-in, tscherna da la lingua (\`NEXT_LOCALE\`), segirezza CSRF e processar pajaments via Stripe.

## 3. Analisa
Cun Voss consentiment utilisain cookies da statistica anonims per optimar il portal.

## 4. Configurar ils cookies
Ils dretgs pon adina vegnir midads tras noss banner u direct en il browser.`
          },
          {
            locale: "es",
            slug: "legal/cookies",
            title: "Política de cookies",
            content: `# Política de cookies

## 1. ¿Qué son las cookies?
Las cookies son pequeños archivos de texto descargados en su equipo para facilitar la navegación y posibilitar la realización de reservas.

## 2. Cookies esenciales
Requeridas para la autenticación, el idioma (\`NEXT_LOCALE\`), la protección de seguridad CSRF y el procesamiento de pagos de Stripe.

## 3. Cookies analíticas
Con su consentimiento, miden de forma anónima la interacción con nuestro sitio web sin rastrearlo en otras páginas.

## 4. Control de cookies
Puede ajustar sus preferencias en cualquier momento a través de nuestro banner de cookies o en la configuración de su navegador.`
          },
          {
            locale: "pt",
            slug: "legal/cookies",
            title: "Política de cookies",
            content: `# Política de cookies

## 1. O que são cookies?
Cookies são pequenos ficheiros de texto guardados no seu computador ou dispositivo móvel. Ajudam-nos a proporcionar uma experiência de reserva fluida, a manter sessões de utilizador ativas e a reter as suas preferências.

## 2. Cookies Necessários
Estes cookies são estritamente necessários para o funcionamento da plataforma. Incluem cookies de sessão para autenticação de administradores e parceiros, marcadores de preferência de idioma (\`NEXT_LOCALE\`), proteção de segurança contra ataques CSRF e tokens do Stripe para processamento de pagamentos. Não podem ser desativados.

## 3. Cookies Analíticos e de Desempenho
Com o seu consentimento, utilizamos ferramentas de análise web que protegem a sua privacidade para medir a forma como os utilizadores interagem com o nosso website de forma anónima. Não utilizamos cookies que rastreiem o seu comportamento noutros websites.

## 4. Gestão de Cookies
Pode alterar ou revogar as suas preferências a qualquer momento através do nosso banner de consentimento de cookies, ou configurando as definições do seu navegador para bloquear ou apagar cookies.`
          }
        ];
      } else if (key === "about") {
        translations = [
          {
            locale: "de",
            slug: "ueber-uns",
            title: "Über uns",
            content: `# Über uns

Elite Cleaning Services ist die führende Schweizer Vermittlungsplattform für spezialisierte Reinigungsdienstleistungen. Wir schliessen die Lücke zwischen anspruchsvollen Kunden und geprüften, zertifizierten Schweizer Reinigungsunternehmen.

## Unsere Mission
Wir stehen für kompromisslose Schweizer Qualität, absolute Zuverlässigkeit und diskreten Service. Ob exklusive Privatjets, luxuriöse Yachten, moderne Büros oder sensible Sonderreinigungen – wir vermitteln nur die besten Fachbetriebe des Landes.

## Schweizer Präzision und Sicherheit
Jeder Partner in unserem Netzwerk wird von unserem Operations-Team eingehend geprüft. Wir verlangen den Nachweis einer Betriebshaftpflichtversicherung mit einer Deckung von mindestens CHF 5 Mio., einen einwandfreien Leumund des Personals und nachweisbare Fachexpertise.`
          },
          {
            locale: "en",
            slug: "about",
            title: "About Us",
            content: `# About Us

Elite Cleaning Services is the premier Swiss brokerage platform for specialized cleaning solutions. We bridge the gap between high-end clients and vetted, certified Swiss cleaning provider companies.

## Our Mission
We stand for uncompromising Swiss quality, absolute reliability, and discrete service. Whether it is private aviation detailing, yacht marine care, commercial office upkeep, or sensitive biohazard situations, we dispatch only the top specialist teams in the country.

## Swiss Precision and Security
Every subcontractor partner in our network is thoroughly audited by our operations desk. We enforce minimum standards including a CHF 5 million commercial liability coverage, clean criminal records for all staff, and proven industry references.`
          },
          {
            locale: "fr",
            slug: "a-propos",
            title: "À propos de nous",
            content: `# À propos de nous

Elite Cleaning Services est la plateforme suisse de référence pour les solutions de nettoyage spécialisé. Nous faisons le lien entre des clients exigeants et des entreprises de nettoyage suisses agréées et certifiées.

## Notre mission
Nous garantissons une qualité de service sans compromis, une fiabilité absolue et une discrétion totale pour les jets privés, les yachts de luxe, les bureaux ou les situations post-incidents.

## Précision et sécurité
Chaque partenaire sous-traitant est rigoureusement audité et doit disposer d'une assurance RC professionnelle de CHF 5 millions minimum.`
          },
          {
            locale: "it",
            slug: "chi-siamo",
            title: "Chi siamo",
            content: `# Chi siamo

Elite Cleaning Services è la principale piattaforma svizzera di intermediazione per soluzioni di pulizia speciali. Colleghiamo clienti premium con imprese di pulizia svizzere selezionate e certificate.

## La nostra missione
Garantiamo qualità svizzera senza compromessi, massima affidabilità e discrezione per aviazione privata, yacht di lusso, uffici e scenari complessi.

## Precisione e sicurezza
Tutti i subappaltatori partner sono controllati e devono disporre di assicurazione RC commerciale con copertura minima di CHF 5 milioni.`
          },
          {
            locale: "rm",
            slug: "davart-nus",
            title: "Davart nus",
            content: `# Davart nus

Elite Cleaning Services è la plattafurma svizra principala per netschidadas spezialas. Nus coordinain ils megliers sutcontracturs per servetschs da luxus.

## Noss intent
Nus garantin qualitad svizra, discreziun ed assicuranza per jets privats, iahts, buros u Tatortreinigung.

## Segirezza e confurmitad
Mincha partenari vegn controllà ed obligà d'avair ina assicuranza da responsabladad da CHF 5 milliuns.`
          },
          {
            locale: "es",
            slug: "sobre-nosotros",
            title: "Sobre nosotros",
            content: `# Sobre nosotros

Elite Cleaning Services es la plataforma suiza líder en intermediación de limpieza especializada. Conectamos a clientes premium con empresas suizas de limpieza evaluadas y certificadas.

## Nuestra misión
Ofrecemos calidad suiza sin concesiones, confiabilidad absoluta y discreción para la aviación privada, yates de lujo, oficinas corporativas y situaciones complejas.

## Precisión y seguridad
Todos los socios son auditados y deben contar con un seguro de responsabilidad civil comercial de mínimo CHF 5 millones.`
          },
          {
            locale: "pt",
            slug: "sobre-nos",
            title: "Sobre nós",
            content: `# Sobre nós

A Elite Cleaning Services é a principal plataforma de corretagem da Suíça para soluções de limpeza especializada. Fazemos a ponte entre clientes exigentes e empresas prestadoras de serviços de limpeza suíças avaliadas e certificadas.

## A Nossa Missão
Representamos a qualidade suíça sem concessões, fiabilidade absoluta e um serviço discreto. Quer se trate de limpeza de aviação privada, tratamento de iates, manutenção de escritórios comerciais ou limpeza pós-incidentes sensível, enviamos apenas as melhores equipas especializadas do país.

## Precisão e Segurança Suíça
Cada parceiro subcontratado na nossa rede é rigorosamente auditado pelas nossas operações. Exigimos requisitos mínimos que incluem uma cobertura de seguro de responsabilidade civil comercial de CHF 5 milhões, registo criminal limpo de todo o pessoal e referências comprovadas no setor.`
          }
        ];
      } else if (key === "provider-terms") {
        translations = [
          {
            locale: "de",
            slug: "rechtliches/partner-agb",
            title: "Partner-AGB",
            content: `# Partner-AGB (Dienstleistungsvereinbarung)

Diese Partner-AGB regeln die Zusammenarbeit zwischen der **Elite Cleaning Platform AG** (nachfolgend "Elite") und dem registrierten, selbständigen Reinigungsunternehmen (nachfolgend "Partner").

## 1. Zulassung und Compliance-Kriterien
Der Partner muss als Schweizer Unternehmen im Handelsregister eingetragen sein. Er verpflichtet sich, während der gesamten Vertragslaufzeit eine Betriebshaftpflichtversicherung mit einer Deckungssumme von mindestens CHF 5 Mio. aufrechtzuerhalten und nur Personal mit einwandfreiem Leumund (Strafregisterauszug) einzusetzen.

## 2. Auftragszuteilung und Annahme-SLA
Über die Plattform vermittelte Auftragsangebote müssen innerhalb des definierten SLA (30 Minuten bei Standardaufträgen, 2 Stunden bei Offerten) über das Partner-Portal angenommen oder abgelehnt werden. Erfolgt keine rechtzeitige Reaktion, verfällt das Angebot.

## 3. Kundenschutz und Kundenschutzstrafe (Non-Circumvention)
Es ist dem Partner strengstens untersagt, mit Kunden, die über die Elite-Plattform vermittelt wurden, direkt oder indirekt Verträge ausserhalb der Plattform abzuschliessen. Bei Verstoss gegen diesen Kundenschutz wird eine Konventionalstrafe in Höhe von **CHF 5'000** pro Verstoß fällig. Der Kundenschutz gilt bis 24 Monate nach Beendigung der Zusammenarbeit.

## 4. Provision und Auszahlungen
Elite behält für die Vermittlung und Zahlungsabwicklung eine Provision (standardmässig 15 % bei Gewerbe/Unterkunft, 20 % bei Luftfahrt/Yachten) ein. Die Auszahlung des Partner-Guthabens erfolgt wöchentlich auf das verknüpfte Stripe Connect Konto nach Ablauf der 7-tägigen Sicherheitsfrist (Disput-Fenster).`
          },
          {
            locale: "en",
            slug: "legal/provider-terms",
            title: "Provider Terms",
            content: `# Provider Terms (Master Services Agreement)

These Provider Terms govern the cooperation between **Elite Cleaning Platform AG** ("Elite") and the registered, independent cleaning provider company ("Provider").

## 1. Onboarding and Compliance Requirements
The Provider must be a registered Swiss business. The Provider is required to maintain a commercial liability insurance policy with a minimum coverage of CHF 5 million throughout the duration of this agreement, and employ only staff with clean criminal record extracts.

## 2. Dispatch and Acceptance SLA
Cleaning job offers dispatched via the platform must be accepted or declined through the Partner Portal within the specified SLA (30 minutes for instant bookings, 2 hours for quote requests). Failure to respond will cause the offer to expire.

## 3. Non-Circumvention and Penalties
The Provider is strictly prohibited from contracting directly or indirectly with customers acquired through the Elite platform. Any breach of this non-circumvention clause will incur a contractual penalty of **CHF 5,000** per occurrence. Non-circumvention restrictions remain active for 24 months following the termination of this agreement.

## 4. Commission and Payout Schedule
Elite retains a service commission (default 15% for commercial/hospitality, 20% for aviation/yacht) from the job total. Payouts of the remaining balance are processed weekly to the Provider's linked Stripe Connect account, subject to a 7-day hold period (dispute window).`
          },
          {
            locale: "fr",
            slug: "juridique/conditions-prestataires",
            title: "Conditions Prestataires",
            content: `# Conditions Prestataires (Contrat de partenariat)

Ce contrat régit la relation entre **Elite Cleaning Platform AG** ("Elite") et le prestataire sous-traitant indépendant ("Partenaire").

## 1. Critères de conformité
Le Partenaire doit être une entreprise suisse enregistrée et détenir une assurance responsabilité civile professionnelle de CHF 5 millions minimum.

## 2. Clause de non-contournement
Le Partenaire s'interdit de contracter en direct avec les clients apportés par la plateforme Elite. Toute infraction à cette clause entraîne une pénalité contractuelle de **CHF 5 000** par incident.

## 3. Commissions et versements
La commission de service de la plateforme (15% à 20%) est déduite à la transaction. Les versements sont effectués de façon hebdomadaire.`
          },
          {
            locale: "it",
            slug: "legale/termini-partner",
            title: "Termini Partner",
            content: `# Termini Partner (Contratto di servizio)

I presenti termini regolano i rapporti tra **Elite Cleaning Platform AG** ("Elite") e il subappaltatore registrato ("Partner").

## 1. Requisiti di ammissione
Il Partner deve essere un'impresa svizzera iscritta al registro di commercio e mantenere un'assicurazione RC commerciale di almeno CHF 5 milioni.

## 2. Non-elusione dei clienti
È vietato contrattare direttamente con i clienti presentati da Elite. La violazione di questo accordo comporta una penale contrattuale di **CHF 5.000** per evento.

## 3. Provvigioni e liquidazioni
La provvigione della piattaforma (15% per uffici/Airbnb, 20% per jet/yacht) viene trattenuta all'erogazione. Le liquidazioni avvengono settimanalmente.`
          },
          {
            locale: "rm",
            slug: "legal/cundizions-partenaris",
            title: "Cundizions Partenaris",
            content: `# Cundizions Partenaris (Contract da cooperaziun)

Questas cundizions reglan la cooperaziun tranter la **Elite Cleaning Platform AG** ("Elite") ed il sutcontractur da nettegiada ("Partenari").

## 1. Compliance
Il Partenari sto esser ina firma svizra registrada ed avair ina assicuranza da respundabladad da min. CHF 5 milliuns.

## 2. Non-Circumvention
In contornament direct da clients ch'èn vegnids tranter la plattafurma è scumandà. En cas da transgressiuns vegn cargà ina cundiziun da penalitad da **CHF 5'000**.

## 3. Provision
La provision dal portal (15%-20%) vegn dedutta. Ils pajaments vegnan transferids tras Stripe connect tenor process emnal.`
          },
          {
            locale: "es",
            slug: "legal/condiciones-socios",
            title: "Condiciones de Socios",
            content: `# Condiciones de Socios (Acuerdo de servicios)

Estas condiciones rigen la relación entre **Elite Cleaning Platform AG** ("Elite") y el socio subcontratado independiente ("Socio").

## 1. Requisitos de cumplimiento
El Socio debe ser una empresa suiza registrada y mantener un seguro de responsabilidad civil profesional de al menos CHF 5 millones.

## 2. Cláusula de no elusión
Queda estrictamente prohibido contratar directamente con clientes obtenidos a través de la plataforma. Cualquier infracción generará una penalización contractual de **CHF 5.000**.

## 3. Comisión y pagos
Se retiene la comisión por servicio (15% a 20%) de cada transacción. Los pagos se realizan de manera semanal.`
          },
          {
            locale: "pt",
            slug: "legal/termos-parceiros",
            title: "Termos de Parceiro",
            content: `# Termos de Parceiro (Contrato de Prestação de Serviços)

Estes Termos de Parceiro regem a cooperação entre a **Elite Cleaning Platform AG** ("Elite") e a empresa independente de limpeza registada ("Parceiro").

## 1. Requisitos de Integração e Conformidade
O Parceiro deve ser uma empresa registada na Suíça. O Parceiro é obrigado a manter uma apólice de seguro de responsabilidade civil comercial com uma cobertura mínima de CHF 5 milhões durante a vigência deste contrato, e empregar apenas pessoal com registo criminal limpo.

## 2. SLAs de Despacho e Aceitação
As ofertas de serviço enviadas através da plataforma devem ser aceites ou recusadas no Portal do Parceiro dentro dos prazos definidos (30 minutos para reservas instantâneas, 2 horas para pedidos de orçamento). A falta de resposta atempada fará expirar a oferta.

## 3. Não Contorno de Clientes (Non-Circumvention)
O Parceiro está estritamente proibido de contratar diretamente ou indiretamente com clientes angariados através da plataforma Elite. Qualquer violação desta cláusula de não contorno incorre numa penalização contratual de **CHF 5.000** por ocorrência. As restrições de não contorno permanecem ativas por 24 meses após a cessação deste contrato.

## 4. Comissão e Calendário de Pagamentos
A Elite retém uma comissão de serviço (padrão de 15% para comercial/alojamento, 20% para aviação/iates) sobre o valor total do serviço. Os pagamentos do saldo restante são processados semanalmente para a conta Stripe Connect associada do Parceiro, sujeitos a um período de retenção de 7 dias (janela de disputa).`
          }
        ];
      } else if (key === "impressum") {
        translations = [
          {
            locale: "de",
            slug: "rechtliches/impressum",
            title: "Impressum",
            content: `# Impressum

## Diensteanbieter
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Zürich
Schweiz

## Kontakt
E-Mail: ops@elite-cleaning.ch
Telefon: +41 (0) 44 123 4567
Webseite: www.elite-cleaning.ch

## Handelsregister & MWST
UID-Nummer: CHE-123.456.789 MWST
Handelsregisteramt des Kantons Zürich

## Vertretungsberechtigte Personen
Nuno Ribeiro, Gründer & CEO

## Haftungsausschluss
Elite übernimmt keine Haftung für die Richtigkeit, Genauigkeit, Aktualität und Vollständigkeit der Informationen auf dieser Webseite. Die Haftung für physische Reinigungsleistungen liegt vollumfänglich beim jeweils ausführenden, selbständigen Reinigungs-Subunternehmer.`
          },
          {
            locale: "en",
            slug: "legal/imprint",
            title: "Imprint",
            content: `# Imprint (Legal Notice)

## Service Provider
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Zürich
Switzerland

## Contact
Email: ops@elite-cleaning.ch
Phone: +41 (0) 44 123 4567
Website: www.elite-cleaning.ch

## Business Registration & VAT
UID Number: CHE-123.456.789 MWST
Commercial Registry of the Canton of Zurich

## Authorized Representatives
Nuno Ribeiro, Founder & CEO

## Legal Disclaimer
Elite assumes no liability for the accuracy, correctness, timeliness, or completeness of the information on this website. Liability for physical cleaning services rests entirely with the respective independent subcontractor assigned to perform the service.`
          },
          {
            locale: "fr",
            slug: "juridique/mentions-legales",
            title: "Mentions Légales",
            content: `# Mentions Légales

## Fournisseur de services
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Zurich
Suisse

## Contact
E-mail: ops@elite-cleaning.ch
Téléphone: +41 (0) 44 123 4567

## Registre du commerce & TVA
Numéro UID: CHE-123.456.789 MWST
Registre du commerce du canton de Zurich

## Représentant légal
Nuno Ribeiro, Fondateur & CEO`
          },
          {
            locale: "it",
            slug: "legale/impressum",
            title: "Impressum",
            content: `# Impressum

## Fornitore di servizi
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Zurigo
Svizzera

## Contatti
E-mail: ops@elite-cleaning.ch
Telefono: +41 (0) 44 123 4567

## Registro di commercio & IVA
Numero UID: CHE-123.456.789 MWST
Ufficio del registro di commercio del Canton Zurigo

## Rappresentante autorizzato
Nuno Ribeiro, Fondatore & CEO`
          },
          {
            locale: "rm",
            slug: "legal/impressum",
            title: "Impressum",
            content: `# Impressum

## Post responsabel
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Turitg
Svizra

## Contact
E-mail: ops@elite-cleaning.ch
Telefon: +41 (0) 44 123 4567

## Register commercial
Numer UID: CHE-123.456.789 MWST
Uffizi dal register commercial dal chantun Turitg

## Representants
Nuno Ribeiro, CEO & Founder`
          },
          {
            locale: "es",
            slug: "legal/aviso-legal",
            title: "Aviso Legal",
            content: `# Aviso Legal

## Proveedor del servicio
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Zúrich
Suiza

## Contacto
E-mail: ops@elite-cleaning.ch
Teléfono: +41 (0) 44 123 4567

## Registro mercantil e IVA
Número UID: CHE-123.456.789 MWST
Oficina del registro mercantil del Cantón de Zúrich

## Representantes legales
Nuno Ribeiro, Fundador y CEO`
          },
          {
            locale: "pt",
            slug: "legal/impressum",
            title: "Impressum",
            content: `# Impressum (Aviso Legal)

## Prestador de Serviços
**Elite Cleaning Platform AG**
Bahnhofstrasse 12
8001 Zurique
Suíça

## Contacto
E-mail: ops@elite-cleaning.ch
Telefone: +41 (0) 44 123 4567
Website: www.elite-cleaning.ch

## Registo Comercial e IVA
Número UID: CHE-123.456.789 MWST
Conservatória do Registo Comercial do Cantão de Zurique

## Representantes Autorizados
Nuno Ribeiro, Fundador e CEO

## Exclusão de Responsabilidade
A Elite não assume qualquer responsabilidade pela exatidão, precisão, atualidade ou integridade das informações contidas neste website. A responsabilidade pela prestação dos serviços físicos de limpeza recai exclusivamente sobre o parceiro subcontratado independente que executa o serviço.`
          }
        ];
      }
      
      for (const t of translations) {
        const existingTrans = await db.pageTranslation.findFirst({
          where: { pageId: page.id, locale: t.locale }
        });
        
        if (!existingTrans) {
          console.log(`Creating translation for ${key} in ${t.locale}`);
          await db.pageTranslation.create({
            data: {
              pageId: page.id,
              locale: t.locale,
              slug: t.slug,
              title: t.title,
              content: t.content
            }
          });
        } else if (existingTrans.content.length < 500) {
          console.log(`Updating placeholder translation for ${key} in ${t.locale}`);
          await db.pageTranslation.update({
            where: { id: existingTrans.id },
            data: {
              slug: t.slug,
              title: t.title,
              content: t.content
            }
          });
        }
      }
      console.log(`Page ${key} seeded successfully with all locales.`);
    }

    // Check if domestic is missing and seed it
    const domesticCat = await db.serviceCategory.findUnique({
      where: { slug: "domestic" }
    });

    if (!domesticCat) {
      console.log("Domestic category missing. Seeding domestic category and offerings...");
      await db.serviceCategory.create({
        data: { slug: "domestic", name: "Domestic Cleaning", vertical: "domestic", pricingModel: "instant", active: true }
      });

      const domesticOfferings = [
        { categorySlug: "domestic", name: "Standard Home Clean", basePriceChf: 80.00, unit: "per_job", description: "Includes bedroom cleaning, living room dusting, floor mopping, kitchen wipe down, and trash emptying." },
        { categorySlug: "domestic", name: "Deep Home Clean", basePriceChf: 140.00, unit: "per_job", description: "Standard clean + carpet cleaning, window interiors, and kitchen deep cleaning." }
      ];

      for (const off of domesticOfferings) {
        await db.serviceOffering.create({
          data: {
            categorySlug: off.categorySlug,
            name: off.name,
            basePriceChf: off.basePriceChf,
            unit: off.unit,
            description: off.description
          }
        });
      }
      console.log("Domestic cleaning seeded successfully.");
    }

    const count = await db.serviceCategory.count();
    if (count > 1) { // 1 if only domestic was just seeded, but normally it should seed everything if completely empty
      console.log("Database already seeded. Categories count:", count);
      return;
    }
    console.log("Database empty. Starting automatic seed...");
    
    // Create categories
    const categories = [
      { slug: "commercial", name: "Commercial Offices", vertical: "commercial", pricingModel: "instant", active: true },
      { slug: "hospitality", name: "Hospitality & Turnovers", vertical: "hospitality", pricingModel: "instant", active: true },
      { slug: "aviation", name: "Aviation Detailing", vertical: "aviation", pricingModel: "quote_on_request", active: true },
      { slug: "yacht", name: "Yacht & Marine Care", vertical: "yacht", pricingModel: "quote_on_request", active: true },
      { slug: "special", name: "Biohazard & Post-Incident", vertical: "special", pricingModel: "quote_on_request", active: true }
    ];

    for (const cat of categories) {
      await db.serviceCategory.create({ data: cat });
    }

    // Create offerings
    const offerings = [
      { categorySlug: "commercial", name: "Standard Office Clean", basePriceChf: 150.00, unit: "per_job", description: "Includes workspace dusting, floor mopping, kitchen wipe down, and trash emptying." },
      { categorySlug: "commercial", name: "Deep Commercial Clean", basePriceChf: 250.00, unit: "per_job", description: "Standard clean + carpet steam clean, window interiors, and disinfection." },
      { categorySlug: "hospitality", name: "Turnover Standard Clean", basePriceChf: 120.00, unit: "per_job", description: "Includes sanitization, bed making, basic restocking, and guest prep." },
      { categorySlug: "hospitality", name: "Linen Service Add-on", basePriceChf: 35.00, unit: "per_job", description: "Professional laundering and swap of bed sheets and towels." }
    ];

    for (const off of offerings) {
      await db.serviceOffering.create({
        data: {
          categorySlug: off.categorySlug,
          name: off.name,
          basePriceChf: off.basePriceChf,
          unit: off.unit,
          description: off.description
        }
      });
    }

    // Create providers
    const provider1 = await db.provider.create({
      data: {
        name: "Alpine Cleaning Services AG",
        slug: "alpine-cleaning-services",
        contactEmail: "contact@alpineclean.ch",
        contactPhone: "+41 44 222 3344",
        address: "Bahnhofstrasse 12, 8001 Zürich",
        legalEntityType: "ag",
        uidNumber: "CHE-123.456.789 MWST",
        bankDetailsVerified: true,
        stripeConnectAccountId: "acct_mock_alpine123",
        stripeConnectStatus: "active",
        onboardingStatus: "active",
        notes: "Reliable provider for high-end commercial and hospitality clients."
      }
    });

    await db.providerTeam.create({
      data: {
        providerId: provider1.id,
        name: "Zürich North Dispatch Team",
        workingHours: JSON.stringify({ mon: ["08:00", "18:00"], tue: ["08:00", "18:00"], wed: ["08:00", "18:00"], thu: ["08:00", "18:00"], fri: ["08:00", "18:00"] }),
        serviceCategories: JSON.stringify(["commercial", "hospitality"]),
        region: "Zürich"
      }
    });

    await db.providerListing.create({
      data: {
        providerId: provider1.id,
        categorySlug: "commercial",
        serviceRadiusKm: 30,
        capacityPerDay: 5,
        leadTimeHours: 12,
        active: true
      }
    });
    await db.providerListing.create({
      data: {
        providerId: provider1.id,
        categorySlug: "hospitality",
        serviceRadiusKm: 30,
        capacityPerDay: 5,
        leadTimeHours: 12,
        active: true
      }
    });

    const provider2 = await db.provider.create({
      data: {
        name: "Lake Zurich Yacht Detailing GmbH",
        slug: "lake-zurich-yacht-detailing",
        contactEmail: "ops@yachtdetail.ch",
        contactPhone: "+41 44 555 6677",
        address: "Seestrasse 144, 8810 Horgen",
        legalEntityType: "gmbh",
        uidNumber: "CHE-987.654.321 MWST",
        bankDetailsVerified: true,
        stripeConnectAccountId: "acct_mock_yacht123",
        stripeConnectStatus: "active",
        onboardingStatus: "active",
        notes: "Specialist team with marina passes for Lake Zurich harbors."
      }
    });

    await db.providerTeam.create({
      data: {
        providerId: provider2.id,
        name: "Marine Team Alpha",
        workingHours: JSON.stringify({ mon: ["07:00", "19:00"], tue: ["07:00", "19:00"], wed: ["07:00", "19:00"], thu: ["07:00", "19:00"], fri: ["07:00", "19:00"], sat: ["08:00", "16:00"] }),
        serviceCategories: JSON.stringify(["yacht"]),
        region: "Zürichsee"
      }
    });

    await db.providerListing.create({
      data: {
        providerId: provider2.id,
        categorySlug: "yacht",
        serviceRadiusKm: 50,
        capacityPerDay: 2,
        leadTimeHours: 24,
        active: true
      }
    });

    // Create applications
    await db.providerApplication.create({
      data: {
        applicantEmail: "partner.apply@quickclean.ch",
        applicantName: "Jean Quick",
        companyName: "QuickClean Romandie Sàrl",
        legalEntityType: "gmbh",
        verticalsRequested: "commercial,hospitality",
        region: "Geneva",
        status: "submitted",
        applicationData: JSON.stringify({
          experienceYears: 5,
          staffCount: 12,
          motivation: "We want to expand our premium portfolio in Lake Geneva region."
        })
      }
    });
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error during checkAndSeedDb:", error);
  }
}
