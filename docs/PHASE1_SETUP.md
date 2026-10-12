# Phase 1 setup: membership pipeline

One-time steps in the Supabase dashboard before the Join page, Contact form,
newsletter and admin dashboard work on the live site. About 10 minutes.

Supabase project: `https://kyrgwdvobbshsyofkjfu.supabase.co`

## 1. Create the database tables

1. Open the project in Supabase → **SQL Editor** → **New query**.
2. Paste the whole of `supabase/migrations/20261012000000_phase1_membership.sql` and click **Run**.
3. You should see "Success. No rows returned".

Run it only once. It creates the tables, the security rules and the three
projects (School visits, Green Futures, MHM curriculum).

## 2. Make yourself the admin

Still in the SQL Editor, run this with the email you will log in with:

```sql
insert into public.admins (email) values ('your-email@example.com');
```

Use lowercase. Only emails in this table can see or change any data.

## 3. Create the admin login

1. **Authentication → Users → Add user → Create new user**.
2. Enter the same email, tick **Auto confirm user**, and set any password
   (it won't be used; you log in with a magic link).

## 4. Lock down sign-ups

In **Authentication → Sign In / Providers**:

- Keep **Email** enabled.
- Turn **off** "Allow new users to sign up". The admin account already
  exists, and nobody else needs an account.

## 5. Tell Supabase where the site lives

In **Authentication → URL Configuration**:

- **Site URL:** `https://umoja-youth-impact-hub.vercel.app`
- **Redirect URLs:** add
  - `https://umoja-youth-impact-hub.vercel.app/admin`
  - `http://localhost:5173/admin` (for local development)

If the site later moves to its own domain, add that domain's `/admin` too.

## 6. Try it

1. Open `/join` on the live site and sign up with your own number.
2. Open `/admin`, enter your admin email, and click the link in the email.
3. You should see yourself under **People → Everyone**.

## Day-to-day

- **People → Follow-up due** is the daily to-do list. Tap **WhatsApp** to
  open a prefilled message (edit the [brackets] first), then **Mark as
  followed up** and pick the next date.
- Tick **In the WhatsApp community** once someone has joined the group;
  this feeds the monthly WhatsApp number.
- Before each event, add the expected people in **Events** and give
  newcomers a named role. Afterwards, tick who came.
- **Metrics** shows the three monthly numbers. Use the clean-up button there
  to delete sign-ups that stayed at Newcomer for over 12 months, as the
  privacy notice promises.
- If someone asks to be removed, open them and use **Delete this person**.

## Things to know

- The anon key in `src/lib/config.js` is meant to be public. It can only
  submit the three forms and read the project list. Never put the
  **service_role** key in the website code or in chat.
- Supabase's built-in email sender only allows a few emails per hour. That is
  fine for one admin logging in. If you add more admins later, set up custom
  SMTP under Authentication settings.
- Check whether your Supabase plan pauses projects after a period of
  inactivity. A paused project means the Join form stops working until it is
  restored.
- To add a project to the Join form menu, add a row in **Table Editor →
  projects** (slug in lowercase-with-dashes). Set `active` to false to hide one.
