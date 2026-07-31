'use client';

import { ArrowRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type FlowButtonBase = {
  text?: string;
  /** Render as an anchor when provided (keeps behaviour like data-overlay-open). */
  href?: string;
  className?: string;
};

type FlowButtonProps = FlowButtonBase &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>,
    keyof FlowButtonBase
  >;

/**
 * FlowButton — animated pill with an expanding circle + sliding arrows.
 * Dark-adapted variant: white text/outline on a dark surface, and on hover a
 * white circle fills the button while the label + arrows flip to near-black,
 * so the text stays readable throughout (light-bg override lives in globals.css).
 */
export function FlowButton({ text = 'Modern Button', href, className = '', ...rest }: FlowButtonProps) {
  const classes = [
    'flow-button group relative inline-flex items-center gap-1 overflow-hidden',
    'rounded-[100px] border-[1.5px] border-white/40 bg-transparent',
    'px-8 py-3 text-sm font-semibold text-white cursor-pointer',
    'transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
    'hover:border-transparent hover:text-[#0a0a0a] hover:rounded-[12px] active:scale-[0.95]',
    className,
  ].join(' ');

  const content: ReactNode = (
    <>
      {/* Left arrow — slides in from the left on hover */}
      <ArrowRight className="flow-arrow flow-arrow--left absolute w-4 h-4 left-[-25%] stroke-white fill-none z-[9] group-hover:left-4 group-hover:stroke-[#0a0a0a] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />

      {/* Label */}
      <span className="flow-text relative z-[1] -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-out">
        {text}
      </span>

      {/* Expanding circle */}
      <span className="flow-circle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]" />

      {/* Right arrow — slides out to the right on hover */}
      <ArrowRight className="flow-arrow flow-arrow--right absolute w-4 h-4 right-4 stroke-white fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-[#0a0a0a] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
    </>
  );

  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}

export default FlowButton;
