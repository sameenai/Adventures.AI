import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Basecamper",
  description: "How Basecamper collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "24 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg uppercase tracking-widest text-stone-100">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-400">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500">Legal</p>
      <h1 className="mt-1 font-display text-4xl uppercase tracking-widest text-stone-100">
        Privacy Policy
      </h1>
      <p className="mt-2 font-mono text-xs text-stone-500">Last updated: {LAST_UPDATED}</p>

      <Section title="Who we are">
        <p>
          Basecamper (basecamper.ai) is an adventure travel planning platform. This policy explains
          what personal data we collect, why, who we share it with, and the rights you have over it.
          It is written to be read, not skimmed past.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-stone-300">Account data</strong> — your email, name, and avatar,
            provided by Google when you sign in with Google OAuth.
          </li>
          <li>
            <strong className="text-stone-300">Profile data</strong> — anything you add yourself:
            bio, social links.
          </li>
          <li>
            <strong className="text-stone-300">Content</strong> — adventures you post, comments,
            votes, bookmarks, and collections.
          </li>
          <li>
            <strong className="text-stone-300">Trip planning conversations</strong> — messages you
            exchange with the AI trip planner and the itineraries it builds are saved to your
            account so you can resume them. Treat them like any other saved document: they may
            contain whatever you chose to share (dates, budgets, fitness notes).
          </li>
          <li>
            <strong className="text-stone-300">Your OpenAI API key</strong> (optional) — if you add
            your own key it is encrypted at rest with AES-256-GCM and never displayed again (only
            its last four characters).
          </li>
          <li>
            <strong className="text-stone-300">Usage signals</strong> — which adventures you view.
            Anonymous views are counted using a salted, daily-rotating hash of network data — we do
            not store an identifier on your device for this.
          </li>
          <li>
            <strong className="text-stone-300">IP address</strong> — processed transiently for rate
            limiting and abuse prevention, and retained in our hosting provider&rsquo;s request
            logs.
          </li>
          <li>
            <strong className="text-stone-300">Billing state</strong> — if you subscribe to Pro,
            Stripe tells us your subscription status. Your card details go directly to Stripe and
            never touch our servers.
          </li>
        </ul>
      </Section>

      <Section title="Why we process it (lawful bases)">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-stone-300">Performing our contract with you</strong> — operating
            your account, your content, the planner, and Pro billing.
          </li>
          <li>
            <strong className="text-stone-300">Legitimate interests</strong> — keeping the service
            secure (rate limiting, abuse prevention), understanding what content is popular, and
            improving the product.
          </li>
          <li>
            <strong className="text-stone-300">Consent</strong> — marketing email, if you ever opt
            in. We do not send marketing email without it, and every message would include one-tap
            unsubscribe.
          </li>
        </ul>
      </Section>

      <Section title="Who receives your data">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-stone-300">OpenAI</strong> (US) — your trip-planner messages
            and, when you use the description-enhancer, adventure text are sent to OpenAI&rsquo;s
            API to generate responses. OpenAI&rsquo;s API terms state API data is not used to train
            their models.
          </li>
          <li>
            <strong className="text-stone-300">Stripe</strong> (US/EU) — payments and subscription
            management.
          </li>
          <li>
            <strong className="text-stone-300">Amadeus and Skyscanner</strong> — flight searches
            send only route, dates, passenger count and cabin class. No names or personal details.
          </li>
          <li>
            <strong className="text-stone-300">OpenStreetMap</strong> — map tiles load directly from
            OpenStreetMap&rsquo;s servers, which receive your IP address and the map area you view.
          </li>
          <li>
            <strong className="text-stone-300">Google</strong> — sign-in (OAuth) and our hosting
            infrastructure (Google Cloud, London region europe-west2).
          </li>
        </ul>
        <p>
          Transfers to US providers rely on the EU–US / UK Data Privacy Framework or Standard
          Contractual Clauses. We never sell personal data.
        </p>
      </Section>

      <Section title="How long we keep it">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account, content and itineraries — until you delete them or your account.</li>
          <li>Adventure view records — deleted after 90 days.</li>
          <li>Read notifications — deleted after 90 days.</li>
          <li>Auto-created empty itineraries — deleted after 30 days.</li>
          <li>Server logs — 30 days.</li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>
          Under UK/EU data protection law you can access, correct, export, and erase your data,
          object to processing, and complain to the ICO (ico.org.uk). Most of it is self-serve:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-stone-300">Export</strong> — download everything we hold about
            you as JSON from{" "}
            <Link href="/profile/edit" className="text-amber-500 hover:text-amber-400">
              profile settings
            </Link>
            .
          </li>
          <li>
            <strong className="text-stone-300">Delete</strong> — permanently delete your account and
            all your content from the same page. This also deletes your Stripe customer record. It
            cannot be undone.
          </li>
          <li>
            <strong className="text-stone-300">Rectify</strong> — edit your profile at any time.
          </li>
        </ul>
      </Section>

      <Section title="Cookies & device storage">
        <p>
          We use strictly necessary cookies only: your sign-in session (expires after 7 days) and a
          theme preference. No advertising or cross-site tracking cookies, and no third-party
          analytics scripts.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions or requests: <span className="text-stone-300">privacy@basecamper.ai</span>. We
          answer subject-access and erasure requests within one month.
        </p>
      </Section>

      <p className="mt-12 border-t border-stone-800 pt-6 text-xs text-stone-600">
        See also our{" "}
        <Link href="/terms" className="text-amber-500 hover:text-amber-400">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
