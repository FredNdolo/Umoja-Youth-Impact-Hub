# Phase 2A setup: member logins, profiles and tasks

The database changes are already applied to the live Supabase project.
These steps finish the setup. Steps 1 and 2 are needed before members can log in.

## 1. Deploy the login-link service (about 2 minutes)

1. Supabase dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Name it exactly: `member-login-link`
3. Replace the example code with the whole of `supabase/functions/member-login-link/index.ts`.
4. Click **Deploy**. Leave "Verify JWT" (JWT verification) switched **on**.

The function uses keys Supabase provides automatically; nothing else to set.

## 2. Allow the member page as a login destination

**Authentication → URL Configuration → Redirect URLs**, add:

- `https://umoja-youth-impact-hub.vercel.app/me`
- `http://localhost:5173/me` (for local development)

## 3. Turn on email login for members (Gmail as the email sender)

WhatsApp login links work without this. Email login links don't: Supabase's
built-in email sender only delivers to people on your Supabase team.
Gmail is free and sends up to about 500 emails a day, plenty for login links.

**a. Create a Gmail app password** (signed in as umojayouthhub@gmail.com)
1. Turn on **2-Step Verification**: myaccount.google.com → Security.
2. Go to **myaccount.google.com/apppasswords**, name it `Supabase`, click **Create**.
3. Copy the 16-character password (shown once; spaces don't matter).

**b. Connect it in Supabase**: **Authentication → Emails → SMTP Settings**,
turn on **Enable custom SMTP** and fill in:

| Field | Value |
|---|---|
| Sender email | `umojayouthhub@gmail.com` |
| Sender name | `Umoja Youth Impact Hub` |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `umojayouthhub@gmail.com` |
| Password | the 16-character app password |
| Minimum interval between emails | leave the default |

Save.

**c. Rate limit**: Supabase starts custom senders at 30 emails an hour.
That's fine to begin with; raise it under **Authentication → Rate Limits** if
a big sign-up push is coming (stay well under Gmail's ~500 a day).

**d. Branded login email (optional)**: **Authentication → Emails → Templates
→ Magic Link**. Subject `Your UYIH login link`; paste the contents of
`docs/email-templates/magic-link.html` as the body.

**e. Test**: on `/me`, enter your own email and tap **Email me a login link**.
If it doesn't arrive, check spam, and Supabase **Logs → Auth** for SMTP errors.
If you ever change the Gmail password, the app password stops working: make a
new one and paste it in again.

## 4. Optional: how long WhatsApp login links last

Links expire after the **Email OTP Expiration** time
(**Authentication → Providers → Email**), 1 hour by default. If members often
open their link later in the day, raise it (the maximum is 24 hours).

## 5. Try it

1. In **/admin → People**, open yourself (or a test sign-up).
2. Under **Member login**, click **Create WhatsApp login link** → **Send on WhatsApp**.
3. Open the link on your phone and tap **Log me in**.
4. Fill in the get-to-know-you profile, then pick up a task.
5. Back in **/admin → Tasks**, confirm it under **To review**.

## How it works day to day

- **New joiners**: the newcomer WhatsApp message now includes a link to
  `/me` asking them to tell you about their skills.
- **Logins**: members choose either an email link (they request it on
  `/me`) or a WhatsApp link that you create from their record.
- **Tasks**: create tasks in **/admin → Tasks**, tag the skills needed, then
  **Assign**. People with matching skills are listed first. Tick **Open** to
  let any member pick a task up themselves.
- **Membership checklist** (shown to members and in each person's record):
  attend 2 activities · a named role at an event · a project + 3 project tasks
  · profile · Orientation · Safeguarding Basics + declaration · social media
  content · membership fee. **People → Ready for review** lists volunteers who
  have met everything except the fee.
- **Safeguarding Basics is an online course** built from the UYIH Child
  Protection and Safeguarding Policy: 7 short lessons, then a 14-question
  scenario quiz (pass mark 12, retakes allowed, answers checked on the server),
  then the policy's Annex 1 declaration signed by typing their full name. It
  arrives in **Tasks → To review** with the score and signature; confirming it
  is the Designated Safeguarding Lead's countersignature. You can still mark it
  done directly for someone briefed in person.
- **Orientation is an online course too**, built from the organisation
  profile and the Green Futures proposal: 7 short lessons and a 10-question
  quiz (pass mark 8). Members send their result and you confirm it under
  **Tasks → To review**. You can still mark it done directly for someone who
  attended an in-person orientation.
- **Starter task library**: 22 ready-made tasks for Green Futures, school
  visits, the MHM curriculum, content and general support, each tagged with
  skills. Desk tasks are **Open** (any member can pick them up); anything
  involving schools, children, money or coordination is assign-only and says
  that Safeguarding Basics comes first. Edit or switch them off in
  **/admin → Tasks**.
- **Deletion requests**: members can ask for deletion on their page; they
  appear under **People → Deletion requested**. Delete within 30 days.

## Please review

- The Safeguarding Basics lessons (`src/member/courses/safeguarding.js`) and
  quiz (`supabase/migrations/20261013010000_safeguarding_course.sql`, or the
  `course_questions` table in Supabase) with the Designated Safeguarding Lead.
- The full policy is published at `/docs/uyih-child-protection-safeguarding-policy.pdf`
  so members can read what they sign. Remove `public/docs/` if it shouldn't be public.
- When the policy changes, update the lessons, the quiz and `DECLARATION`
  (Annex 1 wording) together.
- The Orientation lessons (`src/member/courses/orientation.js`) and quiz
  (`supabase/migrations/20261013020000_orientation_course.sql`).
- The starter tasks (`supabase/migrations/20261013030000_starter_tasks.sql`,
  or **/admin → Tasks**): switch off any that don't fit the current plan.

## Payments: donations and the membership fee (M-Pesa paybill)

Payments go straight to the UYIH paybill; the website never handles money.

- **/donate** shows the paybill and account number with copy buttons. Donors
  can optionally send their M-Pesa code, amount and contact details so you
  can thank them.
- **Membership fee**: on the member page, the last checklist item has a
  **Pay now** button → **/me/pay** (Ksh 1,000, then the M-Pesa code).
- **/admin → Payments** lists every code sent in. Check each one against the
  paybill statement, then **Confirm** or **Reject** (with a reason the member
  sees). Confirming a membership fee ticks *fee paid* on their record and
  their checklist. Totals for the month are shown at the top.

**Paybill details**: set them in `src/lib/config.js` (`PAYBILL`), or in Vercel
→ Project → Settings → Environment Variables as `VITE_PAYBILL_NUMBER`,
`VITE_PAYBILL_ACCOUNT` and `VITE_PAYBILL_NAME`, then redeploy. Until they're
set, the pages ask people to message UYIH on WhatsApp for the details.
