# Origen

A private, astrology-forward web app. People submit a small ancestor intake
(self → parents → grandparents); **Teresa researches the line by hand, offline**;
her findings are published on the site for the requester and the relatives they
invite to read. Every person with a full birth date gets a **birth report**
(Western tropical natal chart + written reading), and any two charts can be
compared (synastry).

Origen is deliberately *not* a tree database: it never searches archives or
matches records automatically. English and Spanish from day one. No billing in v1.

## Run it locally

Requires Node 20.9+ (developed on Node 22).

```bash
npm install
cp .env.example .env.local
npm run db:seed
npm run dev
```

Open http://localhost:3000. The SQLite database and its tables are created
automatically on first run (`data/origen.db`).

### Demo logins

The home page and the sign-in page show two one-click buttons: **Enter as a
requester** and **Enter as Teresa** (admin). They are always available under
`npm run dev`, even without an `.env.local` file or running the seed. In
production they only appear when `DEMO_LOGIN=true`. The seeded accounts can also be used
with a password:

| Role | Email | Password |
|---|---|---|
| Admin (Teresa) | `teresa@origen.local` | `origen-demo` |
| Requester with a published request | `demo@origen.local` | `origen-demo` |
| Requester with a submitted request | `mateo@origen.local` | `origen-demo` |

A sample read-only invite link is seeded at `/en/read/demo-invite-ferrer-vidal`.
The sample families are invented.

**Before deploying anywhere public:** set `DEMO_LOGIN=false`, set a real
`AUTH_SECRET`, and do not run the seed (or change the seeded passwords).

## Environment variables

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Secret Auth.js uses to sign sessions. Generate with `npx auth secret`. |
| `ADMIN_EMAIL` | The account with this email is the admin. Default `teresa@origen.local`. |
| `DATABASE_URL` | Path of the SQLite file. Default `./data/origen.db`. |
| `DEMO_LOGIN` | Demo sign-in buttons. On in development unless `false`; off in production unless `true`. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run db:seed` | Create admin, demo users and sample requests (idempotent) |
| `npm run db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `npm run build:cities` | Rebuild the offline place list (`data/cities.tsv.gz`) |
| `npm run lint` | ESLint |

## What is in v1

- **Landing** with the live sky as its main visual, EN/ES switch everywhere.
- **Light and dark themes**: cream and black, or warm black with vermilion,
  ochre and verdigris accents. The site
  follows the system setting until the visitor uses the switch in the header.
- **Accounts**: email + password (Auth.js credentials), plus demo sign-in.
- **Intake wizard**: you → parents → grandparents → review. Save as draft or
  submit. Names are required for the requester and both parents; unknown
  grandparents can be left blank.
- **Statuses**: draft → submitted → in research → published.
- **Research desk** (admin): request queue, status changes, add/edit/remove
  ancestors found during research, write findings in Markdown with preview,
  save drafts, publish.
- **Requester view**: findings, the family tree, and a gallery of birth reports.
- **Family tree**: a star chart that unveils in stages. Each person carries their
  Sun sign, the outer band is the zodiac with every Sun marked on it, and people
  who share a sign are joined by a thread. Hovering lights a person's line back
  to the requester; selecting them opens a card beside the tree.
- **Original documents**: the researcher can attach PDFs (up to 10 MB) or links
  to a person from that person's edit page. They appear on the person's card
  and birth report. Uploaded files live in `data/uploads/` and are only served
  to the request's owner, the researcher, and invited readers (never for living
  relatives).
- **Invite-to-read links**: read-only, revocable. Guests only see published
  findings; living relatives appear by relationship only and their reports are
  not reachable.
- **Birth reports**: wheel, Sun/Moon/Rising, written reading, placements,
  element and modality balance, aspects, and navigation through the family.
- **Synastry** between any two people with charts.
- **Privacy page**: GDPR-style placeholder copy.

### How charts are computed

- Western tropical zodiac, geocentric positions, computed locally with
  [`astronomy-engine`](https://github.com/cosinekitty/astronomy). No external API.
- **Birth hour unknown** (the usual case for ancestors): the chart is cast for
  noon. Planets are shown by sign; any body that changed sign that day is
  flagged with both possibilities; the Moon's range for the day is drawn on the
  wheel and the Moon is left out of aspects. No Ascendant or houses are shown.
- **Birth hour + located birthplace**: Ascendant, Midheaven and whole-sign houses.
- Birthplaces are located with a bundled offline list of ~170,000 towns
  (GeoNames-derived), so place names never leave the server. Time zones come
  from `tz-lookup`; before standard time, local mean time at the birthplace is used.
- Charts need a full date (day, month, year) from 1600 onwards. Dates are read
  in the Gregorian calendar.
- Reading texts are editable templates in `src/lib/astro/readings.ts` (EN + ES).

## Project layout

```
messages/            UI strings (en.json, es.json)
drizzle/             SQL migrations (applied automatically at startup)
data/cities.tsv.gz   offline place list
scripts/             seed + place-list builder
src/app/[locale]/    pages (landing, auth, dashboard, requests, admin, read)
src/app/actions.ts   all server actions (auth, intake, people, publishing, invites)
src/components/      Wheel, BirthReport, SynastryView, Tree, IntakeWizard, …
src/db/              Drizzle schema + connection
src/lib/astro/       chart maths, glyphs, reading templates
src/lib/             access rules, people helpers, place search, seed data
```

Data model (kept small on purpose): `users`, `requests`, `people`,
`publications`, `invites`, `documents`. A person's place in the tree is a single `path`
string from the requester (`""` self, `"f"` father, `"fm"` father's mother, …).

## Moving to Postgres

The schema only uses portable column types. Swap the driver in
`src/db/index.ts` to `drizzle-orm/node-postgres`, change the table helpers in
`src/db/schema.ts` from `sqlite-core` to `pg-core`, set `dialect: "postgresql"`
in `drizzle.config.ts` and regenerate migrations.

## Not in v1

- Email notification when findings are published
- Billing
- Placidus or other house systems; Vedic, Chinese or Hellenistic techniques
- Final legal/privacy copy
- Password reset
