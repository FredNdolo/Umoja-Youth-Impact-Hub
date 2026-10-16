# Umoja Youth Impact Hub (UYIH) Website

Official website of **Umoja Youth Impact Hub**, a youth-led community-based organisation in Narok, Kenya, working on girls' health, environmental action and youth empowerment.

Live site: https://umoja-youth-impact-hub.vercel.app/

## Tech stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router 7](https://reactrouter.com/)
- [Supabase](https://supabase.com/) (database, logins, file storage)
- [Leaflet](https://leafletjs.com/) maps for the Tree Monitor
- [Tailwind CSS 3](https://tailwindcss.com/) (theme colours and fonts live in `tailwind.config.js`)
- [Framer Motion](https://www.framer.com/motion/)
- Hosted on [Vercel](https://vercel.com/), which builds the site itself on every push to `main`

## Run it locally

Requires Node.js 18 or newer.

```bash
git clone https://github.com/FredNdolo/Umoja-Youth-Impact-Hub.git
cd Umoja-Youth-Impact-Hub
npm install
npm run dev       # local development server
npm run build     # production build into dist/ (do not commit dist/)
npm run lint      # check the code for mistakes before opening a pull request
```

## Project layout

```
src/
  pages/         Public pages: Home, About, Programs, Green Futures, Tree Monitor (/treemonitoringapp),
                 public tree pages (/t/:code), Contacts, Join, Donate, Privacy, RequestDocument, Certificate
  member/        Member area at /me: login, profile, learning (online courses), tasks, achievements, documents
  trees/         Tree Monitor field app at /me/trees (maps, geofences, offline queue, reports, QR labels)
  components/    Navbar, Footer, SkillPicker, PaybillCard, InstagramFeed
  admin/         Admin dashboard at /admin: People, Tasks, Events, Messages, Payments, Certificates, Metrics
  lib/           Site settings (config.js), Supabase client, public form client, skills, phone helpers
  assets/        Photos (WebP) and logo, imported by the pages
public/
  docs/          Constitution and safeguarding policy PDFs (members download these)
  favicon.png, apple-touch-icon.png, og-image.jpg, tree-app-*.png (app icons)
supabase/
  migrations/    Database scripts (run in order)
  functions/     Edge Functions (member-login-link)
docs/
  PHASE1_SETUP.md   One-time Supabase setup and day-to-day admin guide
  PHASE2A_SETUP.md  Member logins, profiles, tasks, payments, certificates and the Tree Monitor
```

## Membership pipeline

The Join page (`/join`) feeds a Supabase database that the admin works from at
`/admin`: Newcomer → Volunteer (90-day trial) → Member → Lead, with WhatsApp
as the main channel. Setup steps are in [`docs/PHASE1_SETUP.md`](docs/PHASE1_SETUP.md).

Settings such as the WhatsApp community link, follow-up number and consent
version live in `src/lib/config.js`. Bump `CONSENT_VERSION` whenever the consent
wording or privacy notice changes.

## Working together on this repo

- Work on a branch and open a pull request instead of pushing straight to `main`. Vercel gives every pull request its own preview link to check before merging.
- Never commit `dist/`, `node_modules/` or `.env` files; `.gitignore` already excludes them.
- This repository is public. Don't commit internal documents (proposals, budgets, member lists) or anything with personal data.
- Keep photos small. Resize to at most 1600 px wide and save as WebP before adding them to `src/assets/`; camera originals are 7 to 8 MB each and make pages very slow on mobile data.
- Only use photos of identifiable children where consent has been given, in line with UYIH's safeguarding policy.
