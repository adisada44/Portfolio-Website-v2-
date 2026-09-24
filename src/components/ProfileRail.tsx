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

export function ProfileBio() {
  return (
    <section className="profile-bio space-y-4" aria-labelledby="profile-name">
      <h1 id="profile-name" className="profile-name font-semibold leading-[1.1]">
        Aditya Sadashiv
      </h1>
      <p className="profile-bio-copy font-medium text-copy">
        I have <InlineHighlight>0.6 years of experience</InlineHighlight>{' '}
        designing in <InlineHighlight>B2B SaaS domain</InlineHighlight>,
        specifically complex workflows in a{' '}
        <InlineHighlight>Compliance Management software</InlineHighlight> used
        by large enterprises.
      </p>
      <div className="profile-divider h-px bg-stroke" aria-hidden="true" />
    </section>
  );
}

export function ProfileInterests() {
  return (
    <section className="profile-interests space-y-4" aria-label="Current interests">
      <div className="profile-interests-list flex flex-col gap-2.5 font-medium text-copy">
        <p>
          Currently interning at{' '}
          <InlineLink href="https://www.optimas.ai/">Optimas.ai INC</InlineLink>
        </p>
        <p>
          Dabbling with <InlineLink href="https://threejs.org/">Three.js</InlineLink>
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
      <div className="profile-divider h-px bg-stroke" aria-hidden="true" />
    </section>
  );
}
