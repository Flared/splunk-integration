# Change Log

## 1.0.0 – 2026‑05‑28
- Added **tenant filter** support in the Search UI (verified with raw JSON).
- Introduced **Application Logs** and **Dashboard Charts** tabs for richer visualisation of events.
- Added configuration options:
  * Ingestion interval selector.
  * “Ingest full event data” checkbox to toggle between metadata‑only and full payload.
- Implemented **dynamic links** from the result table to the corresponding Flare event in the Flare UI.
- Updated `props.conf` and dashboard `search.xml` to extract and filter by tenant correctly.
- Added `flareio` SDK support to the app (removed need for `from __future__ import annotations`).
- Refreshed documentation in `README.md` to describe the new SDK version, new UI tabs, and configuration options.
