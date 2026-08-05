import type { Metadata, Viewport } from 'next';
import { fontVariables } from './fonts';
import { Nav } from '@/components/dom/Nav';
import { Footer } from '@/components/dom/Footer';
import { SmoothScroll } from '@/components/dom/SmoothScroll';
import { RouteTransition } from '@/components/dom/RouteTransition';
import { SceneMount } from '@/components/three/SceneMount';
import { StaticFallback } from '@/components/dom/StaticFallback';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://lotussyndicate.com'),
  title: {
    default: 'Lotus Syndicate — Yarn marketing agents, Coimbatore',
    template: '%s — Lotus Syndicate',
  },
  description:
    'Dedicated yarn marketing agents for spinning mills across Tamil Nadu and South India since 1974. Commission 0.5%–2% on ex-mill invoice value, direct billing, bad debts on our account.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Lotus Syndicate',
    images: [{ url: '/assets/og/default.png', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <head>
        {/*
          `suppressHydrationWarning` on <html> is required: this script sets a
          data attribute on the element React is about to hydrate, so without
          it React reports a mismatch on every single page load.

          The Static-tier still is in the server HTML on purpose — it is what a
          visitor with JavaScript disabled gets. But on a capable device that
          means a frame of cone image before React can decide the tier and
          remove it. This runs before first paint, marks the document, and CSS
          hides the fallback immediately. Deliberately tiny and synchronous: it
          has to beat the first paint, and it does nothing but set one
          attribute.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var c=document.createElement('canvas');" +
              "if(c.getContext('webgl2')&&!matchMedia('(prefers-reduced-motion: reduce)').matches" +
              "&&!(navigator.connection&&navigator.connection.saveData))" +
              "document.documentElement.dataset.canvas='1'}catch(e){}",
          }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* Canvas at z-index 1, behind every section. Mounted client-side and
            after paint; with JavaScript off, StaticFallback is all there is
            and the page is fully readable. */}
        <SceneMount />
        <StaticFallback />
        <SmoothScroll />
        <RouteTransition />

        <Nav />
        {/* No z-index here on purpose. A z-index on <main> creates a stacking
            context, which traps every section inside it — a section asking to
            sit *below* the canvas would be stuck above it along with all its
            siblings. Sections declare their own layer instead. */}
        <main id="main" className="relative">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
