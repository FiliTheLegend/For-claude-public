/**
 * Mills Lotus has represented.
 *
 * The year pairings on the old site are not reliably readable, so every span
 * below is marked unconfirmed and the UI renders it as such rather than
 * printing a date the client cannot stand behind. The loose ranges that do
 * appear on the old site are kept in `KNOWN_SPANS` so whoever confirms them
 * has the raw material to hand.
 */

export type Principal = {
  slug: string;
  name: string;
  /** Null until confirmed — never guess a date for a mill. */
  span: string | null;
  spanConfirmed: boolean;
  logo: string;
  note?: string;
};

/** Date ranges present on the old site, unpaired. */
export const KNOWN_SPANS = [
  '1975–1989',
  '1989–1998',
  '1989–2004',
  '1992–1998',
  '2003–2008',
  '2009–2017',
  '2013–2018',
  '2018–2022',
  'Present',
] as const;

export const principals: Principal[] = [
  {
    slug: 'nahar',
    name: 'Nahar Industrial Enterprises',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/nahar.png',
  },
  {
    slug: 'oswal',
    name: 'Oswal',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/oswal.png',
  },
  {
    slug: 'vardhman',
    name: 'Vardhman',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/vardhman.png',
  },
  {
    slug: 'trident',
    name: 'Trident Group',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/trident.png',
  },
  {
    slug: 'suryalakshmi',
    name: 'Suryalakshmi Cotton Mills',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/suryalakshmi.png',
  },
  {
    slug: 'suryavanshi',
    name: 'Suryavanshi Spinning Mills',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/suryavanshi.png',
  },
  {
    slug: 'telangana',
    name: 'Telangana Spinning & Weaving Mills',
    span: null, // TODO: confirm
    spanConfirmed: false,
    logo: '/assets/principals/telangana.png',
    note: 'Hyderabad',
  },
];

export type Mandate = {
  name: string;
  detail: string;
  /** TODO: confirm before publish — client-supplied, not yet verified. */
  confirmed: boolean;
};

export const currentMandates: Mandate[] = [
  {
    name: 'Nahar Industrial Enterprises',
    detail: 'Sole agent, Tamil Nadu',
    confirmed: false, // TODO: confirm before publish
  },
  {
    name: 'Aneesh Textiles',
    detail: 'P/V and Polyester',
    confirmed: false, // TODO: confirm before publish
  },
  {
    name: 'Vankar Spinners',
    detail: '',
    confirmed: false, // TODO: confirm before publish
  },
  {
    name: 'Sri Lalitha Parmeshwari Spinning',
    detail: 'SLPS',
    confirmed: false, // TODO: confirm before publish
  },
];

/** Counts actively marketed. */
export const counts = [
  { count: '30s', type: 'CCW', confirmed: false }, // TODO: confirm before publish
  { count: '40s', type: 'CCW', confirmed: false }, // TODO: confirm before publish
] as const;
