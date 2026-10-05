import type { ReactNode } from 'react';

type InlineLinkProps = {
  children: string;
  href: string;
};

type InterestItemProps = {
  children: ReactNode;
  note: string;
};

const BioHighlight = ({ children }: { children: ReactNode }) => (
  <span className="text-ink">{children}</span>
);

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

const InterestItem = ({ children, note }: InterestItemProps) => (
  <div className="profile-interest-item">
    <p className="profile-interest-heading">{children}</p>
    <p className="profile-interest-note">{note}</p>
  </div>
);

export function ProfileBio() {
  return (
    <section className="profile-bio" aria-labelledby="profile-name">
      <div className="profile-identity">
        <img
          src="/profile-avatar.png"
          alt=""
          className="profile-avatar"
          width={28}
          height={28}
        />
        <div className="profile-identity-copy">
          <h1 id="profile-name" className="profile-name">
            Aditya Sadashiv
          </h1>
          <p className="profile-role">Designer, budding builder</p>
        </div>
      </div>
      <p className="profile-bio-copy">
        I have <BioHighlight>0.6 years of experience</BioHighlight>{' '}
        designing in <BioHighlight>B2B SaaS domain</BioHighlight>,
        specifically complex workflows in a{' '}
        <BioHighlight>Compliance Management software</BioHighlight> used
        by large enterprises.
      </p>
      <div className="profile-divider" aria-hidden="true" />
    </section>
  );
}

export function ProfileInterests() {
  return (
    <section
      className="profile-interests"
      aria-label="Experience and current interests"
    >
      <div className="profile-interests-list">
        <div className="profile-experience">
          <div className="profile-experience-heading">
            <p className="profile-experience-role">UX Design Intern</p>
            <p className="profile-experience-period">Feb 2026–Present</p>
          </div>
          <a
            href="https://www.optimas.ai/"
            target="_blank"
            rel="noreferrer noopener"
            className="link-hover profile-experience-company"
          >
            Optimas.AI Inc
          </a>
        </div>

        <div className="profile-interest-groups">
          <InterestItem note={'To not be left with just "design" skills'}>
            Dabbling with{' '}
            <InlineLink href="https://threejs.org/">Three.js</InlineLink>
          </InterestItem>

          <InterestItem note="To know why people behave the way they do">
            Currently reading about{' '}
            <InlineLink href="https://thedecisionlab.com/biases">
              cognitive biases
            </InlineLink>
          </InterestItem>

          <InterestItem note="Because, where else?">
            Looking for answers to life at the Gym
          </InterestItem>

          <InterestItem note="Your watchlist can tell me about your taste">
            Enhancing my taste through <InlineHighlight>cinema</InlineHighlight>
          </InterestItem>
        </div>
      </div>
      <div className="profile-divider" aria-hidden="true" />
    </section>
  );
}
