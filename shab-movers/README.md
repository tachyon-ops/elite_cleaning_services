# shab-movers

Daily extraction of Zürich companies that changed seat or address, from the
SHAB commercial-register publications, into a Google Sheet now and a JSON API
for Mondar.CH later.

## Layout
    shab_movers/core.py        fetch + parse  -> list[Lead]   (the only module that talks to shab.ch)
    shab_movers/sheets_sink.py Lead -> Google Sheet (idempotent)
    shab_movers/api.py         Lead -> JSON over HTTP (FastAPI)
    run_daily.py               cron entry point

## First run
    pip install -r requirements.txt
    export GOOGLE_SA_JSON=key.json SHEET_ID=1AbC...
    python run_daily.py 7        # backfill last 7 days, then run daily with no arg

## Cron (Mon-Sat 07:00, SHAB publishes on working days)
    0 7 * * 1-6  cd /opt/shab-movers && /usr/bin/python3 run_daily.py >> movers.log 2>&1

## API for Mondar
    export MOVERS_API_KEY=changeme
    uvicorn shab_movers.api:app --host 0.0.0.0 --port 8080
    curl "http://host:8080/movers?start=2026-09-01&end=2026-09-03&cantons=ZH&key=changeme"

## Known unknowns
* The list-endpoint query parameters in `core._list_params()` mirror the
  shab.ch front end but were written without a live call. If the first run
  returns 400 or zero pages, copy the query string from the browser
  devtools on shab.ch (Network tab, filter "publications") into that function.
  Everything downstream is unaffected.
* Regexes cover the standard DE/FR/IT phrasings ("Sitz neu:", "Domizil neu:",
  "Adresse neu:"). Check the first week's output against the sheet and add a
  pattern if a canton uses different wording.
* Only register-listed entities appear. Publication lags the physical move.
