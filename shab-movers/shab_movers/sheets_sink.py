"""
Append new leads to a Google Sheet, idempotent on publication_id.

Setup (one-off):
  1. Google Cloud console: create a service account, enable Sheets API,
     download the JSON key.
  2. Share the target sheet with the service-account e-mail (editor).
  3. export GOOGLE_SA_JSON=/path/key.json  SHEET_ID=<id from the sheet URL>
"""
from __future__ import annotations

import os

import gspread

from .core import Lead


def write(leads: list[Lead], worksheet: str = "movers") -> int:
    gc = gspread.service_account(filename=os.environ["GOOGLE_SA_JSON"])
    sh = gc.open_by_key(os.environ["SHEET_ID"])
    try:
        ws = sh.worksheet(worksheet)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(worksheet, rows=1000, cols=len(Lead.header()))
        ws.append_row(Lead.header())

    existing = set(ws.col_values(1)[1:])  # publication_id column, minus header
    rows = [l.as_row() for l in leads if l.publication_id not in existing]
    if rows:
        ws.append_rows(rows, value_input_option="RAW")
    return len(rows)
