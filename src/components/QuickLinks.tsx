const socialLinks = [
  {
    label: 'GitHub',
    icon: '/figma/github.svg',
    href: 'https://github.com/adisada44',
  },
  {
    label: 'LinkedIn',
    icon: '/figma/linkedin.svg',
    href: 'https://www.linkedin.com/in/aditya-sadashiv-907136222/',
  },
  {
    label: 'Compose an email in Gmail',
    icon: '/figma/email.svg',
    href: 'https://mail.google.com/mail/?view=cm&fs=1&to=adisadashiv44%40gmail.com',
  },
  {
    label: 'Behance',
    icon: '/figma/behance.svg',
    href: 'https://www.behance.net/adityasadashiv',
  },
];

export default function QuickLinks() {
  return (
    <footer className="workspace-footer" aria-label="Quick links">
      <div className="workspace-footer-divider" aria-hidden="true" />
      <div className="quick-links-row">
        <nav className="flex items-center gap-6" aria-label="Social links">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={link.label}
              className="quick-link block size-[22px] text-copy"
            >
              <span
                aria-hidden="true"
                className="quick-link-glyph block size-full"
                style={{
                  mask: `url(${link.icon}) center / contain no-repeat`,
                  WebkitMask: `url(${link.icon}) center / contain no-repeat`,
                }}
              />
            </a>
          ))}
        </nav>

        <span
          className="text-[14px] font-semibold leading-[21px] text-copy"
          title="Resume link coming soon"
        >
          Resume
        </span>
      </div>
    </footer>
  );
}
