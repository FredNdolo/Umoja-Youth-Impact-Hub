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

## Member documents: ID and police clearance

Members upload a copy of their national ID (or passport) and their police
clearance certificate (Certificate of Good Conduct) under **Documents** on
their page. Files go to the **private** storage bucket `member-documents`;
each member can only see their own, and only the admin can open others'
(through 2-minute links).

- **/admin → People → Documents to check** lists people with uploads waiting.
  Open the person, **View** each file, then **Verify** or **Ask again** (with a
  note the member sees).
- Deleting a person also deletes their files.
- Good practice: don't download or forward copies; delete documents when a
  member leaves.

The same section lets members download the **UYIH Constitution** and the
**Child Protection and Safeguarding Policy** (`public/docs/`). Files in
`public/docs` can be opened by anyone with the link.

## Member area v2 (October 2026)

### Redeploy the login-link service (needed for "join → signed in")
The `member-login-link` function has a new `join` mode. In Supabase →
**Edge Functions → member-login-link → Code**, replace everything with the
current `supabase/functions/member-login-link/index.ts` and **Deploy**. Until
then, new joiners see a welcome card with a "Go to my member page" button and
log in the usual way.

### What changed
- **Joining**: new joiners are signed in straight away and land on `/me`,
  where a welcome card offers the WhatsApp community (their choice). They get
  Orientation, Safeguarding Basics and the social-content task on their list
  automatically. Re-joining with an existing number never signs anyone in or
  changes that person's name or email.
- **Submitting tasks**: members add a link and/or upload a file (up to 20 MB:
  PDF, photos, Word, Excel, PowerPoint, text or MP4) with an optional note.
  Files go to the private `task-submissions` bucket. In **/admin → Tasks → To
  review** you see the link and can open the file.
- **Courses clear themselves**: pass the quiz and the course is done, with a
  certificate. For Safeguarding Basics the member also signs the declaration;
  **/admin → Tasks → Safeguarding declarations to countersign** is where the
  DSL countersigns afterwards.
- **Points**: each task's own points when done, plus points for attending an
  activity (2) and taking a named role (3).
- **Medals** (adjust in **/admin → Tasks → Points & medals**):
  Seedling 10 points · Sapling 30 · Tree 60 + full member · Forest 120 + full member.
- **Certificates**: issued automatically when a course is completed, signed by
  the Executive Director and the Designated Safeguarding Lead. Each has a code
  and a public page (`/certificates/<code>`) anyone can use to check it;
  members download it as a PDF. Add the DSL's name in
  `CERTIFICATE_SIGNATORIES` in `src/lib/config.js` when confirmed.
- **Member page**: a white, course-site layout with Home, My learning, Tasks,
  Achievements, Documents and Profile.

## Tree Monitor (October 2026)

The Tree Monitor now runs on the website. Its old standalone app (uyih-tree-monitor.vercel.app) redirects here.

- **Public page:** `/treemonitoringapp`, also linked from the menu and the Green Futures page. It shows live numbers, the map and how the app works, and is the page to send to partners such as KFS.
- **Field app:** `/me/trees`, inside the member area. Only field team members and admins can open it.
- **Tree pages:** `/t/UYIH-XXXXXX`, which is what each QR label opens. They show species, school, status and growth, with locations rounded to about 10 m. They never show photos, names or notes.

### 1. Run the database migration (once)
Run `supabase/migrations/20261016000000_tree_monitor.sql` in the Supabase SQL Editor. It creates the `tm_*` tables and the private `tree-photos` storage bucket. It also adds the three pilot schools and a starter list of 13 species.

### 2. Add the field team
1. A member must be signed up and, for school work, should have completed Safeguarding Basics.
2. Open **Member area → Tree Monitor → Team** and click **Add**. Admins and coordinators can add field members. Only admins can make someone a coordinator or remove access.
3. Children and Girl Guides never get accounts. The member they work with records their trees.

Admins (`umojayouthhub@gmail.com`) always have full access.

### 3. Before planting at each school
1. **Sites & plots:** stand at the school gate and tap **Use my location** to save the school's GPS point. Add the head teacher as the contact, and the MOU reference if there is one.
2. Add each planting **plot**. Then tap **Walk boundary** and walk the corners; the app works out the area in hectares.
3. Open **Baseline**, describe the land before planting, add landscape photos (land only, no people), then **Save & lock**. A locked baseline can't be changed by anyone. Carbon and restoration verifiers rely on that.

### 4. On planting days
- **Register tree:** choose site, plot, species and nursery batch, then record GPS standing at the tree. The app shows the tree's code and QR label.
- You can pre-print labels: **Reports → Labels → Blank codes to pre-print**. When registering, type the code from the label.
- No signal? Keep working. Registrations and check-ins save on the phone and sync when the network returns. On Android, use **Add to Home screen** to install the app.

### 5. Monthly check-ins
Scan the tree's QR code, choose its health, measure its height and photograph the tree. **Overview** lists trees that haven't been checked for 30 days or more.

### 6. Nursery and sales
**Nursery & sales** records seed batches (source, sown, germinated, ready), seedling sales (with the M-Pesa reference) and pad distributions. Pad distributions are recorded as counts only, never girls' names.

### 7. Reports for partners
**Reports** gives a quarterly report you can print or save as a PDF, plus exports: trees CSV, check-ins CSV, GeoJSON (for QGIS/ArcGIS) and KML (for Google Earth).

### Please review
- **Local species names:** only the names we were sure of were filled in. Please check the Kiswahili and Maa names with KFS or a local forester, and edit them under **Species**.
- **Plot photos and check-in photos:** these are private. Only the field team and admins can see them.

### Geofences (how the app knows where you are)
Each site has a **centre point** and a **geofence**, a circle around it (250 m by default, adjustable from 50 to 1,000 m under **Sites & plots → Edit site**). Each plot can also have a **boundary**, either walked with GPS or tapped out on the satellite map.

Once these are set:
- **Register tree** starts with the GPS point. The app fills in the school (from the geofence) and the plot (from its boundary). If the point falls outside the school or the plot, it asks the field member to double-check before saving.
- **Near me** lists the trees around the phone, nearest first, with the ones due for a check-in marked, so a monthly round needs no searching.
- **Check-in** shows how far the phone is from the tree's registered point. The database saves this distance with every check-in, and anything over 50 m is flagged.
- **Reports → Data quality** lists trees with weak GPS, trees outside their plot or school, and check-ins made far from the tree.

To set a school up: open **Sites & plots → Edit site**, stand in the middle of the compound and tap **Use my location** (or tap the centre on the satellite map), set the radius so the circle covers the compound, and save. Then add the plots and walk or draw their boundaries.

### Adding, archiving and deleting sites
- **Add a site:** Sites & plots → + Add a site.
- **Archive** (coordinators and admins): use this when work at a site ends. It disappears from the field app and the public page, but all its records are kept. Archived sites are listed at the bottom of the page with a **Restore** button.
- **Delete** (admins only): available only while nothing has been recorded at the site (no plots, nursery or trees). Plots can be deleted the same way while they have no trees and no locked baseline.

## Email notifications (task assigned, contact messages, reminders)

The website emails people automatically. Every email is queued in the
`email_outbox` table and sent by the `send-emails` Edge Function, which
the database wakes straight away (and pg_cron every 5 minutes for retries).
Admins can see every email, and resend failed ones, under **Admin → Emails**.

| Who | When |
|---|---|
| Member | Welcome; task assigned / approved / marked done / returned; certificate issued, revoked or restored; document verified or rejected; fee confirmed or rejected; donation receipt; stage changed; added to an event, project or Tree Monitor team; event role; safeguarding declaration countersigned |
| Member (reminders, 07:00, can be turned off on their profile) | Task due in 2 days; task overdue; open task untouched for a week; event tomorrow; Monday tree round-up for the field team |
| Public | Receipt for a contact message or document request; document request declined |
| Admins | Contact message and document request (Reply goes straight to the sender); new sign-up; M-Pesa code to check; task to review; document to check; safeguarding declaration (also to the DSL); deletion request; daily digest at 07:00 |

**One step to turn sending on:** Supabase → **Edge Functions → Secrets**, add
`SMTP_PASS` = the Gmail app password from step 3a (the same one works).
If you send from a different Gmail address, also add `SMTP_USER`.
Until then emails wait in the queue and nothing is lost.

Gmail sends about 500 emails a day. If UYIH outgrows that, get a domain,
create a Resend account and add `RESEND_API_KEY` and `EMAIL_FROM`
(e.g. `UYIH <hello@uyih.org>`); the function switches to Resend automatically.

Set the DSL's email under **Admin → Certificates → Who signs certificates**
so safeguarding declarations reach them.
