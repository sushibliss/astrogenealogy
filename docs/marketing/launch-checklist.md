# Launch checklist

What is already built, and what only you can do. Work through it top to bottom.

## Before the site goes public

- [ ] **Decide the domain** and set `SITE_URL` (see `.env.example`). Until it is set, the sitemap, the share previews and the links between the English and Spanish pages point at `localhost`.
- [ ] **Complete the privacy page**: put the operator's legal name, address and contact email in `content/pages/en/privacy.md` and `content/pages/es/privacy.md`, have a lawyer read both, then remove the "Draft" notice (`privacyDraft` in `messages/*.json` and the line that shows it in `src/app/[locale]/privacy/page.tsx`).
- [ ] **Read the four guides** in `content/guides/`. The two genealogy ones state facts about Spanish archives; correct anything that does not match your experience.
- [ ] **Rewrite "Who does the research"** on the front page in your own words (`teresaBody` in `messages/*.json`). A photo and two lines about your background would convert better than any other change on the page.
- [ ] **Check the promises** in `content/pages/*/faq.md` and `how-it-works.md`: free during the first version, submitted requests finished at no charge, deletion on request, and "strongest in Spain and Spanish-speaking countries".
- [ ] Set `DEMO_LOGIN=false` and a real `AUTH_SECRET` (already in the README).

## Getting found on Google

- [ ] Open [Google Search Console](https://search.google.com/search-console), add the domain and verify it.
- [ ] Submit `https://YOUR-DOMAIN/sitemap.xml` there.
- [ ] Ask for indexing of the front page, `/en/chart` and `/es/chart` by hand; the rest follow.
- [ ] Do the same in Bing Webmaster Tools (it can import from Search Console).
- [ ] Add one guide a month. Each one is a new way to be found. Copy an existing file in `content/guides/en/` and its partner in `es/`, keep the same `key` in both.

Ideas for the next guides, by search demand:
1. Birth chart of a grandparent: what to ask your family before it is too late
2. How to find an ancestor's baptism record in Spain (one per region works well)
3. What the Moon sign says about a mother or grandmother
4. Spanish surnames: what the two-surname system tells a genealogist
5. How to request a Spanish birth certificate online, step by step
6. Family patterns in birth charts: do signs repeat across generations?

## Measurement

- [ ] Create a Google Analytics 4 property and put its ID (`G-…`) in `GA_ID`.
- [ ] In Analytics, mark these events as key events: `sign_up`, `request_submitted`, `chart_generated`, `newsletter_signup`.
- [ ] Check the banner: open the site in a private window, accept, and confirm the visit appears in Analytics' realtime view.

Nothing is loaded before the visitor accepts, and nothing is ever loaded on requests, reader links, birth reports or the research desk.

## Advertising

- [ ] Create a Google Ads account, link it to Analytics, and import `request_submitted` and `sign_up` as conversions. Put the Ads ID (`AW-…`) in `GOOGLE_ADS_ID`.
- [ ] Create a Meta Business account and a pixel if you want Instagram or Facebook ads. Put the pixel ID in `META_PIXEL_ID`.
- [ ] Use the texts in [`ad-copy.md`](ad-copy.md). Start small and with one country.

Suggested start: one Google Search campaign in Spanish, Spain only, around 5 to 10 euros a day, sending people to the free chart page. Run it for three weeks before judging it. The number to watch is the cost of one submitted request, not the cost of a click.

## The email list

- [ ] Sign-ups are stored in the site's own database. The count and a CSV download are at the bottom of the research desk.
- [ ] The site does not send email. Import the CSV into a mailing tool (Buttondown, Mailchimp, Brevo) to send the monthly letter, and include the unsubscribe link for each person: `https://YOUR-DOMAIN/en/unsubscribe/TOKEN` (the token is a column in the CSV).

## After the first clients

- [ ] Ask each one for two sentences and permission to quote them. Add them to `src/lib/testimonials.ts`; the section appears on the front page by itself.
- [ ] Ask them to share their reader link with family. Every invited relative is a likely next client.
- [ ] When prices are decided, put them in `content/pages/*/how-it-works.md` and `faq.md`, and update `ctaNote` and `serviceOffer` in `messages/*.json`.
