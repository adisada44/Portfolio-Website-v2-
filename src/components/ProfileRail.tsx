import type { ReactNode } from 'react';

type InlineLinkProps = {
  children: string;
  href: string;
};

const InlineHighlight = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-ink">{children}</span>
);

const InlineLink = ({ children, href }: InlineLinkProps) => (
  <a
    href={href}
    target="_blank"
  rel="noreferrer noopener"
  className="link-hover font-semibold text-ink"
  >
    {children}
  </a>
);

export default function ProfileRail() {
  return (
    <aside className="profile-rail">
      <div className="profile-content">
        <section className="space-y-4" aria-labelledby="profile-name">
          <h1 id="profile-name" className="text-[16px] font-bold leading-[1.1]">
            Aditya Sadashiv
          </h1>
          <p className="max-w-[248px] text-[14px] font-medium leading-[24.5px] text-copy lg:w-[281px] lg:max-w-none">
            I have <InlineHighlight>0.6 years of experience</InlineHighlight>{' '}
            designing in <InlineHighlight>B2B SaaS domain</InlineHighlight>,
            specifically complex workflows in a{' '}
            <InlineHighlight>Compliance Management software</InlineHighlight> used
            by large enterprises.
          </p>
          <div className="h-px w-[248px] bg-stroke" aria-hidden="true" />
        </section>

        <section className="space-y-4" aria-label="Current interests">
          <div className="flex flex-col gap-2.5 text-[14px] font-medium leading-[21px] text-copy">
            <p>
              Currently interning at{' '}
              <InlineLink href="https://www.optimas.ai/">Optimas.ai INC</InlineLink>
            </p>
            <p>
              Dabbling with <InlineLink href="https://rive.app/">RIVE</InlineLink>
            </p>
            <p>
              Currently reading about{' '}
              <InlineLink href="https://thedecisionlab.com/biases">
                cognitive biases
              </InlineLink>
            </p>
            <p>Looking for answers to life at the Gym</p>
            <p>
              Enhancing my taste through <InlineHighlight>cinema</InlineHighlight>
            </p>
          </div>
          <div className="h-px w-[248px] bg-stroke" aria-hidden="true" />
        </section>
      </div>
    </aside>
  );
}
