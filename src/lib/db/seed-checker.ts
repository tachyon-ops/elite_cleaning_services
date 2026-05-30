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
Verantwortlich für die Datenverarbeitung auf dieser Plattform ist die **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (E-Mail: {{CONTACT_EMAIL}}).

## 2. Erhebung und Speicherung personenbezogener Daten
Wir verarbeiten personenbezogene Daten, die Sie uns bei der Nutzung der Plattform, bei Buchungsanfragen oder bei einer Registrierung übermitteln. Dies umfasst:
- Kontaktdaten: Name, E-Mail-Adresse, Telefonnummer, Wohn- bzw. Geschäftsadresse.
- Auftragsdetails: Reinigungsort, Objektdaten (Flächen, Grundrisse, Fotos, Flugprotokolle oder Yacht-Spezifikationen).
- Zahlungsdaten: Sicher verschlüsselt über Stripe (Kreditkartendaten werden nicht auf unseren Systemen gespeichert).
- Technische Daten: IP-Adresse, Datum und Zeit des Zugriffs, Browsertyp, Cookie-Präferenzen.

## 3. Zweck und Rechtsgrundlage der Datenverarbeitung
Die Verarbeitung erfolgt gemäss dem Schweizerischen Datenschutzgesetz (DSG) und, soweit anwendbar, der EU-Datenschutz-Grundverordnung (DSGVO):
- **Vertragserfüllung (Art. 31 Abs. 2 lit. a DSG / Art. 6 Abs. 1 lit. b DSGVO):** Zur Vermittlung und Abwicklung von Reinigungsleistungen, Koordination mit Partnern und Abrechnung.
- **Berechtigte Interessen (Art. 31 Abs. 1 DSG / Art. 6 Abs. 1 lit. f DSGVO):** Zur Plattform-Sicherheit, Betrugsbekämpfung, Leistungsbewertung der Partner und Behebung von Kundenreklamationen.
- **Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):** Für Newsletter und Marketing (jederzeit widerrufbar).

## 4. Datenweitergabe an Partner und Dritte
Zur Durchführung Ihres Auftrags werden die notwendigen Daten (Name, Telefonnummer, Reinigungsadresse und Objektdetails) an das jeweils zugewiesene, geprüfte **Reinigungsunternehmen (Partner)** übermittelt. Der Partner verarbeitet diese Daten als eigenständiger datenschutzrechtlicher Verantwortlicher.
Zudem werden Zahlungsdaten an Stripe und Systemdaten an Supabase in europäischen Rechenzentren übertragen.

## 5. Aufbewahrung und Ihre Rechte
Buchungsbelege und steuerrelevante Daten werden gemäss der gesetzlichen Aufbewahrungspflicht des Schweizerischen Obligationenrechts (Art. 957 OR) für **10 Jahre** gespeichert. Sonstige Daten werden gelöscht, sobald der Zweck entfällt oder Sie eine Löschung verlangen.
Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit. Wenden Sie sich hierzu an {{CONTACT_EMAIL}}.`
          },
          {
            locale: "en",
            slug: "legal/privacy",
            title: "Privacy Policy",
            content: `# Privacy Policy

## 1. Data Controller
The data controller responsible for the processing of your personal data on this platform is **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (Email: {{CONTACT_EMAIL}}).

## 2. Collection and Storage of Personal Data
We collect and process personal data when you interact with our website, request quotes, or place bookings. This includes:
- Contact information: Name, email address, physical address, phone number.
- Service details: Cleaning site address, property characteristics (dimensions, layouts, photos, flight logs, or yacht specifications).
- Payment data: Processed securely via Stripe (we do not store raw credit card details).
- Technical data: IP address, access timestamps, browser specifications, and cookie preferences.

## 3. Purpose and Legal Basis of Processing
We process your data in accordance with the Swiss Federal Act on Data Protection (FADP/DSG) and, where applicable, the EU General Data Protection Regulation (GDPR) for the following purposes:
- **Contract Performance (Art. 6(1)(b) GDPR / Art. 31(2)(a) FADP):** To operate the booking platform, match your requests with verified third-party Provider Companies, coordinate services, and handle invoicing.
- **Legitimate Interests (Art. 6(1)(f) GDPR / Art. 31(1) FADP):** For security monitoring, platform optimization, managing disputes, and evaluating partner performance.
- **Consent (Art. 6(1)(a) GDPR):** For newsletters or marketing communications, which can be revoked at any time.

## 4. Data Sharing and Transfer to Partners
To execute your booking, relevant operational details (your name, phone number, cleaning location, and intake specifications) are shared with the **independent Swiss cleaning company (Provider)** assigned to your job. The Provider acts as an independent data controller for the physical performance of the cleaning service.
Furthermore, payments are processed securely via Stripe. Hosting and databases are hosted securely on Supabase in European data centers.

## 5. Data Retention and User Rights
Billing and transaction logs are retained for **10 years** in compliance with Swiss statutory record-keeping requirements (Art. 957 Swiss Code of Obligations). Personal accounts and operational profiles are retained as long as active, plus 2 years, or until a deletion request is received.
You have the right to request access, rectification, portability, or erasure of your personal data, and to withdraw consent. For requests, contact {{CONTACT_EMAIL}}.`
          },
          {
            locale: "fr",
            slug: "juridique/confidentialite",
            title: "Politique de confidentialité",
            content: `# Politique de confidentialité

## 1. Responsable du traitement
Le responsable du traitement des données est **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (E-mail: {{CONTACT_EMAIL}}).

## 2. Données collectées
Nous collectons des données fournies lors des réservations ou inscriptions (nom, adresse, téléphone, e-mail, données de paiement et détails de l'objet à nettoyer). Nos serveurs enregistrent des données techniques (adresse IP, date/heure).

## 3. Finalité et bases légales
Le traitement est conforme à la loi suisse sur la protection des données (LPD) et au RGPD:
- **Exécution du contrat (Art. 6(1)(b) RGPD / Art. 31(2)(a) LPD):** Pour exploiter la plateforme, vous mettre en relation avec des entreprises partenaires vérifiées et gérer la facturation.
- **Intérêts légitimes (Art. 6(1)(f) RGPD / Art. 31(1) LPD):** Pour la sécurité, l'évaluation des partenaires et la résolution des litiges.

## 4. Partage des données
Pour exécuter votre réservation, les détails nécessaires sont partagés avec **l'entreprise de nettoyage suisse indépendante (partenaire)** affectée, qui agit en tant que responsable de traitement distinct. Les paiements sont traités par Stripe et les données stockées sur Supabase en Europe.

## 5. Conservation et vos droits
Les pièces comptables sont conservées pendant **10 ans** (Code suisse des obligations, Art. 957). Vous disposez de droits d'accès, de rectification, de suppression et de portabilité en contactant {{CONTACT_EMAIL}}.`
          },
          {
            locale: "it",
            slug: "legale/privacy",
            title: "Informativa sulla privacy",
            content: `# Informativa sulla privacy

## 1. Titolare del trattamento
Il titolare del trattamento è **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (E-mail: {{CONTACT_EMAIL}}).

## 2. Dati trattati
Raccogliamo i dati forniti durante la prenotazione o registrazione (nome, indirizzo, telefono, e-mail, dati di pagamento e dettagli dell'immobile). Registriamo inoltre dati tecnici di navigazione (indirizzo IP, log).

## 3. Finalità e basi giuridiche
Il trattamento avviene in conformità con la Legge federale sulla protezione dei dati (LPD) e il GDPR:
- **Adempimento contrattuale (Art. 6(1)(b) GDPR / Art. 31(2)(a) LPD):** Per coordinare i servizi di pulizia specializzata con imprese partner e processare le transazioni.
- **Legittimo interesse (Art. 6(1)(f) GDPR / Art. 31(1) LPD):** Per sicurezza, gestione delle prestazioni dei partner e risoluzione delle controversie.

## 4. Comunicazione a terzi
I dettagli del servizio sono condivisi con **l'impresa di pulizie svizzera indipendente (partner)** assegnata, che agisce come titolare autonomo. I pagamenti avvengono tramite Stripe e i dati sono ospitati su Supabase in UE.

## 5. Diritti e conservazione
I registri contabili sono conservati per **10 anni** (Art. 957 del Codice delle Obbligazioni svizzero). Avete il diritto di accesso, rettifica, cancellazione e portabilità scrivendo a {{CONTACT_EMAIL}}.`
          },
          {
            locale: "rm",
            slug: "legal/datas",
            title: "Declaraziun da datas",
            content: `# Declaraziun da datas

## 1. Post responsabel
Il post responsabel per las datas è **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (E-mail: {{CONTACT_EMAIL}}).

## 2. Datas rimnadas
Nus rimnain datas ch'Els transmettan tras la reservaziun u registraziun (num, adressa, telefon, e-mail, datas da pajament, detagls dal object).

## 3. Intent ed ordinaziun legala
L'elaboraziun serva per ademplir il contract (Art. 31 al. 2 lit. a DSG svizzer / Art. 6 al. 1 lit. b GDPR):
- **Ademplir il contract:** Per coordinar ils servetschs da nettegiada cun interpresas partenarias independentas.
- **Interess legitims:** Per segirezza, controlla da qualitad ed intermediar dispitas.

## 4. Transmissiun a terzs
Datas relevantas vegnan tarmessas a la **firma da nettegiada independenta (partenari)** ch'è assignada. Ils pajaments vegnan elaborads tras Stripe e las datas èn sin Supabase en l'Europa.

## 5. Voss dretgs
Ils documents da cassa vegnan conservads per **10 onns** (Art. 957 OR svizzer). Els han il dretg d'infurmaziun, rectificaziun e stizzada tras e-mail a {{CONTACT_EMAIL}}.`
          },
          {
            locale: "es",
            slug: "legal/privacidad",
            title: "Política de privacidad",
            content: `# Política de privacidad

## 1. Responsable del tratamiento
El responsable del tratamiento es **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (E-mail: {{CONTACT_EMAIL}}).

## 2. Datos recopilados
Recopilamos información al reservar o registrarse (nombre, dirección, e-mail, teléfono, datos de pago y especificaciones de la limpieza). También registramos logs técnicos (dirección IP, hora de acceso).

## 3. Finalidad y base jurídica
El tratamiento se realiza conforme a la LPD suiza y al RGPD:
- **Ejecución del contrato (Art. 6(1)(b) RGPD / Art. 31(2)(a) LPD):** Para coordinar servicios con empresas colaboradoras y gestionar transacciones.
- **Intereses legítimos (Art. 6(1)(f) RGPD / Art. 31(1) LPD):** Para la seguridad del sitio, calidad del servicio y disputas.

## 4. Transferencia de datos
Los datos se comparten con la **empresa suiza de limpieza independiente (socio)** asignada, que actúa como responsable de tratamiento independiente. Los pagos seguros son procesados por Stripe y el hosting es provisto por Supabase en la UE.

## 5. Conservación y derechos
Los registros contables se conservan durante **10 años** por ley suiza (Código de las Obligaciones, Art. 957). Tiene derecho a acceder, rectificar, eliminar o limitar el tratamiento contactando a {{CONTACT_EMAIL}}.`
          },
          {
            locale: "pt",
            slug: "legal/privacidade",
            title: "Política de privacidade",
            content: `# Política de privacidade

## 1. Responsável pelo Tratamento de Dados
O responsável pelo tratamento dos seus dados é a **Elite Cleaning Platform AG**, {{CONTACT_ADDRESS}} (E-mail: {{CONTACT_EMAIL}}).

## 2. Recolha e Armazenamento de Dados Pessoais
Recolhemos dados pessoais fornecidos diretamente por si no momento da reserva, registo ou contacto (nome, morada, e-mail, telefone, dados de pagamento e detalhes específicos do imóvel). Os nossos servidores também registam o endereço IP e logs técnicos.

## 3. Finalidade e Base Legal do Tratamento
O tratamento dos dados é feito de acordo com a LPD suíça e o RGPD:
- **Execução do contrato (Art. 6.º, n.º 1, alínea b do RGPD / Art. 31.º, n.º 2, alínea a da LPD):** Para agendar e coordenar serviços com empresas prestadoras independentes e processar pagamentos.
- **Interesse Legítimo (Art. 6.º, n.º 1, alínea f do RGPD / Art. 31.º, n.º 1 da LPD):** Para segurança da plataforma, gestão de disputas e avaliação de parceiros.

## 4. Partilha de Dados com Terceiros
Os dados do serviço são partilhados com a **empresa parceira independente de limpeza** que foi designada para o serviço, a qual atua como responsável pelo tratamento independente. O processamento de pagamentos é efetuado de forma segura através do Stripe e alojado na Supabase (UE).

## 5. Retenção de Dados e os Seus Direitos
Retemos dados de faturação durante **10 anos** nos termos do Código das Obrigações Suíço (Art. 957 OR). Tem o direito de aceder, retificar, eliminar, limitar o tratamento e solicitar a portabilidade contactando {{CONTACT_EMAIL}}.`
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
Diese AGB regeln die Nutzung der Buchungsplattform der **Elite Cleaning Platform AG** ("Elite"). Elite betreibt einen kuratierten Marktplatz für Reinigungsdienstleistungen in der Schweiz.
**Elite ist kein Reinigungsunternehmen und stellt selbst keine Reinigungskräfte an. Elite agiert ausschliesslich als Vermittler (Broker).**
Mit der Buchung über die Plattform entstehen zwei separate Vertragsverhältnisse:
1. **Ein Vermittlungsvertrag** zwischen dem Kunden und Elite über die Nutzung der Plattform, die Vermittlung an einen Partner, den Kundenservice und das Inkasso.
2. **Ein Reinigungsvertrag** direkt zwischen dem Kunden und dem zugewiesenen **Partnerunternehmen (Provider)**. Der Partner ist ein eigenständiges, in der Schweiz registriertes Unternehmen und führt die Reinigung unter eigener Verantwortung, Haftung und Leitung aus.

## 2. Ausschluss der Arbeitgeberhaftung für Kunden
Da alle Aufträge ausschliesslich an eingetragene Schweizer Unternehmen (AG, GmbH oder im Handelsregister eingetragene Einzelfirmen mit gültiger UID) vermittelt werden, ist der Kunde vollständig von jeglicher Arbeitgeberhaftung geschützt. Es besteht kein Anstellungsverhältnis zwischen dem Kunden und den Reinigungskräften. Der Kunde ist nicht für Sozialabgaben (AHV, IV, EO, ALV), BVG-Beiträge, Unfallversicherung (UVG) oder die Einhaltung des Gesamtarbeitsvertrags (GAV) der Reinigungsbranche verantwortlich.

## 3. Buchungen, Offerten und Vertragsabschluss
- **Sofortbuchungen (Gewerbe/Hospitality):** Der Kunde gibt eine verbindliche Buchungsanfrage ab. Der Reinigungsvertrag kommt zustande, sobald Elite die Zuteilung eines Partners bestätigt.
- **Offertanfragen (Luftfahrt/Yachten/Sonderreinigungen):** Elite erstellt eine individuelle Offerte basierend auf den Kundendaten. Der Vertrag kommt mit der Annahme der Offerte durch den Kunden zustande.
- **Zahlungen:** Alle Preise verstehen sich in CHF. Die Zahlung erfolgt über Stripe. Je nach Sparte wird bei Buchung eine Anzahlung (30 %) oder Vorauszahlung fällig. Elite zieht diese Beträge im Namen des Partners ein.

## 4. Stornierungen und Umbuchungen
- Stornierungen oder Verschiebungen **mehr als 24 Stunden** vor dem vereinbarten Termin sind kostenlos. Geleistete Anzahlungen werden vollständig zurückerstattet.
- Bei Stornierungen oder Verschiebungen **innerhalb von 24 Stunden** vor dem Termin wird eine Stornogebühr von **50 % des Gesamtbetrages** verrechnet, um den Partner für die reservierte Kapazität zu entschädigen.

## 5. Haftung, Versicherung und Reklamationen
- Das ausführende Partnerunternehmen haftet vollumfänglich für Schäden, Mängel oder Verzögerungen bei der Reinigung.
- Partner sind verpflichtet, eine Betriebshaftpflichtversicherung mit einer Deckung von mindestens **CHF 5 Millionen** zu unterhalten.
- Elite haftet nicht für Mängel der Reinigung, bietet jedoch eine Vermittlungsstelle bei Streitigkeiten an. Mängel oder Schäden müssen Elite innerhalb von **48 Stunden** nach Fertigstellung an {{CONTACT_EMAIL}} gemeldet werden. Während der Klärung wird die Auszahlung an den Partner blockiert.

## 6. Anwendbares Recht und Gerichtsstand
Es gilt ausschliesslich Schweizer Recht. Der ausschliessliche Gerichtsstand für alle Streitigkeiten ist Zürich, Schweiz.`
          },
          {
            locale: "en",
            slug: "legal/terms",
            title: "Terms & Conditions",
            content: `# Terms & Conditions

## 1. Scope and Intermediary Platform Model
These Terms & Conditions govern the use of the digital booking platform operated by **Elite Cleaning Platform AG** ("Elite"). Elite operates a vetted marketplace for specialized cleaning services in Switzerland.
**Crucially, Elite is not a cleaning company and does not employ cleaners. Elite acts strictly as an intermediary (broker).**
By booking through the platform, two separate contracts are formed:
1. **A Brokerage Agreement** between the Client and Elite, governing the use of the booking platform, matching engine, customer service, and payment processing.
2. **A Cleaning Service Agreement** directly between the Client and the assigned **Provider Company** (which is an independent, registered Swiss business). The Provider performs the cleaning services under its own name, liability, and supervision.

## 2. No Employer Liability for Clients
Because the cleaning services are exclusively fulfilled by registered Swiss business entities (e.g., GmbH, AG, or registered sole proprietorships with a valid Swiss UID), the Client is entirely insulated from employer-related legal obligations. The Client does not hire individual workers, and is not responsible for Swiss social security declarations (AHV/AVS, IV, EO, ALV), BVG pensions, accident insurance (UVG), or compliance with the cleaning industry's Collective Bargaining Agreement (GAV).

## 3. Booking, Quote Requests, and Contract Formation
- **Instant Bookings (Commercial/Hospitality):** The Client makes a binding request. The contract with the Provider is formed once Elite confirms the assignment of a Provider.
- **Quote Requests (Aviation/Yacht/Special-Services):** The Client submits specifications. Elite coordinates with Providers to issue a binding quote. The contract is formed when the Client accepts the quote.
- **Payments:** Prices are in CHF. Payments are handled via Stripe. A deposit (typically 30%) or full prepayment is captured at booking. Elite collects payment on behalf of the Provider.

## 4. Cancellation and Rescheduling Policy
- Cancellations or rescheduling requests made **more than 24 hours** before the scheduled service start are free of charge. Any deposit will be fully refunded.
- Cancellations or rescheduling requests made **within 24 hours** of the scheduled start will incur a cancellation fee of **50% of the booking total**. This fee is charged to compensate the Provider for reserved staff capacity.

## 5. Liability, Insurance, and Disputes
- The performing Provider Company is solely liable for the execution of the cleaning service, including any property damages, timing delays, or quality defects.
- Providers are contractually required to maintain commercial liability insurance with a minimum coverage of **CHF 5 million**.
- Elite assumes no liability for the physical cleaning performance but operates a disputes resolution service. Customers must report damages or quality issues within **48 hours** of job completion via {{CONTACT_EMAIL}}. Elite will freeze provider payouts during active dispute mediation.

## 6. Governing Law and Jurisdiction
These terms are governed exclusively by Swiss law. The exclusive venue of jurisdiction for all disputes arising out of or in connection with these terms is Zurich, Switzerland.`
          },
          {
            locale: "fr",
            slug: "juridique/conditions-generales",
            title: "Conditions Générales",
            content: `# Conditions Générales

## 1. Modèle d'intermédiaire
Ces CG régissent l'utilisation de la plateforme de **Elite Cleaning Platform AG** ("Elite"). Elite agit en tant qu'intermédiaire de courtage de nettoyage en Suisse.
**Elite n'est pas une entreprise de nettoyage et n'emploie pas de nettoyeurs. Elle intervient exclusivement comme courtier/intermédiaire.**
Avec la réservation, deux contrats distincts sont formés:
1. **Un contrat de courtage** entre le client et Elite pour l'utilisation de la plateforme et le service client.
2. **Un contrat de nettoyage** directement entre le client et **l'entreprise prestataire partenaire** (qui est une entreprise suisse indépendante enregistrée). L'entreprise partenaire exécute le nettoyage sous sa propre responsabilité, responsabilité civile et direction.

## 2. Exclusion de responsabilité de l'employeur pour le client
Comme les services sont exclusivement assurés par des entreprises suisses enregistrées (SA, Sàrl ou entreprise individuelle inscrite avec UID), le client est totalement protégé contre les obligations de l'employeur en Suisse. Le client n'emploie aucun travailleur individuel et n'est pas responsable des cotisations sociales suisses (AVS, AI, APG, AC), de la LPP, de l'assurance accident (LAA) ou du respect de la CCT de la branche du nettoyage.

## 3. Réservation et conclusion du contrat
- **Prestations standard (Commercial/Hébergement):** Le contrat de nettoyage est conclu dès que Elite confirme l'attribution du partenaire.
- **Prestations sur devis (Aviation/Yachts/Services Spéciaux):** Elite soumet un devis. Le contrat est conclu lors de l'acceptation de celui-ci par le client.
- **Paiements:** Prix en CHF via Stripe. Un acompte (30%) ou le montant total est prélevé à la réservation. Elite perçoit les paiements au nom du partenaire.

## 4. Annulation et modification
- L'annulation ou la modification est gratuite **plus de 24 heures** avant l'intervention.
- Passé ce délai, des frais d'annulation de **50% du montant total** sont appliqués pour indemniser le partenaire pour la capacité réservée.

## 5. Responsabilité, assurance et réclamations
- L'entreprise partenaire est seule responsable de l'exécution et des dommages éventuels. Les partenaires doivent détenir une assurance RC professionnelle de **CHF 5 millions** minimum.
- Elite n'assume aucune responsabilité directe mais propose une médiation. Les dommages ou défauts doivent être signalés sous **48 heures** à {{CONTACT_EMAIL}}.`
          },
          {
            locale: "it",
            slug: "legale/termini",
            title: "Termini e Condizioni",
            content: `# Termini e Condizioni

## 1. Modello di intermediazione
I presenti termini regolano l'uso della piattaforma di **Elite Cleaning Platform AG** ("Elite"). Elite gestisce un mercato curato per servizi di pulizia in Svizzera.
**Elite non è un'impresa di pulizia e non assume addetti alle pulizie. Agisce esclusivamente come intermediario (broker).**
Effettuando una prenotazione, si formano due contratti distinti:
1. **Un contratto di intermediazione** tra il cliente e Elite per l'uso della piattaforma e il servizio clienti.
2. **Un contratto di pulizia** direttamente tra il cliente e **l'impresa di pulizie partner** assegnata (azienda svizzera indipendente registrata). Il partner esegue il servizio sotto la propria responsabilità e direzione.

## 2. Esclusione della responsabilità del datore di lavoro per il cliente
Poiché le pulizie sono eseguite esclusivamente da società svizzere registrate (AG, GmbH o ditta individuale con UID del partner valida), il cliente è totalmente esonerato dagli obblighi di legge previsti per i datori di lavoro. Il cliente non assume personale e non è responsabile delle dichiarazioni e dei contributi previdenziali (AVS, AI, IPG, AD), della previdenza professionale (LPP), dell'assicurazione contro gli infortuni (LAINF) o della conformità al contratto collettivo di lavoro (CCL) del settore.

## 3. Prenotazione, preventivi e conclusione del contratto
- **Prenotazioni istantanee (Uffici/Airbnb):** Il contratto con il partner si conclude con la conferma di assegnazione da parte di Elite.
- **Richieste di preventivo (Jet/Yacht/Servizi speciali):** Elite coordina l'invio di un preventivo vincolante. Il contratto è concluso quando il cliente lo accetta.
- **Pagamenti:** Prezzi in CHF gestiti tramite Stripe. All'atto della prenotazione è dovuto un acconto del 30% o il saldo totale. Elite riscuote i fondi per conto del partner.

## 4. Politica di cancellazione
- La cancellazione o modifica è gratuita fino a **24 ore prima** dell'inizio del servizio.
- Le richieste effettuate **entro le 24 ore** comportano una penale del **50% dell'importo totale**, accreditata al partner per compensare la capacità riservata.

## 5. Responsabilità, assicurazione e controversie
- Il partner è l'unico responsabile dell'esecuzione del servizio e di eventuali danni. Deve possedere un'assicurazione RC aziendale di almeno **CHF 5 milioni**.
- Elite non è responsabile per la pulizia fisica, ma assiste nella risoluzione delle controversie. Eventuali problemi vanno segnalati entro **48 ore** a {{CONTACT_EMAIL}}.`
          },
          {
            locale: "rm",
            slug: "legal/cundizions",
            title: "Cundizions generalas",
            content: `# Cundizions generalas (CG)

## 1. Model d'intermediaziun
Questas CG reglan l'utilisaziun da la plattafurma da **Elite Cleaning Platform AG** ("Elite"). Elite collia clients cun firmas da nettegiada.
**Elite n'è nagina firma da nettegiada e n'angoscha nagin persunal da nettegiada. Elite è mo in intermediar/broker.**
Cun far ina reservaziun resultan dus contracts:
1. **Contract d'intermediaziun** cun Elite per utilisar il portal e l'assistenza.
2. **Contract da servetsch** directamain tranter il client ed il **partenari (firma da nettegiada independenta)**.

## 2. Nagina respundabladad d'patrun per clients
Damai che tuts partenaris èn firmas svizras registradas (AG, GmbH u Einzelfirma cun UID), è il client libers da tuttas obligaziuns da patrun (AHV/AVS, IV, EO, ALV, BVG u GAV da nettegiada).

## 3. Reservaziun e pajament
- **Reservaziuns instantas:** Il contract cun il partenari cumenza ushespert che Elite conferma la reservaziun.
- **Pajaments:** En CHF via Stripe. In deposit da 30% u il pajament total vegn fatg a la reservaziun.

## 4. Stornaments
- Stornaments u spustaments èn gratuits fin **24 uras** avant il termin.
- Pli tard vegn cargà **50% per stornar** sco cumpensaziun per il partenari.

## 5. Responsabladad ed assicuranza
- Il partenari accepta la responsabladad per la nettegiada e sto avair ina assicuranza da CHF **5 milliuns**.
- Reclamaziuns u donns ston vegnir communitgads a {{CONTACT_EMAIL}} structuralmain entaifer **48 uras**.`
          },
          {
            locale: "es",
            slug: "legal/condiciones",
            title: "Términos y condiciones",
            content: `# Términos y condiciones

## 1. Ámbito de aplicación y modelo de intermediación
Estas condiciones regulan el uso de la plataforma de reservas de **Elite Cleaning Platform AG** ("Elite"). Elite opera un mercado curado para servicios de limpieza en Suiza.
**Elite no es una empresa de limpieza ni emplea limpiadores. Elite actúa exclusivamente como intermediario (broker).**
Al reservar a través de la plataforma, se celebran dos contratos independientes:
1. **Un acuerdo de intermediación** entre el cliente y Elite para el uso de la plataforma y la atención al cliente.
2. **Un contrato de servicios de limpieza** directamente entre el cliente y la **empresa proveedora (socio)** asignada (empresa suiza independiente). El socio realiza la limpieza bajo su propia responsabilidad, dirección y seguro.

## 2. Exclusión de responsabilidad patronal para el cliente
Dado que todos los servicios son prestados exclusivamente por empresas suizas registradas (AG, GmbH o empresa unipersonal con UID), el cliente está totalmente protegido de las obligaciones del empleador en Suiza (declaraciones a la seguridad social/AHV, pensiones/BVG, seguros de accidentes/UVG o cumplimiento del convenio colectivo de limpieza/GAV).

## 3. Reservas, cotizaciones y contratación
- **Reservas instantáneas (Comercial/Alojamiento):** El contrato se formaliza cuando Elite confirma la asignación del socio.
- **Cotizaciones (Aviación/Yates/Servicios especiales):** El contrato se perfecciona al aceptar la cotización coordinada por Elite.
- **Pagos:** Precios en CHF a través de Stripe. Se requiere un depósito del 30% o el pago total al reservar. Elite recauda en nombre del socio.

## 4. Política de cancelación y cambios
- Las cancelaciones o modificaciones con **más de 24 horas** de antelación son gratuitas.
- Las cancelaciones dentro de las **24 horas** anteriores conllevan una penalización del **50% del total** para compensar la capacidad reservada del socio.

## 5. Responsabilidad, seguros y reclamaciones
- El socio es el único responsable de la ejecución y los daños causados. Debe contar con un seguro de responsabilidad civil de mínimo **CHF 5 millones**.
- Elite no asume responsabilidad directa, pero ayuda en la mediación. Las reclamaciones deben notificarse en un plazo de **48 horas** a {{CONTACT_EMAIL}}.`
          },
          {
            locale: "pt",
            slug: "legal/termos",
            title: "Termos e condições",
            content: `# Termos e condições

## 1. Âmbito e Modelo de Intermediação (Corretagem)
Estes Termos e Condições regem a utilização da plataforma de reservas operada pela **Elite Cleaning Platform AG** ("Elite"). A Elite opera um mercado curado para serviços de limpeza especializada na Suíça.
**A Elite não é uma empresa de limpeza e não emprega profissionais de limpeza. A Elite atua estritamente como intermediária (corretora).**
Ao efetuar uma reserva através da plataforma, celebram-se dois contratos distintos:
1. **Um Contrato de Mediação** entre o Cliente e a Elite, que rege a utilização da plataforma, serviço de apoio e processamento de pagamentos.
2. **Um Contrato de Prestação de Serviços** diretamente entre o Cliente e a **empresa parceira prestadora (parceiro)** designada (empresa suíça independente registada). O parceiro realiza a limpeza sob a sua própria responsabilidade, direção e seguro.

## 2. Exclusão de Responsabilidade Patronal para o Cliente
Dado que os serviços são exclusivamente executados por empresas suíças registadas (SA, Lda ou dita individual com UID válido), o Cliente está totalmente protegido de obrigações laborais. O Cliente não contrata trabalhadores individuais, não sendo responsável por declarações e contribuições sociais (AHV/AVS, IV, EO, ALV), fundos de pensões (BVG), seguro de acidentes (UVG) ou pelo cumprimento do Contrato Coletivo de Trabalho (GAV) do setor de limpeza.

## 3. Reservas, Orçamentos e Formalização do Contrato
- **Reservas Instantâneas (Comercial/Alojamento):** O contrato com o parceiro considera-se celebrado assim que a Elite confirme a designação do parceiro.
- **Pedidos de Orçamento (Aviação/Iates/Serviços Especiais):** A Elite coordena a emissão de um orçamento. O contrato é celebrado com a aceitação do orçamento pelo Cliente.
- **Pagamento:** Preços em CHF através de Stripe. Cobrado depósito de 30% ou valor total no momento da reserva. A Elite cobra estes valores em nome do parceiro.

## 4. Cancelamentos e Reagendamentos
- Cancelamentos e alterações com **mais de 24 horas** de antecedência são gratuitos.
- Cancelamentos a menos de **24 horas** incorrem numa taxa de **50% do valor total**, creditada ao parceiro pela reserva de capacidade de pessoal.

## 5. Responsabilidade, Seguros e Litígios
- A empresa parceira prestadora é a única responsável pela execução do serviço e por eventuais danos. Os parceiros são obrigados a manter seguro de responsabilidade civil de no mínimo **CHF 5 milhões**.
- A Elite não se responsabiliza diretamente, mas oferece serviço de mediação de disputas. As reclamações devem ser enviadas em até **48 horas** para {{CONTACT_EMAIL}}.

## 6. Lei Aplicável e Jurisdição
Este contrato é regido pela lei suíça. O foro exclusivo de jurisdição é Zurique, Suíça.`
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
Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie dienen dazu, die Plattform nutzerfreundlich und sicher zu gestalten.

## 2. Notwendige Cookies
Diese Cookies sind für den Betrieb der Webseite zwingend erforderlich und können nicht deaktiviert werden:
- **Authentifizierung:** Sitzungs-Cookies (\`admin_session\`, \`provider_session\`), um Sie im Admin- oder Partner-Portal angemeldet zu halten.
- **Spracheinstellungen:** Der Cookie \`NEXT_LOCALE\`, um Ihre gewählte Sprache zu speichern.
- **Sicherheit:** CSRF-Schutzmarken zur Verhinderung von Angriffen.
- **Zahlungen:** Stripe-Cookies zur Betrugserkennung und sicheren Zahlungsabwicklung.

## 3. Analyse- und Performance-Cookies
Sofern Sie zugestimmt haben, verwenden wir datenschutzfreundliche Webanalyse-Tools, um die Websitenutzung anonymisiert auszuwerten. Wir nutzen keine Cookies, die Ihr Verhalten über mehrere Webseiten hinweg verfolgen.

## 4. Verwaltung von Cookies
Sie können Ihre Einstellungen jederzeit über unser Cookie-Einwilligungsbanner anpassen oder das Speichern von Cookies in den Einstellungen Ihres Webbrowsers blockieren oder einschränken.`
          },
          {
            locale: "en",
            slug: "legal/cookies",
            title: "Cookie Policy",
            content: `# Cookie Policy

## 1. What are Cookies?
Cookies are small text files stored on your computer or mobile device. They help us provide a secure and functional booking experience.

## 2. Essential and Functional Cookies
These cookies are strictly necessary for the platform to operate and cannot be disabled:
- **Authentication:** Sessions (\`admin_session\`, \`provider_session\`) to keep you logged into the admin or partner portals.
- **Preferences:** Language preferences (\`NEXT_LOCALE\`) to remember your language selection.
- **Security:** Tokens to prevent Cross-Site Request Forgery (CSRF) attacks.
- **Payments:** External Stripe cookies required for secure fraud detection and payment processing.

## 3. Analytics and Performance Cookies
With your consent, we use privacy-friendly web analytics tools to measure platform performance in an anonymized way. We do not use third-party tracking cookies that monitor your browsing habits across different websites.

## 4. Managing Cookie Settings
You can manage or revoke your consent preferences at any time using our cookie consent banner, or by configuring your web browser to delete or block cookies.`
          },
          {
            locale: "fr",
            slug: "juridique/cookies",
            title: "Charte des cookies",
            content: `# Charte des cookies

## 1. Définition
Les cookies sont des petits fichiers texte déposés sur votre terminal afin de faciliter votre navigation et sécuriser les processus de réservation.

## 2. Cookies essentiels
Ces cookies sont strictement nécessaires au fonctionnement et ne peuvent être désactivés:
- **Connexion:** Sessions (\`admin_session\`, \`provider_session\`) pour vous maintenir connecté.
- **Langue:** Cookie \`NEXT_LOCALE\` pour mémoriser votre langue préférée.
- **Sécurité:** Jetons CSRF pour prévenir les attaques.
- **Paiements:** Cookies Stripe indispensables à la sécurité des transactions et la détection des fraudes.

## 3. Cookies analytiques et performance
Avec votre consentement, nous mesurons l'audience anonymement sans vous suivre sur d'autres sites.

## 4. Gestion du consentement
Vous pouvez modifier vos choix à tout moment depuis la bannière de cookies ou les options de votre navigateur.`
          },
          {
            locale: "it",
            slug: "legale/cookie",
            title: "Informativa sui cookie",
            content: `# Informativa sui cookie

## 1. Cosa sono i cookie
I cookie sono piccoli file memorizzati sul dispositivo dell'utente per migliorare la navigazione e consentire la prenotazione dei servizi.

## 2. Cookie tecnici necessari
Questi cookie sono strettamente necessari per il funzionamento del sito e non possono essere disattivati:
- **Autenticazione:** Sessioni (\`admin_session\`, \`provider_session\`) per mantenerti loggato.
- **Lingua:** Il cookie \`NEXT_LOCALE\` per ricordare la lingua scelta.
- **Sicurezza:** Token CSRF per proteggere il sito.
- **Pagamenti:** Cookie esterni di Stripe richiesti per la prevenzione delle frodi e i pagamenti sicuri.

## 3. Cookie di analisi
Con il vostro consenso, misuriamo l'utilizzo del sito in forma anonima. Non tracciamo il comportamento su altri siti web.

## 4. Gestione dei cookie
È possibile modificare il consenso tramite il banner o disattivando i cookie direttamente dal browser.`
          },
          {
            locale: "rm",
            slug: "legal/cookies",
            title: "Directiva davart ils cookies",
            content: `# Directiva davart ils cookies

## 1. Tge èn cookies
Cookies èn pitschens datars da text per optimar la navigaziun e permetter las reservaziuns.

## 2. Cookies necessaris
Quests cookies èn obligatorics ed a d'ina desactivaziun betg pussaivla:
- **Autenticaziun:** Sitzungs-cookies (\`admin_session\`, \`provider_session\`).
- **Tscherna da la lingua:** \`NEXT_LOCALE\`.
- **Segirezza:** Sigls CSRF e processar pajaments via Stripe.

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
Las cookies son pequeños archivos de texto descargados en su equipo para facilitar la navegación y posibilitar la realización de reservas de forma segura.

## 2. Cookies esenciales y de funcionamiento
Estas cookies son estrictamente necesarias para el funcionamiento del sitio y no se pueden desactivar:
- **Autenticación:** Sesiones (\`admin_session\`, \`provider_session\`) para mantener su sesión activa.
- **Idioma:** Cookie \`NEXT_LOCALE\` para recordar su idioma preferido.
- **Seguridad:** Tokens CSRF para la prevención de ataques.
- **Pagos:** Cookies de Stripe para detectar fraudes y procesar pagos seguros.

## 3. Cookies analíticas y de rendimiento
Con su consentimiento, analizamos de forma anónima el rendimiento de la web sin rastrear su comportamiento en otros sitios.

## 4. Control de cookies
Puede ajustar sus preferencias en cualquier momento a través del banner de cookies o en la configuración de su navegador.`
          },
          {
            locale: "pt",
            slug: "legal/cookies",
            title: "Política de cookies",
            content: `# Política de cookies

## 1. O que são cookies?
Cookies são pequenos ficheiros de texto guardados no seu computador ou dispositivo móvel para proporcionar uma experiência de reserva fluida e segura.

## 2. Cookies Necessários e Funcionais
Estes cookies são estritamente necessários para o funcionamento e não podem ser desativados:
- **Autenticação:** Sessões (\`admin_session\`, \`provider_session\`) para manter a sessão iniciada.
- **Preferências:** Cookie \`NEXT_LOCALE\` para lembrar a sua seleção de idioma.
- **Segurança:** Tokens de proteção contra ataques CSRF.
- **Pagamentos:** Cookies do Stripe requeridos para prevenção de fraude e processamento seguro.

## 3. Cookies Analíticos e de Desempenho
Com o seu consentimento, medimos a interação com o website de forma anónima, sem rastrear o seu comportamento noutros websites.

## 4. Gestão de Cookies
Pode alterar ou revogar as suas preferências a qualquer momento através do nosso banner de consentimento, ou nas definições do seu navegador.`
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

## 1. Geltungsbereich und Status
Diese Partner-AGB regeln die Zusammenarbeit zwischen der **Elite Cleaning Platform AG** ("Elite") und dem registrierten, selbständigen Reinigungsunternehmen ("Partner"). Der Partner sichert zu, ein in der Schweiz ordnungsgemäss eingetragenes Unternehmen (AG, GmbH oder Einzelfirma) mit gültiger UID-Nummer und Betriebshaftpflichtversicherung zu sein.
Die Vertragsparteien sind unabhängige Unternehmer. Diese Vereinbarung begründet kein Arbeitsverhältnis, keine Partnerschaft und keine Vertretungsmacht zwischen Elite und dem Partner oder dessen Mitarbeitern.

## 2. Einhaltung von Arbeitsrecht und Gesamtarbeitsvertrag (GAV)
Der Partner ist alleiniger Arbeitgeber des für die Aufträge eingesetzten Reinigungspersonals. Der Partner verpflichtet sich zur:
- Vollständigen Einhaltung aller schweizerischen Arbeits- und Sozialversicherungsgesetze (Entrichtung von AHV, IV, EO, ALV und BVG-Beiträgen).
- Striktem Einhaltung des Gesamtarbeitsvertrags der Reinigungsbranche (**GAV für die Reinigungsbranche**), insbesondere bezüglich Mindestlöhnen, Arbeitszeiten und Arbeitssicherheit.
- Aufrechterhaltung einer Betriebshaftpflichtversicherung mit einer Deckungssumme von mindestens **CHF 5 Millionen** während der gesamten Zusammenarbeit.

## 3. Zuteilungs-SLA und Qualitätsstandards
- **SLA:** An den Partner übermittelte Aufträge müssen im Partner-Portal innerhalb von **30 Minuten** (Sofortbuchungen) bzw. **2 Stunden** (Offertanfragen) angenommen oder abgelehnt werden. Nach Ablauf dieser Frist verfällt das Angebot.
- **Qualität:** Der Partner verpflichtet sich, die Reinigungsarbeiten fachgerecht, pünktlich und gemäss den Buchungsspezifikationen durchzuführen.

## 4. Kundenschutz und Konventionalstrafe (Non-Circumvention)
Es ist dem Partner strengstens untersagt, mit Kunden, die über die Elite-Plattform vermittelt wurden, direkt oder indirekt Verträge ausserhalb der Plattform abzuschliessen, diese abzuwerben oder direkt in Rechnung zu stellen.
Bei Verstoss gegen diese Kundenschutzbestimmung schuldet der Partner eine Konventionalstrafe von **CHF 5'000** pro Verstoß. Die Geltendmachung eines darüber hinausgehenden Schadens und die Sperrung des Partnerkontos bleiben vorbehalten. Die Kundenschutzvereinbarung gilt bis **24 Monate** nach Beendigung der Zusammenarbeit fort.

## 5. Provisionen, Auszahlungen und Rechnungsstellung
- **Provision:** Elite behält für die Vermittlung und Abwicklung eine Servicegebühr ein (standardmässig **15 %** bei Gewerbe/Hospitality, **20 %** bei Luftfahrt/Yachten).
- **Auszahlung:** Das Guthaben (Auftragswert abzüglich Provision) wird wöchentlich auf das verknüpfte Stripe Connect Konto überwiesen. Es gilt eine Sicherheitsfrist (Disput-Fenster) von **7 Tagen** ab Auftragsabschluss.
- **Rechnungskette:** Der Partner ist der steuerliche Leistungserbringer der Reinigung. Elite erstellt im Namen und auf Rechnung des Partners die Kundenrechnung. Elite stellt dem Partner monatlich eine Rechnung über die eingenommenen Provisionen aus.

## 6. Anwendbares Recht und Gerichtsstand
Es gilt Schweizer Recht. Ausschliesslicher Gerichtsstand ist Zürich, Schweiz.`
          },
          {
            locale: "en",
            slug: "legal/provider-terms",
            title: "Provider Terms",
            content: `# Provider Terms (Master Services Agreement)

## 1. Scope and Business Relationship
These Provider Terms govern the cooperation between **Elite Cleaning Platform AG** ("Elite") and the registered, independent cleaning provider company ("Provider"). The Provider represents that it is a registered Swiss business entity (GmbH, AG, or registered sole proprietorship) holding a valid Swiss UID and commercial liability insurance.
The relationship is strictly that of independent businesses. Nothing in this agreement constitutes an employment, partnership, or agency relationship between Elite and the Provider, or between Elite and the Provider's employees.

## 2. Compliance with Labor Laws and Collective Agreements
The Provider is the sole employer of the cleaning staff assigned to platform bookings. The Provider is fully responsible for:
- Full compliance with Swiss employment and social security laws, including paying statutory contributions for AHV/AVS, IV, EO, ALV, and occupational pensions (BVG/LPP).
- Full compliance with the cleaning industry's Collective Bargaining Agreement (**GAV für die Reinigungsbranche**), including statutory minimum wages, working hour regulations, and safety requirements.
- Maintaining valid commercial liability insurance (Betriebshaftpflicht) with a minimum coverage of **CHF 5 million**.

## 3. Dispatch SLA and Quality Standards
- **SLA:** Cleaning offers dispatched to the Provider must be accepted or declined through the Partner Portal within **30 minutes** for instant bookings, and within **2 hours** for custom quote requests. Unanswered offers will time out and be dispatched to other partners.
- **Service Quality:** The Provider must perform the services in a professional manner, using trained staff, and complying with any special specifications detailed in the booking.

## 4. Non-Circumvention (Kundenschutz)
The Provider is strictly prohibited from bypassing the Elite platform to directly or indirectly contract, solicit, or invoice clients acquired through the platform. 
In the event of a breach of this non-circumvention clause, the Provider shall pay Elite a contractual penalty of **CHF 5,000** for each occurrence. Payment of the penalty does not release the Provider from compliance, and Elite reserves the right to claim further damages and suspend the Provider's account. This restriction survives for **24 months** after the termination of the cooperation.

## 5. Platforms Commissions, Payments, and Invoicing
- **Commission:** Elite retains a commission from the booking total (default **15%** for Commercial/Hospitality, **20%** for Aviation/Yachts, or as negotiated).
- **Payouts:** Job balances (booking total minus platform commission) are transferred weekly to the Provider's linked Stripe Connect account. Transfer is subject to a **7-day hold period** to allow for customer disputes.
- **Invoicing:** The Provider is the legal seller of the cleaning service. The platform generates client invoices on the Provider's behalf using the Provider's VAT registration details. Elite issues a monthly invoice to the Provider for platform commissions.

## 6. Governing Law and Jurisdiction
This agreement is governed by Swiss law. The exclusive place of jurisdiction is Zurich, Switzerland.`
          },
          {
            locale: "fr",
            slug: "juridique/conditions-prestataires",
            title: "Conditions Prestataires",
            content: `# Conditions Prestataires (Contrat de partenariat)

## 1. Cadre général et relation d'affaires
Ce contrat régit la relation entre **Elite Cleaning Platform AG** ("Elite") et l'entreprise prestataire partenaire indépendante de nettoyage ("Partenaire"). Le Partenaire déclare être une entreprise enregistrée en Suisse (SA, Sàrl ou raison individuelle enregistrée) disposant d'un numéro UID valide et d'une assurance RC professionnelle.
Les parties sont des entrepreneurs indépendants. Il n'existe aucun rapport de travail ou de mandat exclusif entre Elite et le Partenaire ou ses employés.

## 2. Conformité aux lois du travail et CCT
Le Partenaire est l'unique employeur du personnel affecté aux services. Il s'engage à:
- Respecter le droit du travail suisse et s'acquitter des cotisations sociales obligatoires (AVS, AI, APG, AC et LPP).
- Respecter scrupuleusement la Convention Collective de Travail (**CCT de la branche du nettoyage**), notamment en matière de salaires minimaux et d'horaires.
- Maintenir une assurance RC professionnelle avec une couverture minimale de **CHF 5 millions**.

## 3. SLA de réponse et standards de qualité
- **SLA:** Les offres doivent être acceptées ou refusées depuis le portail partenaire sous **30 minutes** (réservations instantanées) ou **2 heures** (devis).
- **Qualité:** Le Partenaire doit fournir des prestations de haute qualité conformes aux détails de la réservation.

## 4. Clause de non-contournement (Kundenschutz)
Il est strictement interdit au Partenaire de contourner Elite pour contracter ou facturer en direct des clients obtenus via la plateforme.
Toute infraction entraîne une pénalité contractuelle de **CHF 5 000** par incident. Elite se réserve le droit de réclamer des dommages-intérêts supplémentaires et de suspendre le compte. Cette interdiction s'applique pendant **24 mois** après la fin du contrat.

## 5. Commissions, versements et facturation
- **Commission:** Elite retient une commission sur le montant brut (par défaut **15%** pour commercial/hébergement, **20%** pour aviation/yachts).
- **Versements:** Les montants (bruts moins commission) sont versés chaque semaine sur le compte Stripe Connect, après un délai de rétention de **7 jours** pour d'éventuels litiges.
- **Facturation:** Le Partenaire est le vendeur légal de la prestation. Elite génère la facture client au nom du Partenaire. Elite facture mensuellement la commission au Partenaire.

## 6. Droit applicable et for compétent
Le droit suisse régit ce contrat. Le for exclusif est Zurich, Suisse.`
          },
          {
            locale: "it",
            slug: "legale/termini-partner",
            title: "Termini Partner",
            content: `# Termini Partner (Contratto di servizio)

## 1. Rapporti contrattuali
I presenti termini regolano i rapporti tra **Elite Cleaning Platform AG** ("Elite") e l'impresa di pulizia registrata indipendente ("Partner"). Il Partner dichiara di essere una società svizzera registrata (AG, GmbH o ditta industriale) con UID valido e assicurazione RC commerciale attiva.
Il rapporto tra le parti è esclusivamente di tipo B2B. Non sussiste alcun rapporto di lavoro subordinato o agenzia tra Elite e il Partner o i dipendenti di quest'ultimo.

## 2. Conformità con le leggi sul lavoro e contratti collettivi (CCL)
Il Partner è l'unico datore di lavoro del personale incaricato. È pienamente responsabile di:
- Conformità con le leggi svizzere sul lavoro e previdenza sociale (pagamento AVS, AI, IPG, AD e previdenza professionale LPP).
- Rispetto rigoroso del contratto collettivo di lavoro (**CCL del settore della pulizia**), in particolare dei salari minimi e orari di lavoro.
- Mantenimento di un'assicurazione RC commerciale di almeno **CHF 5 milioni**.

## 3. SLA di accettazione e standard di qualità
- **SLA:** Le offerte inviate al Partner devono essere accettate o rifiutate entro **30 minuti** (prenotazioni immediate) o **2 ore** (preventivi).
- **Qualità:** Il Partner è tenuto a svolgere i lavori a regola d'arte secondo le specifiche concordate.

## 4. Non elusione (Kundenschutz)
È fatto divieto al Partner di aggirare la piattaforma fatturando direttamente o stipulando contratti con i clienti acquisiti tramite Elite.
In caso di violazione, il Partner è tenuto al pagamento di una penale contrattuale di **CHF 5.000** per evento. Elite si riserva il diritto di chiedere risarcimenti maggiori e chiudere il conto. Questo vincolo dura per **24 mesi** dopo il termine del rapporto.

## 5. Provvigioni, liquidazioni e fatturazione
- **Provvigione:** Trattenuta da Elite (standard **15%** per uffici/Airbnb, **20%** per jet/yacht).
- **Liquidazioni:** Il saldo netto è accreditato settimanalmente tramite Stripe Connect dopo una trattenuta di **7 giorni** (finestra di disputa).
- **Fatturazione:** Il Partner è l'emittente fiscale del servizio. Elite genera le fatture ai clienti per conto del Partner. Elite emette fattura mensile al Partner per le provvigioni.

## 6. Legge applicabile e foro competente
Si applica il diritto svizzero. Foro competente esclusivo è Zurigo, Svizzera.`
          },
          {
            locale: "rm",
            slug: "legal/cundizions-partenaris",
            title: "Cundizions Partenaris",
            content: `# Cundizions Partenaris (Contract da cooperaziun)

## 1. Status ed intent
Questas cundizions reglan la cooperaziun tranter la **Elite Cleaning Platform AG** ("Elite") ed il partenari independent da nettegiada ("Partenari"). Il Partenari sto esser ina firma svizra registrada ed avair ina assicuranza da respundabladad activa.
Ils partenaris èn firmas independentas. Negina relaziun da lavur exista cun il portal.

## 2. Lescha da lavur e GAV
Il Partenari sto observar la lescha da lavur ed il contract collectiv da la branscha da nettegiada (**GAV da la branscha da nettegiada**), inclusiv ils minimums da pajament e las assicuranzas socialas (AHV, IV, EO, ALV, BVG).
Il Partenari sto avair ina assicuranza da respundabladad da min. CHF **5 milliuns**.

## 3. SLA da confirmaziun
- **SLA:** Offertas ston vegnir acceptadas en il portal entaifer **30 minutas** (instant) u **2 uras** (offertas).

## 4. Non-Circumvention
In contornament direct da clients ch'èn vegnids tranter la plattafurma è strictamain scumandà.
En cas da transgressiuns vegn cargada ina cundiziun da penalitad da CHF **5'000** per cas. Il scumand vala fin **24 onns** suenter il contract.

## 5. Provision e pajaments
- **Provision:** Elite deducescha ina provision da **15%** u **20%** (aviation/yachts).
- **Pajaments:** Transmissiun emnala tras Stripe connect suenter ina pausa da disputs da **7 dis**.

## 6. Gerichstand
Gerichtstand exclusiv è Turitg, Svizra.`
          },
          {
            locale: "es",
            slug: "legal/condiciones-socios",
            title: "Condiciones de Socios",
            content: `# Condiciones de Socios (Acuerdo de servicios)

## 1. Ámbito y relación comercial
Estas condiciones rigen la relación entre **Elite Cleaning Platform AG** ("Elite") y la empresa de limpieza independiente registrada ("Socio"). El Socio garantiza que es una entidad comercial suiza registrada (GmbH, AG o empresa unipersonal) con UID activo y seguro de responsabilidad civil.
La relación es estrictamente B2B. No existe relación laboral ni representación comercial entre Elite y el Socio o sus empleados.

## 2. Cumplimiento laboral y convenios colectivos
El Socio es el empleador directo del personal de limpieza. El Socio se compromete a:
- Cumplir plenamente la legislación laboral y de seguridad social suiza (pago de cotizaciones AHV/AVS, IV, EO, ALV y pensiones/BVG).
- Respetar rigurosamente el Convenio Colectivo de Trabajo del sector de la limpieza (**GAV del sector de la limpieza**), en particular sobre salarios mínimos y condiciones laborales.
- Mantener un seguro de responsabilidad civil comercial con una cobertura mínima de **CHF 5 millones**.

## 3. SLA de aceptación y estándares de calidad
- **SLA:** Las ofertas de limpieza deben aceptarse o rechazarse en el portal en **30 minutos** (instantáneas) o **2 horas** (cotizaciones).
- **Calidad:** El Socio se compromete a realizar los trabajos de forma profesional según la reserva.

## 4. Cláusula de no elusión (Non-Circumvention)
Se prohíbe estrictamente al Socio contactar, facturar o prestar servicios directamente a clientes obtenidos a través de la plataforma sin pasar por Elite.
La infracción de esta cláusula conllevará una penalización contractual de **CHF 5.000** por ocurrencia. Se mantiene la validez de esta restricción durante **24 meses** tras finalizar la relación comercial.

## 5. Comisiones, pagos y facturas
- **Comisión:** Elite retiene una comisión del total de la reserva (por defecto **15%** en comercial/alojamiento y **20%** en aviación/yates).
- **Pagos:** El saldo (total menos comisión) se transfiere semanalmente al Socio a través de Stripe Connect, sujeto a un período de retención de **7 días** por disputas.
- **Facturas:** El Socio es el vendedor del servicio. Elite genera facturas al cliente en su nombre. Elite emite una factura mensual de comisiones al Socio.

## 6. Ley aplicable y jurisdicción
Se rige por el derecho suizo. La jurisdicción exclusiva corresponde a Zúrich, Suiza.`
          },
          {
            locale: "pt",
            slug: "legal/termos-parceiros",
            title: "Termos de Parceiro",
            content: `# Termos de Parceiro (Contrato de Prestação de Serviços)

## 1. Âmbito e Relação Comercial
Estes Termos de Parceiro regem a cooperação entre a **Elite Cleaning Platform AG** ("Elite") e a empresa parceira de limpeza independente registada ("Parceiro"). O Parceiro declara ser uma entidade empresarial registada na Suíça (SA, Lda ou firma individual) com UID válido e seguro de responsabilidade civil ativa.
A relação é estritamente de caráter empresarial (B2B). Não existe qualquer relação laboral ou agência entre a Elite e o Parceiro ou os seus colaboradores.

## 2. Conformidade com as Leis de Trabalho e Convenção Coletiva (GAV)
O Parceiro é o único empregador do pessoal alocado aos serviços. É responsável por:
- Cumprimento total das leis de trabalho e segurança social suíças (pagamento de AHV/AVS, IV, EO, ALV e fundo de pensões BVG).
- Respeito rigoroso pelo Contrato Coletivo de Trabalho do setor de limpeza (**GAV do setor de limpeza**), em particular no que toca a salários mínimos e horários.
- Manutenção de seguro de responsabilidade civil comercial com cobertura mínima de **CHF 5 milhões**.

## 3. SLA de Aceitação e Padrões de Qualidade
- **SLA:** As ofertas enviadas ao Parceiro devem ser aceites ou rejeitadas através do portal do parceiro em **30 minutos** (reservas instantâneas) ou **2 horas** (orçamentos).
- **Qualidade:** O Parceiro deve realizar o serviço de forma profissional de acordo com as especificações da reserva.

## 4. Não Contorno de Clientes (Non-Circumvention)
O Parceiro está estritamente proibido de contornar a plataforma para contratar, angariar ou faturar diretamente clientes obtidos através da plataforma Elite.
Qualquer violação desta cláusula incorre numa penalização contratual de **CHF 5.000** por ocorrência. Esta restrição sobrevive por **24 meses** após a cessação da cooperação.

## 5. Comissões, Pagamentos e Faturação
- **Comissão:** A Elite retém uma comissão sobre o valor do serviço (padrão de **15%** em comercial/alojamento e **20%** em aviação/yates).
- **Pagamentos:** O saldo líquido (valor total menos comissão) é transferido semanalmente para a conta Stripe Connect do Parceiro, sujeito a uma retenção de **7 dias** para disputas.
- **Faturação:** O Parceiro é o vendedor legal do serviço. A Elite gera a fatura do cliente em nome do Parceiro. A Elite faturará mensalmente a comissão ao Parceiro.

## 6. Lei Aplicável e Jurisdição
Este contrato é regido pela lei suíça. O foro exclusivo de jurisdição é Zurique, Suíça.`
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
Handelsregisteramt des Kantons Zürich  
Unternehmens-Identifikationsnummer (UID): CHE-123.456.789 MWST  

## Vertretungsberechtigte Personen
Nuno Ribeiro, Gründer & CEO  

## Haftungsausschluss
Die Elite Cleaning Platform AG ist Plattformbetreiberin und Vermittlerin. Elite erbringt selbst keine physischen Reinigungsdienstleistungen und stellt keine Reinigungskräfte an. Die Haftung für die Ausführung der Reinigung, Sachschäden oder qualitative Mängel liegt vollumfänglich beim jeweils ausführenden, selbständigen Partnerunternehmen (Subunternehmer).`
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

## Contact Information
Email: ops@elite-cleaning.ch  
Phone: +41 (0) 44 123 4567  
Website: www.elite-cleaning.ch  

## Commercial Registration & VAT
Commercial Registry of the Canton of Zurich  
UID / Corporate Identification Number: CHE-123.456.789 MWST  

## Authorized Representative
Nuno Ribeiro, Founder & CEO  

## Legal Disclaimer
Elite Cleaning Platform AG is the platform operator and broker. Elite does not perform physical cleaning services and does not employ cleaners. All liability for the physical cleaning services, property damage, or operational defects rests entirely with the respective independent subcontractor partner company assigned to the job.`
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
Web: www.elite-cleaning.ch  

## Registre du commerce et TVA
Registre du commerce du canton de Zurich  
Numéro d'identification des entreprises (UID): CHE-123.456.789 MWST  

## Représentant légal
Nuno Ribeiro, Fondateur & CEO  

## Exclusion de responsabilité
Elite Cleaning Platform AG est l'exploitant et le courtier de la plateforme. Elite ne fournit pas elle-même de services de nettoyage physiques et n'emploie pas de nettoyeurs. Toute responsabilité concernant l'exécution des nettoyages, les dommages matériels ou les défauts opérationnels incombe exclusivement à l'entreprise prestataire partenaire suisse indépendante affectée au service.`
          },
          {
            locale: "it",
            slug: "legale/impressum",
            title: "Impressum",
            content: `# Impressum (Note Legali)

## Fornitore di servizi
**Elite Cleaning Platform AG**  
Bahnhofstrasse 12  
8001 Zurigo  
Svizzera  

## Contatti
E-mail: ops@elite-cleaning.ch  
Telefono: +41 (0) 44 123 4567  
Sito web: www.elite-cleaning.ch  

## Registro di commercio & IVA
Ufficio del registro di commercio del Canton Zurigo  
Numero UID: CHE-123.456.789 MWST  

## Rappresentante autorizzato
Nuno Ribeiro, Fondatore & CEO  

## Esclusione di responsabilità
Elite Cleaning Platform AG è il gestore e l'intermediario della piattaforma. Elite non esegue direttamente i servizi di pulizia e non assume personale per le pulizie. Qualsiasi responsabilità per le prestazioni fisiche, danni materiali o carenze di qualità ricade esclusivamente sulla ditta di pulizia partner svizzera indipendente assegnata al lavoro.`
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
Web: www.elite-cleaning.ch  

## Register commercial
Uffizi dal register commercial dal chantun Turitg  
Numer UID: CHE-123.456.789 MWST  

## Representants
Nuno Ribeiro, CEO & Founder  

## Exclusion da responsabladad
Elite Cleaning Platform AG è la plattafurma d'intermediaziun. Elite na fa naginas nettegiadas sezza. La responsabladad per la nettegiada e donns materialas è tar la firma independenta.`
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
Sitio web: www.elite-cleaning.ch  

## Registro mercantil e IVA
Oficina del registro mercantil del Cantón de Zúrich  
Número de identificación empresarial (UID): CHE-123.456.789 MWST  

## Representantes legales
Nuno Ribeiro, Fundador y CEO  

## Exclusión de responsabilidad
Elite Cleaning Platform AG es el operador y corredor de la plataforma. Elite no realiza servicios de limpieza físicos ni emplea limpiadores. Toda responsabilidad por la prestación del servicio de limpieza, daños materiales o deficiencias de calidad corresponde exclusivamente a la empresa proveedora colaboradora suiza asignada.`
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
