const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../src/locales');

const additions = {
  en: {
    dashboard: {
      operationsHub: "Operations Hub",
      systemOverview: "System Overview",
      activeBookings: "Active Bookings",
      pendingDispatches: "Pending dispatcher dispatches",
      revenueMtd: "Revenue MTD",
      fromCompletedDeposits: "From completed deposits",
      totalBookings: "Total Bookings",
      allLoggedBookings: "All logged bookings",
      avgRating: "Avg Rating",
      satisfactionIndex: "Customer satisfaction index",
      noticeTitle: "Role-based Access & Dispatcher Control",
      noticeText: "From the sidebar menu, select **Bookings & Dispatch** to inspect client intake forms, re-assign dispatches to local subcontractor partners, process cancellations, or execute GDPR-compliant data deletions."
    },
    bookings: {
      activeDispatch: "Active Dispatch",
      dashboardTitle: "Bookings Dashboard",
      loading: "Loading dispatches from SQLite...",
      teamUpdated: "Subcontractor team updated successfully",
      statusUpdated: "Booking status updated successfully",
      gdprSuccess: "GDPR deletion complete for {email}",
      gdprError: "Failed to execute GDPR deletion",
      invalidPrice: "Please enter a valid price greater than 0",
      invalidValidity: "Please enter a valid validity window",
      quoteCreated: "Quote created and sent to customer successfully.",
      quoteError: "Failed to create quote",
      gdprConfirm: "WARNING: GDPR Request. This will permanently delete all logs, reviews, payments, and bookings associated with customer email: {email}. Are you absolutely sure?",
      listTitle: "Active Bookings List ({count})",
      table: {
        date: "Service Date",
        customer: "Customer",
        details: "Service Details",
        partner: "Partner Assigned",
        status: "Status",
        inspect: "Inspect"
      },
      unassigned: "Unassigned",
      empty: "No active bookings logged in SQLite database yet.",
      details: {
        intakeDetails: "Intake Details",
        contactEmail: "Contact Email",
        serviceLocation: "Service Location",
        intakeSchema: "Intake Schema Variables",
        generateQuote: "Generate Bespoke Quote",
        priceLabel: "Price (CHF)",
        validityLabel: "Validity (Days)",
        notesLabel: "Operator Notes / Scope Detail",
        sendingQuote: "Sending Quote...",
        sendQuoteCta: "Send Quote to Client",
        activeQuote: "Active Quote Details",
        totalPrice: "Total Price:",
        depositLabel: "30% Deposit:",
        gdprCta: "Permanent GDPR Deletion",
        placeholder: "Select a booking from the list to inspect client intake forms and perform dispatches."
      }
    }
  },
  de: {
    dashboard: {
      operationsHub: "Betriebszentrum",
      systemOverview: "Systemübersicht",
      activeBookings: "Aktive Buchungen",
      pendingDispatches: "Ausstehende Dispatcher-Zuweisungen",
      revenueMtd: "Umsatz MTD",
      fromCompletedDeposits: "Aus abgeschlossenen Anzahlungen",
      totalBookings: "Buchungen Gesamt",
      allLoggedBookings: "Alle protokollierten Buchungen",
      avgRating: "Durchschn. Bewertung",
      satisfactionIndex: "Kundenzufriedenheitsindex",
      noticeTitle: "Rollenbasierter Zugriff & Dispatcher-Steuerung",
      noticeText: "Wählen Sie im Seitenleistenmenü **Buchungen & Dispatch**, um Kundenformulare einzusehen, Aufträge an lokale Subunternehmerpartner neu zuzuweisen, Stornierungen zu bearbeiten oder DSGVO-konforme Datenlöschungen durchzuführen."
    },
    bookings: {
      activeDispatch: "Aktiver Dispatch",
      dashboardTitle: "Buchungs-Dashboard",
      loading: "Lade Zuweisungen aus SQLite...",
      teamUpdated: "Subunternehmer-Team erfolgreich aktualisiert",
      statusUpdated: "Buchungsstatus erfolgreich aktualisiert",
      gdprSuccess: "DSGVO-Löschung abgeschlossen für {email}",
      gdprError: "DSGVO-Löschung fehlgeschlagen",
      invalidPrice: "Bitte geben Sie einen gültigen Preis größer als 0 ein",
      invalidValidity: "Bitte geben Sie ein gültiges Gültigkeitsfenster ein",
      quoteCreated: "Angebot erfolgreich erstellt und an den Kunden gesendet.",
      quoteError: "Angebotserstellung fehlgeschlagen",
      gdprConfirm: "WARNUNG: DSGVO-Anfrage. Dies wird alle Protokolle, Bewertungen, Zahlungen und Buchungen im Zusammenhang mit der E-Mail des Kunden dauerhaft löschen: {email}. Sind Sie absolut sicher?",
      listTitle: "Aktive Buchungsliste ({count})",
      table: {
        date: "Servicedatum",
        customer: "Kunde",
        details: "Servicedetails",
        partner: "Partner zugewiesen",
        status: "Status",
        inspect: "Prüfen"
      },
      unassigned: "Nicht zugewiesen",
      empty: "Noch keine aktiven Buchungen in der SQLite-Datenbank protokolliert.",
      details: {
        intakeDetails: "Zuweisungsdetails",
        contactEmail: "Kontakt-E-Mail",
        serviceLocation: "Service-Standort",
        intakeSchema: "Zuweisungsschema-Variablen",
        generateQuote: "Maßgeschneidertes Angebot erstellen",
        priceLabel: "Preis (CHF)",
        validityLabel: "Gültigkeit (Tage)",
        notesLabel: "Bedienerhinweise / Leistungsumfang",
        sendingQuote: "Sende Angebot...",
        sendQuoteCta: "Angebot an den Kunden senden",
        activeQuote: "Aktive Angebotsdetails",
        totalPrice: "Gesamtpreis:",
        depositLabel: "30% Anzahlung:",
        gdprCta: "Dauerhafte DSGVO-Löschung",
        placeholder: "Wählen Sie eine Buchung aus der Liste aus, um Kundenformulare zu prüfen und Zuweisungen vorzunehmen."
      }
    }
  },
  fr: {
    dashboard: {
      operationsHub: "Centre d'opérations",
      systemOverview: "Aperçu du système",
      activeBookings: "Réservations actives",
      pendingDispatches: "Attributions de répartition en attente",
      revenueMtd: "Chiffre d'affaires MTD",
      fromCompletedDeposits: "Dépôts complétés",
      totalBookings: "Total des réservations",
      allLoggedBookings: "Toutes les réservations enregistrées",
      avgRating: "Note moyenne",
      satisfactionIndex: "Indice de satisfaction client",
      noticeTitle: "Accès basé sur les rôles et contrôle de répartition",
      noticeText: "Dans le menu latéral, sélectionnez **Réservations et Répartition** pour inspecter les formulaires des clients, réassigner des missions à des sous-traitants locaux, traiter les annulations ou exécuter des suppressions de données conformes au RGPD."
    },
    bookings: {
      activeDispatch: "Répartition active",
      dashboardTitle: "Tableau de bord des réservations",
      loading: "Chargement des répartitions depuis SQLite...",
      teamUpdated: "Équipe de sous-traitance mise à jour avec succès",
      statusUpdated: "Statut de la réservation mis à jour avec succès",
      gdprSuccess: "Suppression RGPD terminée pour {email}",
      gdprError: "Échec de l'exécution de la suppression RGPD",
      invalidPrice: "Veuillez entrer un prix valide supérieur à 0",
      invalidValidity: "Veuillez entrer une fenêtre de validité valide",
      quoteCreated: "Devis créé et envoyé au client avec succès.",
      quoteError: "Échec de la création du devis",
      gdprConfirm: "AVERTISSEMENT : Demande RGPD. Cela supprimera définitivement tous les journaux, avis, paiements et réservations associés à l'adresse e-mail du client : {email}. Êtes-vous absolument sûr ?",
      listTitle: "Liste des réservations actives ({count})",
      table: {
        date: "Date de service",
        customer: "Client",
        details: "Détails du service",
        partner: "Partenaire assigné",
        status: "Statut",
        inspect: "Inspecter"
      },
      unassigned: "Non assigné",
      empty: "Aucune réservation active enregistrée dans la base de données SQLite pour le moment.",
      details: {
        intakeDetails: "Détails d'admission",
        contactEmail: "E-mail de contact",
        serviceLocation: "Lieu de service",
        intakeSchema: "Variables du schéma d'admission",
        generateQuote: "Générer un devis sur mesure",
        priceLabel: "Prix (CHF)",
        validityLabel: "Validité (jours)",
        notesLabel: "Notes de l'opérateur / Détail de la portée",
        sendingQuote: "Envoi du devis...",
        sendQuoteCta: "Envoyer le devis au client",
        activeQuote: "Détails du devis actif",
        totalPrice: "Prix total :",
        depositLabel: "Acompte de 30% :",
        gdprCta: "Suppression définitive RGPD",
        placeholder: "Sélectionnez une réservation dans la liste pour inspecter les formulaires des clients et effectuer les répartitions."
      }
    }
  },
  it: {
    dashboard: {
      operationsHub: "Centro Operativo",
      systemOverview: "Panoramica del sistema",
      activeBookings: "Prenotazioni attive",
      pendingDispatches: "Assegnazioni di spedizione in sospeso",
      revenueMtd: "Ricavi MTD",
      fromCompletedDeposits: "Dai depositi completati",
      totalBookings: "Prenotazioni totali",
      allLoggedBookings: "Tutte le prenotazioni registrate",
      avgRating: "Valutazione media",
      satisfactionIndex: "Indice di soddisfazione del cliente",
      noticeTitle: "Accesso basato sui ruoli e controllo del dispatcher",
      noticeText: "Dal menu laterale, seleziona **Prenotazioni e Spedizione** per ispezionare i moduli dei clienti, riassegnare le spedizioni ai partner subappaltatori locali, elaborare le cancellazioni o eseguire eliminazioni di dati conformi al GDPR."
    },
    bookings: {
      activeDispatch: "Spedizione attiva",
      dashboardTitle: "Tabella di controllo delle prenotazioni",
      loading: "Caricamento delle spedizioni da SQLite...",
      teamUpdated: "Team del subappaltatore aggiornato con successo",
      statusUpdated: "Stato della prenotazione aggiornato con successo",
      gdprSuccess: "Eliminazione GDPR completata per {email}",
      gdprError: "Impossibile eseguire l'eliminazione GDPR",
      invalidPrice: "Inserisci un prezzo valido maggiore di 0",
      invalidValidity: "Inserisci una finestra di validità valida",
      quoteCreated: "Preventivo creato e inviato con successo al cliente.",
      quoteError: "Impossibile creare il preventivo",
      gdprConfirm: "ATTENZIONE: Richiesta GDPR. Questa operazione eliminerà permanentemente tutti i log, le recensioni, i pagamenti e le prenotazioni associati all'email del cliente: {email}. Sei assolutamente sicuro?",
      listTitle: "Elenco delle prenotazioni attive ({count})",
      table: {
        date: "Data del servizio",
        customer: "Cliente",
        details: "Dettagli del servizio",
        partner: "Partner assegnato",
        status: "Stato",
        inspect: "Ispeziona"
      },
      unassigned: "Non assegnato",
      empty: "Nessuna prenotazione attiva ancora registrata nel database SQLite.",
      details: {
        intakeDetails: "Dettagli di registrazione",
        contactEmail: "Email di contatto",
        serviceLocation: "Luogo del servizio",
        intakeSchema: "Variabili dello schema di registrazione",
        generateQuote: "Genera preventivo su misura",
        priceLabel: "Prezzo (CHF)",
        validityLabel: "Validità (giorni)",
        notesLabel: "Note dell'operatore / Dettaglio dell'ambito",
        sendingQuote: "Invio del preventivo...",
        sendQuoteCta: "Invia il preventivo al cliente",
        activeQuote: "Dettagli del preventivo attivo",
        totalPrice: "Prezzo totale:",
        depositLabel: "Deposito del 30%:",
        gdprCta: "Eliminazione permanente GDPR",
        placeholder: "Seleziona una prenotazione dall'elenco per ispezionare i moduli dei clienti ed eseguire le spedizioni."
      }
    }
  },
  es: {
    dashboard: {
      operationsHub: "Centro de operaciones",
      systemOverview: "Resumen del sistema",
      activeBookings: "Reservas activas",
      pendingDispatches: "Asignaciones de despacho pendientes",
      revenueMtd: "Ingresos MTD",
      fromCompletedDeposits: "De depósitos completados",
      totalBookings: "Reservas totales",
      allLoggedBookings: "Todas las reservas registradas",
      avgRating: "Calificación media",
      satisfactionIndex: "Índice de satisfacción del cliente",
      noticeTitle: "Acceso basado en roles y control de despachador",
      noticeText: "Desde el menú lateral, seleccione **Reservas y despacho** para inspeccionar los formularios de los clientes, reasignar despachos a socios subcontratistas locales, procesar cancelaciones o ejecutar eliminaciones de datos de acuerdo con el RGPD."
    },
    bookings: {
      activeDispatch: "Despacho activo",
      dashboardTitle: "Tablero de reservas",
      loading: "Cargando despachos desde SQLite...",
      teamUpdated: "Equipo de subcontratista actualizado con éxito",
      statusUpdated: "Estado de la reserva actualizado con éxito",
      gdprSuccess: "Eliminación de datos del RGPD completa para {email}",
      gdprError: "Error al ejecutar la eliminación del RGPD",
      invalidPrice: "Por favor, introduzca un precio válido mayor que 0",
      invalidValidity: "Por favor, introduzca una ventana de validez válida",
      quoteCreated: "Cotización creada y enviada al cliente con éxito.",
      quoteError: "Error al crear la cotización",
      gdprConfirm: "ADVERTENCIA: Solicitud de RGPD. Esto eliminará permanentemente todos los registros, opiniones, pagos y reservas asociados con el correo electrónico del cliente: {email}. ¿Está absolutamente seguro?",
      listTitle: "Lista de reservas activas ({count})",
      table: {
        date: "Fecha del servicio",
        customer: "Cliente",
        details: "Detalles del servicio",
        partner: "Socio asignado",
        status: "Estado",
        inspect: "Inspeccionar"
      },
      unassigned: "Sin asignar",
      empty: "Aún no hay reservas activas registradas en la base de datos SQLite.",
      details: {
        intakeDetails: "Detalles del formulario",
        contactEmail: "Correo electrónico de contacto",
        serviceLocation: "Ubicación del servicio",
        intakeSchema: "Variables del esquema del formulario",
        generateQuote: "Generar cotización a medida",
        priceLabel: "Precio (CHF)",
        validityLabel: "Validez (días)",
        notesLabel: "Notas del operador / Detalles del alcance",
        sendingQuote: "Enviando cotización...",
        sendQuoteCta: "Enviar cotización al cliente",
        activeQuote: "Detalles de la cotización activa",
        totalPrice: "Precio total:",
        depositLabel: "Depósito del 30%:",
        gdprCta: "Eliminación permanente de datos del RGPD",
        placeholder: "Seleccione una reserva de la lista para inspeccionar los formularios de los clientes y realizar los despachos."
      }
    }
  },
  pt: {
    dashboard: {
      operationsHub: "Centro de Operações",
      systemOverview: "Visão Geral do Sistema",
      activeBookings: "Reservas Ativas",
      pendingDispatches: "Zelos de despacho pendentes",
      revenueMtd: "Receita MTD",
      fromCompletedDeposits: "De depósitos efetuados",
      totalBookings: "Total de Reservas",
      allLoggedBookings: "Todas as reservas registadas",
      avgRating: "Avaliação Média",
      satisfactionIndex: "Índice de satisfação do cliente",
      noticeTitle: "Controlo de Despachador & Acesso Baseado em Funções",
      noticeText: "No menu lateral, selecione **Reservas e Despacho** para inspecionar os formulários de entrada de clientes, reatribuir despachos a parceiros subcontratados locais, processar cancelamentos ou executar eliminações de dados em conformidade com o RGPD."
    },
    bookings: {
      activeDispatch: "Despacho Ativo",
      dashboardTitle: "Painel de Reservas",
      loading: "A carregar despachos do SQLite...",
      teamUpdated: "Equipa de subcontratação atualizada com sucesso",
      statusUpdated: "Estado da reserva atualizado com sucesso",
      gdprSuccess: "Eliminação RGPD concluída para {email}",
      gdprError: "Falha ao executar a eliminação RGPD",
      invalidPrice: "Por favor, insira um preço válido maior que 0",
      invalidValidity: "Por favor, insira uma janela de validade válida",
      quoteCreated: "Orçamento criado e enviado com sucesso ao cliente.",
      quoteError: "Falha ao criar o orçamento",
      gdprConfirm: "AVISO: Pedido RGPD. Isto irá eliminar permanentemente todos os registos, avaliações, pagamentos e reservas associados ao email do cliente: {email}. Tem a certeza absoluta?",
      listTitle: "Lista de Reservas Ativas ({count})",
      table: {
        date: "Data do Serviço",
        customer: "Cliente",
        details: "Detalhes do Serviço",
        partner: "Parceiro Atribuído",
        status: "Estado",
        inspect: "Inspecionar"
      },
      unassigned: "Não atribuído",
      empty: "Nenhuma reserva ativa registada na base de dados SQLite ainda.",
      details: {
        intakeDetails: "Detalhes de Entrada",
        contactEmail: "Email de Contacto",
        serviceLocation: "Localização do Serviço",
        intakeSchema: "Variáveis do Esquema de Entrada",
        generateQuote: "Gerar Orçamento Personalizado",
        priceLabel: "Preço (CHF)",
        validityLabel: "Validade (Dias)",
        notesLabel: "Notas do Operador / Detalhes de Escopo",
        sendingQuote: "A enviar orçamento...",
        sendQuoteCta: "Enviar Orçamento ao Cliente",
        activeQuote: "Detalhes do Orçamento Ativo",
        totalPrice: "Preço Total:",
        depositLabel: "Depósito de 30%:",
        gdprCta: "Eliminação Permanente RGPD",
        placeholder: "Selecione uma reserva da lista para inspecionar os formulários de entrada de clientes e realizar despachos."
      }
    }
  },
  rm: {
    dashboard: {
      operationsHub: "Center d'operaziuns",
      systemOverview: "Survista dal sistem",
      activeBookings: "Reservaziuns activas",
      pendingDispatches: "Attribuiziuns da spediziun pendentas",
      revenueMtd: "Entradas MTD",
      fromCompletedDeposits: "Ord deposits cumplets",
      totalBookings: "Total reservaziuns",
      allLoggedBookings: "Tutas las reservaziuns registradas",
      avgRating: "Valitaziun media",
      satisfactionIndex: "Index da satisfacziun dals clients",
      noticeTitle: "Access basà sin rolas & controlla da spediziun",
      noticeText: "Elegia en il menu da la vart **Reservaziuns e Spediziun** per consultar ils formulars da clients, reattribuir ordinaziuns a partenaris subinterprendiders locals, processar stornaments u far stangantadas da datas confurmas a la DSGVO."
    },
    bookings: {
      activeDispatch: "Spediziun activa",
      dashboardTitle: "Tabella da reservaziuns",
      loading: "Chargiar las spediziuns ord SQLite...",
      teamUpdated: "Squadra da subinterprendiders actualisada cun success",
      statusUpdated: "Status da reservaziun actualisà cun success",
      gdprSuccess: "Stangantada DSGVO finida per {email}",
      gdprError: "Errur durant la stangantada DSGVO",
      invalidPrice: "Inseresch in prezi valid pli grond che 0",
      invalidValidity: "Inseresch ina fanestra da validitad valida",
      quoteCreated: "Offerta creada e tarmessa al client cun success.",
      quoteError: "Errur durant la creaziun da l'offerta",
      gdprConfirm: "AVIS: Dumanda da DSGVO. Quai stizza definitivamain tuts logs, recensiuns, pajaments e reservaziuns colliadas cun l'email dal client: {email}. Sast segir da quai?",
      listTitle: "Lista da reservaziuns activas ({count})",
      table: {
        date: "Data dal servetsch",
        customer: "Client",
        details: "Detagls dal servetsch",
        partner: "Partenari attribuì",
        status: "Status",
        inspect: "Examinar"
      },
      unassigned: "Betg attribuì",
      empty: "Anc naginas reservaziuns activas registradas en la banca da datas SQLite.",
      details: {
        intakeDetails: "Detagls dal formular",
        contactEmail: "E-mail da contact",
        serviceLocation: "Lieu dal servetsch",
        intakeSchema: "Variablas dal schema d'admissiun",
        generateQuote: "Crear offerta persunaliseda",
        priceLabel: "Prezi (CHF)",
        validityLabel: "Validitad (dis)",
        notesLabel: "Notas da l'operatur / Detagls da la lavur",
        sendingQuote: "Tarmetter l'offerta...",
        sendQuoteCta: "Tarmetter offerta al client",
        activeQuote: "Detagls da l'offerta activa",
        totalPrice: "Prezi total:",
        depositLabel: "Deposit da 30%:",
        gdprCta: "Stizza definitiva DSGVO",
        placeholder: "Elegia ina reservaziun ord la lista per specular ils formulars da clients e coordinar las spediziuns."
      }
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
    dashboard: keyValues.dashboard,
    bookings: keyValues.bookings
  };
  
  fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
}
console.log('Merge complete!');
