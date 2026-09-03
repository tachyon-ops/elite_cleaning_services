#!/usr/bin/env python3
"""Daily job: yesterday's ZH movers -> Google Sheet.  cron: 0 7 * * 1-6"""
import datetime as dt
import sys

from shab_movers import fetch_movers
from shab_movers import sheets_sink

days_back = int(sys.argv[1]) if len(sys.argv) > 1 else 1
end = dt.date.today()
start = end - dt.timedelta(days=days_back)
leads = fetch_movers(start, end, cantons=("ZH",))
added = sheets_sink.write(leads)
print(f"{start}..{end}: {len(leads)} movers found, {added} new rows appended")
