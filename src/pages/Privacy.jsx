// File: src/pages/Privacy.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, CONSENT_VERSION } from '../lib/config';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-display font-bold text-display-sm text-forest">{title}</h2>
    <div className="font-sans text-ink/90 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="bg-cream">
      <section className="relative pt-32 pb-14 bg-forest overflow-hidden">
        <div className="container-narrow relative z-10">
          <span className="eyebrow text-cream/60 mb-5 block">Your data</span>
          <h1 className="font-display font-bold text-display-xl text-cream">Privacy notice</h1>
          <p className="font-sans text-cream/70 mt-4">Version {CONSENT_VERSION}. Plain language, kept short.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>

      <div className="container-narrow max-w-3xl py-14 md:py-20 space-y-10">
        <Section title="Who we are">
          <p>
            Umoja Youth Impact Hub (UYIH) is a youth-led community-based organisation in Narok, Kenya. We decide how
            the information on this website is used, and we follow the Kenya Data Protection Act, 2019.
            Contact us at <a className="text-terracotta underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or
            on WhatsApp at 0783 218 081.
          </p>
        </Section>

        <Section title="What we collect">
          <p><strong>When you join:</strong> your name, WhatsApp number, age group (not your date of birth), and, if you
            choose to give them, your area, email, the projects you are interested in and how you heard about us.
            As you take part we also record your stage (newcomer, volunteer, member or lead), events you attend,
            projects you join, notes from our follow-up messages and whether you have paid the membership fee.</p>
          <p><strong>When you use the contact form:</strong> your name, email, optional phone number and your message.</p>
          <p><strong>If you complete your member profile:</strong> what you do at the moment, your skills, languages,
            when you're free and what you hope to gain, plus a short bio if you choose. We also
            record the tasks you take on, when you complete them, when you log in, and whether you signed the
            safeguarding declaration.</p>
          <p><strong>When you request a document:</strong> your name, email, optional organisation and how you plan to use it.</p>
          <p><strong>When you subscribe to updates:</strong> your email address.</p>
          <p><strong>When you tell us about a donation or pay the membership fee:</strong> the M-Pesa confirmation code and
            amount, and, if you give them, your name, phone, email and message. We use these to match your payment to our
            paybill statement and to thank you. We never ask for your M-Pesa PIN.</p>
          <p><strong>If you upload verification documents:</strong> a copy of your national ID (or passport) and your
            police clearance certificate, with the date it was issued. We ask for these only to check the identity and
            good conduct of people who work with children, as our Child Protection and Safeguarding Policy requires. They
            are stored in private storage that only UYIH’s administrator can open, through short-lived links, and they are
            never shared.</p>
          <p>We don’t ask for dates of birth or health information, and apart from the optional ID copy described above, we don’t collect ID numbers. Online joining is for people aged 18 and over.</p>
        </Section>

        <Section title="Why we use it">
          <p>To welcome you, contact you on WhatsApp about events and volunteering, place you in a project, keep track of
            membership, match you with roles and tasks that suit your skills, track your progress toward membership, reply to your messages, send documents you request and send the updates you asked for. We also count totals (such as how
            many people joined each month) to report on our work; those counts do not identify anyone.</p>
          <p>We rely on your consent, which you give with the checkbox on the form. We do not sell your data or use it for advertising.</p>
        </Section>

        <Section title="Who can see it">
          <p>Only UYIH’s designated administrator can see individual records. The data is stored with our database
            provider, Supabase, which may keep it on servers outside Kenya. By consenting, you agree to this. We do not share
            your details with partners or funders without asking you first.</p>
        </Section>

        <Section title="How long we keep it">
          <p>If you sign up but don’t take part within 12 months, we delete your record. If you volunteer or become a
            member, we keep your record while you are involved and delete it within 12 months after you leave, unless you
            ask us to delete it sooner. Contact messages and document requests are deleted once they have been dealt with and are no longer needed. Payment records are kept as long as we need them for our accounts. Verification documents are deleted when you leave UYIH or ask us to delete them, and you can delete any that haven’t been checked yet from your member page.</p>
        </Section>

        <Section title="Your rights">
          <p>You can ask to see the information we hold about you, correct it, or have it deleted, and you can withdraw your
            consent at any time by messaging us on WhatsApp or emailing us. Members can also see most of their information,
            edit their profile and details, and ask for deletion themselves on their member page; we act on deletion
            requests within 30 days. To stop receiving updates, just tell us.
            If you are unhappy with how we handle your data, you can complain to the Office of the Data Protection
            Commissioner (ODPC) at <a className="text-terracotta underline" href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">odpc.go.ke</a>.</p>
        </Section>

        <div className="pt-4 border-t border-sand-dark">
          <Link to="/join" className="btn-primary">Back to joining</Link>
        </div>
      </div>
    </div>
  );
}
