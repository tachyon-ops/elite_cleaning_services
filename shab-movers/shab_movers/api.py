"""
Consumable JSON API for Mondar (or anything else).

    uvicorn shab_movers.api:app --port 8080

GET /movers?start=2026-09-01&end=2026-09-03&cantons=ZH,AG&key=...
    -> [{publication_id, publication_date, canton, uid, company, ...}, ...]

Results are cached per (start,end,cantons) so repeated calls don't hammer
shab.ch. For production put the daily pull into a cron job that writes to
a small SQLite/Postgres table and serve from that instead of calling
fetch_movers() on request; the response shape stays identical.
"""
from __future__ import annotations

import dataclasses
import datetime as dt
import os
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query

from .core import fetch_movers

app = FastAPI(title="SHAB movers", version="0.1")
API_KEY = os.environ.get("MOVERS_API_KEY", "")


@lru_cache(maxsize=256)
def _cached(start: dt.date, end: dt.date, cantons: tuple[str, ...]):
    return [dataclasses.asdict(l) for l in fetch_movers(start, end, cantons)]


@app.get("/movers")
def movers(
    start: dt.date = Query(default=None),
    end: dt.date = Query(default=None),
    cantons: str = "ZH",
    key: str = "",
):
    if API_KEY and key != API_KEY:
        raise HTTPException(401, "bad key")
    end = end or dt.date.today()
    start = start or end - dt.timedelta(days=1)
    if (end - start).days > 31:
        raise HTTPException(400, "max 31-day window")
    return _cached(start, end, tuple(c.strip().upper() for c in cantons.split(",")))


@app.get("/health")
def health():
    return {"ok": True}
