import { Link } from 'react-router-dom';
import { ChevronRight, Leaf } from 'lucide-react';

function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: [string, string][];
}) {
  return (
    <main className="wrap page-main info-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>{title}</span>
      </div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="info-intro">{intro}</p>
      <div className="info-sections">
        {sections.map(([h, p]) => (
          <section key={h}>
            <span className="info-icon">
              <Leaf size={19} />
            </span>
            <div>
              <h2>{h}</h2>
              <p>{p}</p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export function AboutPage() {
  return (
    <InfoPage
      eyebrow="OUR STORY"
      title="Rooted in the needs of Indian fields."
      intro="AgriCom is being built to make crop inputs easier to explore and product information easier to understand."
      sections={[
        [
          'A farmer-first approach',
          'We bring together crop care, nutrition and soil health products in one thoughtful storefront.',
        ],
        [
          'Clear product information',
          'Every product should show its pack size, verified supplier details and approved label guidance.',
        ],
        [
          'Responsible use matters',
          'Always read the product label, use the required protective equipment and seek qualified local advice when needed.',
        ],
      ]}
    />
  );
}

export function ContactPage() {
  return (
    <InfoPage
      eyebrow="WE'RE HERE TO HELP"
      title="Let's talk about your field."
      intro="Contact AgriCom for product, order and delivery questions. Contact details will be added before launch."
      sections={[
        ['WhatsApp', 'Set your store WhatsApp number in frontend/src/config/store.ts to accept order enquiries.'],
        ['Phone', 'Add your customer support phone number in frontend/src/config/store.ts.'],
        ['Email', 'Add your support email address in frontend/src/config/store.ts.'],
      ]}
    />
  );
}

export function ShippingPage() {
  return (
    <InfoPage
      eyebrow="DELIVERY DETAILS"
      title="Shipping information"
      intro="Delivery coverage and charges depend on your location and product. Enter your PIN at checkout and confirm service with AgriCom."
      sections={[
        [
          'Delivery availability',
          'Rural and remote delivery availability must be verified for each PIN code before confirming the order.',
        ],
        [
          'Delivery charges',
          'The storefront currently estimates a ₹90 delivery charge below ₹1,500 and free delivery above it. Replace this demo policy with your confirmed rates.',
        ],
        [
          'Order confirmation',
          'Submitting checkout sends an order request. AgriCom confirms stock, delivery availability, applicable charges and dispatch timing with you.',
        ],
      ]}
    />
  );
}

export function FaqPage() {
  return (
    <InfoPage
      eyebrow="HERE TO HELP"
      title="Common questions"
      intro="Quick answers for common shopping and product questions."
      sections={[
        [
          'How do I know if you deliver to my village?',
          'Enter your 6-digit PIN code on the page, then confirm availability with AgriCom before payment.',
        ],
        [
          'How do I use a product?',
          'Follow the approved directions on the original product label. Never rely on unverified online dosage advice.',
        ],
        [
          'Which payments are available?',
          'UPI and cash on delivery are planned. UPI payment details appear after they are configured by the store.',
        ],
        [
          'How can I ask about a product?',
          'Use the WhatsApp enquiry button on a product page once the store contact number is configured.',
        ],
        [
          'Are the product photos and listings final?',
          'No. This starter catalog uses illustrative placeholders. The store must replace sample entries with verified product and supplier information.',
        ],
      ]}
    />
  );
}
