# Seamwise HQ

Single-file daily command centre (`Seamwise_HQ.html`), published as a Claude artifact.
It uses the artifact runtime's `db`, `assets`, `downloads`, `mcp` (Gmail) and `sample` capabilities, so all data is
saved server-side automatically and survives page updates.

Tabs: Today, Tasks, **Leads**, Brand library, History.

## Leads
- Add leads (name, email, phone, company, industry, source, status, OK-to-email, notes).
- Click a lead to edit it; every change autosaves after a short pause and on close.
- **Download Excel**: `.xlsx` with one lead per row, ready to give to Claude for a bulk
  email send. Scopes: ready to email / current view / all. Afterwards, "Mark these as
  contacted" updates every exported lead.
- **Import**: one or more `.xlsx`/`.xls`/`.csv` files. Columns are matched by heading;
  leads with an existing email are merged (blanks filled, opt-outs respected), not duplicated.
- **Email drafts in Gmail**: one template with fill-ins (`{first_name}`, `{company}`…),
  optionally tailored per lead by Claude, becomes one Gmail draft per lead (nothing is sent).
  Up to 50 per run; a lead never gets the same draft twice in a day. The template autosaves.
- **Email trail** (in each lead): "Save emails from Gmail" stores every conversation with the
  lead's address under `leads/<id>/emails`; links to other emails can be added by hand.
- History tab: **Full backup (Excel)** with Leads, Tasks, History and Library sheets.

Excel files are built in the browser with SheetJS (`xlsx@0.18.5` from cdnjs), loaded on
first use. If it can't load, the leads export falls back to CSV.
