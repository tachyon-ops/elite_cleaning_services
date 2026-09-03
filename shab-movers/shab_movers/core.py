"""
shab_movers.core — pull commercial-register mutations from shab.ch and
extract firms that changed seat (Sitz) or domicile address (Domizil).

Public interface:
    fetch_movers(start, end, cantons=("ZH",)) -> list[Lead]

Everything else is an implementation detail. Sinks (sheets, api) only
depend on Lead and fetch_movers.

NOTE on the upstream API: the list endpoint and its query parameters
below are the ones the shab.ch front end uses (amtsblattportal). The
per-publication endpoints /publications/{id}/xml and /pdf are confirmed
public. If the list call 400s, open shab.ch, run a search with the
browser devtools open, and copy the exact query string into
_list_params(). That is the only function that should need touching.
"""
from __future__ import annotations

import dataclasses
import datetime as dt
import html
import re
import time
import xml.etree.ElementTree as ET
from typing import Iterable, Iterator

import requests

BASE = "https://shab.ch/api/v1"
UA = "shab-movers/0.1 (+contact: you@example.ch)"
TIMEOUT = 30

# Sub-rubric codes used by the portal for Handelsregister:
#   HR01 Neueintragung, HR02 Mutation, HR03 Löschung
SUBRUBRIC_MUTATION = "HR02"

# Phrases that mark a seat/address change in the publication text.
# German / French / Italian variants as they appear in SHAB texts.
_MOVE_PATTERNS = [
    # Sitz neu: Dietikon.  /  Sitz neu: Zürich (bisher: Dietikon)
    r"Sitz\s+neu\s*:\s*(?P<seat>[^.;\n]+)",
    r"Nouveau\s+si[eè]ge\s*:\s*(?P<seat>[^.;\n]+)",
    r"Nuova\s+sede\s*:\s*(?P<seat>[^.;\n]+)",
    # Domizil neu: Bahnhofstrasse 1, 8001 Zürich.
    r"Domizil\s+neu\s*:\s*(?P<addr>[^.;\n]+(?:\.\s*\d{4}[^.;\n]*)?)",
    r"Nouvelle\s+adresse\s*:\s*(?P<addr>[^;\n]+)",
    r"Nuovo\s+domicilio\s*:\s*(?P<addr>[^;\n]+)",
    # Adresse neu: ...  (some cantons)
    r"Adresse\s+neu\s*:\s*(?P<addr>[^;\n]+)",
]
_MOVE_RE = [re.compile(p, re.IGNORECASE) for p in _MOVE_PATTERNS]
_OLD_RE = re.compile(r"\((?:bisher|jusqu'ici|finora)\s*:\s*([^)]+)\)", re.I)
_UID_RE = re.compile(r"CHE-\d{3}\.\d{3}\.\d{3}")
_TAG_RE = re.compile(r"<[^>]+>")


@dataclasses.dataclass(frozen=True)
class Lead:
    publication_id: str
    publication_date: str        # YYYY-MM-DD
    canton: str
    uid: str                     # CHE-xxx.xxx.xxx or ""
    company: str
    legal_form: str
    change_type: str             # "seat" | "domicile" | "seat+domicile"
    new_seat: str                # municipality, if seat changed
    new_address: str             # street/zip/town, if given
    old_value: str               # "(bisher: ...)" content if present
    purpose: str                 # Zweck, useful for segmenting
    source_url: str

    def as_row(self) -> list[str]:
        return [getattr(self, f.name) for f in dataclasses.fields(self)]

    @staticmethod
    def header() -> list[str]:
        return [f.name for f in dataclasses.fields(Lead)]


# --------------------------------------------------------------------- HTTP

_session = requests.Session()
_session.headers["User-Agent"] = UA


def _get(url: str, **kw) -> requests.Response:
    for attempt in range(4):
        r = _session.get(url, timeout=TIMEOUT, **kw)
        if r.status_code in (429, 502, 503, 504):
            time.sleep(2 ** attempt)
            continue
        r.raise_for_status()
        return r
    r.raise_for_status()
    return r


def _list_params(start: dt.date, end: dt.date, cantons: Iterable[str], page: int) -> dict:
    """Query string for the publication list. Adjust here if the portal changes."""
    return {
        "allowRubricSelection": "true",
        "includeContent": "false",
        "pageRequest.page": page,
        "pageRequest.size": 200,
        "publicationDate.start": start.isoformat(),
        "publicationDate.end": end.isoformat(),
        "publicationStates": "PUBLISHED",
        "rubrics": "HR",
        "subRubrics": SUBRUBRIC_MUTATION,
        "cantons": ",".join(cantons),
    }


def _iter_publication_ids(start: dt.date, end: dt.date, cantons: Iterable[str]) -> Iterator[str]:
    page = 0
    while True:
        data = _get(f"{BASE}/publications", params=_list_params(start, end, cantons, page)).json()
        items = data.get("content") or data.get("publications") or []
        if not items:
            return
        for it in items:
            meta = it.get("meta", it)
            yield meta["id"]
        total_pages = data.get("totalPages") or (data.get("page") or {}).get("totalPages")
        page += 1
        if total_pages is not None and page >= total_pages:
            return


def _fetch_xml(pub_id: str) -> ET.Element:
    return ET.fromstring(_get(f"{BASE}/publications/{pub_id}/xml").content)


# ------------------------------------------------------------------ parsing

def _text(el: ET.Element | None, path: str) -> str:
    if el is None:
        return ""
    found = el.find(path)
    return (found.text or "").strip() if found is not None and found.text else ""


def _strip_html(s: str) -> str:
    s = html.unescape(s)
    s = s.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    return _TAG_RE.sub("", s)


def _parse(pub_id: str, root: ET.Element) -> Lead | None:
    meta = root.find("meta")
    content = root.find("content")
    pub_date = _text(meta, "publicationDate")[:10]
    canton = _text(meta, "cantons")

    company = content.find("company") if content is not None else None
    name = _text(company, "name")
    uid = _text(company, "uid")
    legal_form = _text(company, "legalForm")
    purpose = _text(content, "purpose")

    body = _strip_html(_text(content, "publicationText") or _text(root, ".//publicationText"))
    if not uid:
        m = _UID_RE.search(body)
        uid = m.group(0) if m else ""

    new_seat = new_addr = ""
    for rx in _MOVE_RE:
        m = rx.search(body)
        if not m:
            continue
        g = m.groupdict()
        if g.get("seat") and not new_seat:
            new_seat = g["seat"].strip()
        if g.get("addr") and not new_addr:
            new_addr = g["addr"].strip().rstrip(".")
    if not (new_seat or new_addr):
        return None

    old = _OLD_RE.search(body)
    change = "seat+domicile" if (new_seat and new_addr) else ("seat" if new_seat else "domicile")
    return Lead(
        publication_id=pub_id,
        publication_date=pub_date,
        canton=canton,
        uid=uid,
        company=name,
        legal_form=legal_form,
        change_type=change,
        new_seat=new_seat,
        new_address=new_addr,
        old_value=old.group(1).strip() if old else "",
        purpose=purpose,
        source_url=f"https://shab.ch/#!/search/publications/detail/{pub_id}",
    )


# ------------------------------------------------------------------- public

def fetch_movers(start: dt.date, end: dt.date, cantons: Iterable[str] = ("ZH",)) -> list[Lead]:
    """All HR mutations in [start, end] for the given cantons that contain a
    seat or domicile change. Network-bound; ~1 request per publication."""
    leads: list[Lead] = []
    for pub_id in _iter_publication_ids(start, end, cantons):
        try:
            lead = _parse(pub_id, _fetch_xml(pub_id))
        except (requests.RequestException, ET.ParseError) as e:
            print(f"skip {pub_id}: {e}")
            continue
        if lead:
            leads.append(lead)
        time.sleep(0.2)  # be polite; ~100-300 ZH mutations/day
    return leads
