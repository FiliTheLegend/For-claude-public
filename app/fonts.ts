import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Newsreader, variable on both opsz and wght, self-hosted. No runtime request
// to fonts.googleapis.com.
//
// Latin subset only. The latin-ext subset is another 86KB over the wire and
// covers Vietnamese and Eastern European glyphs this site has no use for —
// on a 4G connection in Kumarapalayam that is a real cost for nothing.
export const newsreader = localFont({
  src: [
    {
      path: './fonts/Newsreader-latin.woff2',
      weight: '300 700',
      style: 'normal',
    },
  ],
  variable: '--font-newsreader',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const geistSans = GeistSans;
export const geistMono = GeistMono;

export const fontVariables = [
  newsreader.variable,
  GeistSans.variable,
  GeistMono.variable,
].join(' ');
