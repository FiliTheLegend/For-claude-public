/**
 * Every fact on this site lives here. Nothing is invented: where the brief
 * flagged something as unverified it carries a TODO and is rendered with that
 * uncertainty intact rather than being quietly asserted.
 */

export const company = {
  name: 'Lotus Syndicate',
  founded: 1974,
  role: 'Yarn marketing agents',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
} as const;

export const contact = {
  whatsapp: '+919843199963',
  whatsappDisplay: '+91 98431 99963',
  landlines: ['0422 242 5111', '0422 242 5112', '0422 242 5113'],
  email: 'yarn@lotussyndicate.com',
  address: {
    line1: '20, Ground Floor, Near Surabi Enclave',
    line2: 'Thiruvika Nagar, IOB Colony, Maruthamalai Road',
    line3: 'Bharathiyar University Post',
    city: 'Coimbatore',
    postcode: '641046',
    state: 'Tamil Nadu',
    country: 'India',
  },
  hours: {
    display: '8:30 AM – 6:30 PM, Monday to Saturday',
    opens: '08:30',
    closes: '18:30',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
} as const;

/** WhatsApp is the actual channel in Indian textile trade. Every page gets a
 *  prefilled message so the first reply already has context. */
export function whatsappLink(message: string) {
  return `https://wa.me/${contact.whatsapp.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export const stats = [
  { value: 50, suffix: '+', label: 'years in yarn', note: 'since 1974' },
  { value: 1974, suffix: '', label: 'founded', note: 'Secunderabad' },
  { value: 7, suffix: '', label: 'mills represented', note: 'see principals' },
  { value: 2, suffix: '%', label: 'commission ceiling', note: '0.5–2% ex-mill' },
] as const;

export const generations = [
  {
    name: 'Shri Kailash Prasad Agarwal',
    alias: 'Saraogi',
    origin: 'Churu, Rajasthan',
    span: '1974–1989',
    base: 'Pan Bazaar, Secunderabad',
    note: 'Founded the agency and ran it from Secunderabad until 1989.',
    image: '/assets/people/kp-agarwal.jpg',
  },
  {
    name: 'Alokkumar Agarwal',
    alias: null,
    origin: 'b. 1968',
    span: '1989–',
    base: 'Tirupur, then Coimbatore',
    note: 'The Hyderabad Public School, Begumpet, and Badruka College of Commerce. Joined in 1989 and moved operations to Tirupur, trading as M/s. Shri Krishna Agencies from 1989 to 2005. Later expanded and relocated to Coimbatore.',
    image: '/assets/people/alok-agarwal.jpg',
  },
  {
    name: 'Ashutosh Agarwal',
    alias: null,
    origin: 'Third generation',
    span: 'Present',
    base: 'Coimbatore',
    note: 'Third generation in the business.',
    image: '/assets/people/ashutosh-agarwal.jpg',
  },
] as const;

export const territories = [
  'All Tamil Nadu',
  'Entire South India',
  'Specific southern states',
  'Large corporate buyers Pan India',
] as const;

export const whyMillsStay = [
  'Ethical, transparent, results-driven',
  'Consistent sales and price realisation',
  'No yarn left unsold or sold at compromised terms',
  'All sale agreements honoured',
  'Payment terms customisable per the spinner',
] as const;

export const mandateTerms = [
  {
    term: 'Commission',
    detail: '0.5% – 2% on ex-mill invoice value, billed monthly or quarterly.',
  },
  {
    term: 'Billing',
    detail:
      'Direct. The spinner invoices the end buyer; Lotus manages the process end to end.',
  },
  {
    term: 'Bad debts',
    detail: 'Lotus takes responsibility for bad debts.',
  },
  {
    term: 'Claims',
    detail:
      'Unjustified claims are handled firmly. Genuine quality concerns are mediated fairly.',
  },
  {
    term: 'Inventory',
    detail:
      'None. Lotus is a commission agent and holds no stock — the yarn never changes hands.',
  },
] as const;
