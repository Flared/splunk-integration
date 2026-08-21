# Change Log

## 1.0.1 – 2026‑08‑21

- Restore `passAuth` on save so the scheduled ingest job receives a Splunk session token.
- Update SSL handling for compatibility with current Splunk Python runtimes.

## 1.0.0 – 2026‑05‑28

- Added **tenant filter** support in the Search UI.
- Introduced **Application Logs** and **Dashboard Charts** tabs for richer visualisation of events.
- Added configuration options:
    - Ingestion interval selector.
    - “Ingest full event data” checkbox to toggle between metadata‑only and full payload.
- Implemented **dynamic links** from the result table to the corresponding Flare event in the Flare UI.
- Improved tenant extraction and filtering across search results and dashboards.
- Refreshed documentation to describe the new UI tabs and configuration options.
- Migrated workspace dependency management from Yarn to pnpm for improved performance and reliability.
