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
    const pageKeys = ["privacy", "terms", "cookies"];
    for (const key of pageKeys) {
      const pageExists = await db.page.findUnique({ where: { key } });
      if (!pageExists) {
        console.log(`Seeding page: ${key}`);
        const page = await db.page.create({ data: { key } });
        
        // Define default translations based on key
        let translations: Array<{ locale: string; slug: string; title: string; content: string }> = [];
        
        if (key === "privacy") {
          translations = [
            { locale: "de", slug: "rechtliches/datenschutz", title: "Datenschutzerklärung", content: "# Datenschutzerklärung\n\nWir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Diese Datenschutzerklärung informiert Sie darüber, wie wir Ihre personenbezogenen Daten erheben und verarbeiten.\n\n## 1. Datenerhebung\nWir erheben Daten, die Sie uns bei der Buchung oder Registrierung zur Verfügung stellen.\n\n## 2. Verwendung der Daten\nIhre Daten werden zur Abwicklung von Reinigungsaufträgen und zur Verbesserung unseres Service genutzt.\n\n## 3. Ihre Rechte\nSie haben das Recht auf Auskunft, Berichtigung oder Löschung Ihrer gespeicherten Daten." },
            { locale: "en", slug: "legal/privacy", title: "Privacy Policy", content: "# Privacy Policy\n\nYour privacy is of utmost importance to us. This privacy policy explains how we collect, process, and protect your personal data.\n\n## 1. Data Collection\nWe collect information you provide directly during booking, registration, or contact inquiries.\n\n## 2. Use of Data\nYour data is used to coordinate specialty cleaning jobs, process payments, and communicate service updates.\n\n## 3. Your Rights\nYou have the right to access, rectify, or request the erasure of your personal data at any time." },
            { locale: "fr", slug: "juridique/confidentialite", title: "Politique de confidentialité", content: "# Politique de confidentialité\n\nNous accordons une grande importance à la protection de vos données. Cette politique explique comment nous collectons et traitons vos données personnelles.\n\n## 1. Collecte des données\nNous collectons les données fournies lors de vos réservations ou inscriptions.\n\n## 2. Utilisation des données\nVos données sont utilisées pour traiter vos demandes de nettoyage et optimiser nos services.\n\n## 3. Vos droits\nVous disposez d'un droit d'accès, de rectification et de suppression de vos informations personnelles." },
            { locale: "it", slug: "legale/privacy", title: "Informativa sulla privacy", content: "# Informativa sulla privacy\n\nLa vostra privacy è fondamentale per noi. Questa informativa descrive come raccogliamo e trattiamo i vostri dati personali.\n\n## 1. Raccolta dei dati\nRaccogliamo i dati inseriti durante la prenotazione o la creazione dell'account.\n\n## 2. Uso dei dati\nI dati vengono utilizzati esclusivamente per fornire ed ottimizzare i nostri servizi di pulizia.\n\n## 3. I vostri diritti\nAvete il diritto di accedere, rettificare o richiedere la cancellazione dei vostri dati personali." },
            { locale: "rm", slug: "legal/datas", title: "Declaraziun da datas", content: "# Declaraziun da datas\n\nLa protecziun da Vossas datas persunalas è impurtanta per nus. Questa declaraziun infurmescha davart la rimnada e l'elaboraziun da datas.\n\n## 1. Rimnada da datas\nNus rimnain datas ch'Els transmettan a nus cun reservar u registrar.\n\n## 2. Utilisaziun da datas\nVossas datas vegnan utilisadas per coordinar ils servetschs da nettegiada.\n\n## 3. Voss dretgs\nEls han il dretg d'infurmaziun, rectificaziun u stizzada da lur datas." },
            { locale: "es", slug: "legal/privacidad", title: "Política de privacidad", content: "# Política de privacidad\n\nSu privacidad es muy importante para nosotros. Esta política detalla cómo recopilamos y procesamos sus datos personales.\n\n## 1. Recopilación de datos\nRecopilamos la información que nos facilita al reservar o registrarse.\n\n## 2. Uso de los datos\nUtilizamos sus datos para gestionar sus servicios de limpieza y mejorar la plataforma.\n\n## 3. Sus derechos\nTiene derecho a acceder, corregir o solicitar la eliminación de sus datos personales." },
            { locale: "pt", slug: "legal/privacidade", title: "Política de privacidade", content: "# Política de privacidade\n\nA sua privacidade é de extrema importância para nós. Esta política explica como recolhemos, processamos e protegemos os seus dados.\n\n## 1. Recolha de Dados\nRecolhemos os dados fornecidos diretamente no momento da reserva ou registo.\n\n## 2. Uso dos Dados\nOs seus dados são utilizados para agendar serviços de limpeza e melhorar a sua experiência.\n\n## 3. Seus Direitos\nTem o direito de aceder, retificar ou solicitar a eliminação dos seus dados pessoais." }
          ];
        } else if (key === "terms") {
          translations = [
            { locale: "de", slug: "rechtliches/agb", title: "Allgemeine Geschäftsbedingungen", content: "# Allgemeine Geschäftsbedingungen (AGB)\n\nWillkommen bei Elite Cleaning Services. Diese Bedingungen regeln die Nutzung unserer Buchungsplattform.\n\n## 1. Geltungsbereich\nDiese AGB gelten für alle Buchungen von Reinigungsdienstleistungen über unsere Plattform.\n\n## 2. Vertragsabschluss\nEin Vertrag kommt erst zustande, wenn wir die Buchung bestätigen oder ein Dienstleister zugeteilt wird.\n\n## 3. Stornierung\nStornierungen sind bis zu 24 Stunden vor dem Termin kostenlos möglich." },
            { locale: "en", slug: "legal/terms", title: "Terms & Conditions", content: "# Terms & Conditions\n\nWelcome to Elite Cleaning Services. These terms and conditions govern your use of our platform.\n\n## 1. Scope\nThese terms apply to all specialty and regular cleaning bookings placed on our system.\n\n## 2. Contract Formation\nA contract is officially formed once a subcontractor partner is assigned and confirmation is sent.\n\n## 3. Cancellations\nCancellations must be requested at least 24 hours prior to the scheduled window to avoid fees." },
            { locale: "fr", slug: "juridique/conditions-generales", title: "Conditions Générales", content: "# Conditions Générales (CG)\n\nBienvenue sur Elite Cleaning Services. Ces conditions régissent l'utilisation de nos services.\n\n## 1. Champ d'application\nLes présentes CG s'appliquent à toutes les réservations effectuées via notre site.\n\n## 2. Conclusion du contrat\nLe contrat est réputé conclu dès confirmation écrite et affectation d'un prestataire.\n\n## 3. Annulation\nLes annulations sont gratuites jusqu'à 24 heures avant le début de la prestation." },
            { locale: "it", slug: "legale/termini", title: "Termini e Condizioni", content: "# Termini e Condizioni\n\nBenvenuti su Elite Cleaning Services. Questi termini regolano l'uso del nostro portale.\n\n## 1. Ambito di applicazione\nI presenti termini si applicano a tutte le prenotazioni di pulizia effettuate sul sito.\n\n## 2. Conclusione del contratto\nIl contratto è valido una volta confermata la disponibilità del partner incaricato.\n\n## 3. Cancellazione\nLa cancellazione è gratuita fino a 24 ore prima dell'inizio programmato." },
            { locale: "rm", slug: "legal/cundizions", title: "Cundizions generalas", content: "# Cundizions generalas (CG)\n\nBainvegni tar Elite Cleaning Services. Questas cundizions reglan l'utilisaziun da nossa plattafurma.\n\n## 1. Champ d'applicaziun\nQuestas CG valan per tut las reservaziuns fatgas via plattafurma.\n\n## 2. Conclusiun dal contract\nIl contract è conclus per propi schizunt sche nus confermain la reservaziun.\n\n## 3. Annullaziun\nAnnullaziuns èn pussaivlas gratuitamain fin 24 uras avant il termin." },
            { locale: "es", slug: "legal/condiciones", title: "Términos y condiciones", content: "# Términos y condiciones\n\nBienvenido a Elite Cleaning Services. Estos términos regulan el acceso a nuestra plataforma.\n\n## 1. Ámbito\nEstos términos se aplican a todos los servicios de limpieza contratados en el sitio.\n\n## 2. Contrato\nEl acuerdo entra en vigor una vez asignado el limpiador y confirmada la reserva.\n\n## 3. Cancelación\nPermitimos cancelaciones sin costes adicionales hasta 24 horas antes del servicio." },
            { locale: "pt", slug: "legal/termos", title: "Termos e condições", content: "# Termos e condições\n\nBem-vindo à Elite Cleaning Services. Estes termos regulam a utilização do nosso website.\n\n## 1. Âmbito\nEstes termos aplicam-se a todas as reservas de limpeza efetuadas no nosso sistema.\n\n## 2. Contrato\nO contrato é formalizado assim que o prestador de serviços for designado e confirmado.\n\n## 3. Cancelamentos\nCancelamentos são gratuitos se efetuados até 24 horas antes do início do serviço." }
          ];
        } else if (key === "cookies") {
          translations = [
            { locale: "de", slug: "rechtliches/cookies", title: "Cookie-Richtlinie", content: "# Cookie-Richtlinie\n\nDiese Richtlinie erklärt, wie wir Cookies auf unserer Website einsetzen.\n\n## 1. Was sind Cookies?\nCookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden.\n\n## 2. Notwendige Cookies\nDiese Cookies sind für das Funktionieren der Buchungsstrecke zwingend erforderlich.\n\n## 3. Analyse-Cookies\nWir nutzen Cookies von Drittanbietern zur anonymen statistischen Auswertung." },
            { locale: "en", slug: "legal/cookies", title: "Cookie Policy", content: "# Cookie Policy\n\nThis cookie policy details how we use cookies and tracking mechanisms on our website.\n\n## 1. What are Cookies?\nCookies are tiny text files saved to your computer or mobile device to assist your session.\n\n## 2. Essential Cookies\nThese are strictly necessary to maintain authorization states and process cleaning bookings.\n\n## 3. Analytics Cookies\nWith your consent, we employ anonymous tracking to measure performance and improve usability." },
            { locale: "fr", slug: "juridique/cookies", title: "Charte des cookies", content: "# Charte des cookies\n\nCette charte vous informe sur l'usage des cookies lors de votre navigation.\n\n## 1. Qu'est-ce qu'un cookie ?\nUn cookie est un petit fichier texte déposé sur votre terminal.\n\n## 2. Cookies essentiels\nCes cookies sont indispensables au bon fonctionnement de l'espace client et des réservations.\n\n## 3. Cookies analytiques\nNous les utilisons pour comprendre l'utilisation de notre site et en améliorer l'expérience." },
            { locale: "it", slug: "legale/cookie", title: "Informativa sui cookie", content: "# Informativa sui cookie\n\nQuesta informativa spiega l'uso dei cookie e di altre tecnologie di tracciamento.\n\n## 1. Cosa sono i cookie?\nI cookie sono piccoli file di testo salvati sul browser dell'utente.\n\n## 2. Cookie tecnici\nNecessari per completare la procedura di prenotazione e rimanere loggati.\n\n## 3. Cookie di terze parti\nUtilizzati per monitorare statistiche anonime di navigazione." },
            { locale: "rm", slug: "legal/cookies", title: "Directiva davart ils cookies", content: "# Directiva davart ils cookies\n\nQuesta directiva declara co ch'ils cookies vegnan installads.\n\n## 1. Tge èn cookies?\nCookies èn pitschens datais da text che vegnan memorisads sin Voss apparat.\n\n## 2. Cookies necessaris\nQuestas datas èn obligatorias per far funcziunar la plattafurma.\n\n## 3. Analisas\nNus utilisain cookies d'analisa per optimar il portal." },
            { locale: "es", slug: "legal/cookies", title: "Política de cookies", content: "# Política de cookies\n\nEsta política detalla la utilización de cookies en nuestro sitio web.\n\n## 1. ¿Qué son las cookies?\nLas cookies son pequeños ficheros que se descargan en su dispositivo al acceder a páginas web.\n\n## 2. Cookies esenciales\nSon requeridas para garantizar la seguridad del sitio y posibilitar la tramitación de reservas.\n\n## 3. Cookies analíticas\nRecopilan estadísticas de uso agregadas para comprender mejor a nuestros clientes." },
            { locale: "pt", slug: "legal/cookies", title: "Política de cookies", content: "# Política de cookies\n\nEsta política descreve a utilização de cookies no nosso website.\n\n## 1. O que são cookies?\nCookies são pequenos ficheiros de texto guardados no seu dispositivo para reter informação.\n\n## 2. Cookies Necessários\nIndispensáveis para autenticação e correto processamento das reservas.\n\n## 3. Cookies Analíticos\nServem para analisar de forma anónima o tráfego do website." }
          ];
        }
        
        for (const t of translations) {
          await db.pageTranslation.create({
            data: {
              pageId: page.id,
              locale: t.locale,
              slug: t.slug,
              title: t.title,
              content: t.content
            }
          });
        }
        console.log(`Page ${key} seeded successfully with all locales.`);
      }
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
