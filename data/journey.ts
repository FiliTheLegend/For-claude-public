/** The six eras the journey rail travels through. */
export type Era = {
  years: string;
  place: string;
  title: string;
  body: string;
  /** Parallax depth band: 0 nearest, 2 furthest. */
  depth: 0 | 1 | 2;
};

export const eras: Era[] = [
  {
    years: '1974',
    place: 'Secunderabad',
    title: 'Pan Bazaar',
    body: 'Shri Kailash Prasad Agarwal, native of Churu in Rajasthan, founds the agency and begins marketing yarn for spinning mills.',
    depth: 0,
  },
  {
    years: '1974–1989',
    place: 'Secunderabad',
    title: 'Fifteen years from one address',
    body: 'The business runs from Pan Bazaar until 1989, building the mill relationships the rest of the century is spent on.',
    depth: 1,
  },
  {
    years: '1989',
    place: 'Tirupur',
    title: 'The second generation, and the move south',
    body: 'Alokkumar Agarwal joins and moves operations to Tirupur, into the knitwear cluster.',
    depth: 0,
  },
  {
    years: '1989–2005',
    place: 'Tirupur',
    title: 'M/s. Shri Krishna Agencies',
    body: 'Sixteen years trading under the Shri Krishna Agencies name across Tamil Nadu.',
    depth: 2,
  },
  {
    years: '2005–',
    place: 'Coimbatore',
    title: 'Expansion and relocation',
    body: 'The agency expands its territory and relocates to Coimbatore, at the centre of the South Indian spinning belt.',
    depth: 1,
  },
  {
    years: 'Present',
    place: 'Coimbatore',
    title: 'Third generation',
    body: 'Ashutosh Agarwal joins the business. Mandates run across Tamil Nadu, all South India, and corporate buyers Pan India.',
    depth: 0,
  },
];
