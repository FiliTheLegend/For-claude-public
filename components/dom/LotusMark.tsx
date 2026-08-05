/**
 * The lotus mark, drawn as a single continuous stroke — eight petals from one
 * path, so the footer knot can literally draw it with the tail of the thread.
 * Placeholder until the client supplies /assets/logo/lotus-mark.svg; this is
 * built to the same proportions so swapping it in changes nothing else.
 */
export function LotusMark({
  size = 28,
  className = '',
  strokeWidth = 1.25,
  title,
  draw = false,
  style,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
  /** Draw the mark on in a single stroke, as the tail of the footer knot. */
  draw?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path
        d={LOTUS_PATH}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={draw ? 'lotus-draw' : undefined}
      />
    </svg>
  );
}

/** Exported so the 3D knot can trace the same outline. */
export const LOTUS_PATH =
  'M24 42C24 42 13 36.5 13 27.5C13 21.7 18 17 24 12C30 17 35 21.7 35 27.5C35 36.5 24 42 24 42Z' +
  'M24 42C24 42 10 40 6.5 32C4.2 26.8 7 21 11 18C13.4 22.6 16.6 26 20 29' +
  'M24 42C24 42 38 40 41.5 32C43.8 26.8 41 21 37 18C34.6 22.6 31.4 26 28 29' +
  'M24 42C24 42 12 38 8 30M24 42C24 42 36 38 40 30';

export function LotusWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-3 ${className}`}>
      <LotusMark size={22} className="translate-y-[3px] text-brass" />
      <span className="font-display text-[19px] tracking-[-0.01em]">Lotus Syndicate</span>
    </span>
  );
}
