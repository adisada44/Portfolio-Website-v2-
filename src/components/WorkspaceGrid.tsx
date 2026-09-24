export default function WorkspaceGrid() {
  return (
    <main className="workspace-grid">
      <section className="workspace-status">
        <div className="workspace-empty-state">
          <span className="hammer-motion" aria-hidden="true">
            <img src="/figma/hammer.svg" alt="" className="hammer-icon" />
          </span>

          <div className="workspace-empty-content">
            <div className="workspace-story">
              <p className="workspace-story-copy font-medium text-copy">
                Existing stories are being improved. New stories are being crafted
              </p>

              <div className="flex w-full max-w-[400px] flex-col items-start gap-1">
                <div
                  className="progress-track relative h-3 w-full overflow-hidden rounded-sm bg-white"
                  role="progressbar"
                  aria-label="Portfolio redesign progress: 30 percent"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={30}
                >
                  <div className="progress-fill h-full w-[30%] overflow-hidden bg-gradient-to-r from-progress-start to-progress-end">
                    <div className="progress-runner" aria-hidden="true" />
                  </div>
                </div>
                <p className="progress-caption font-medium text-copy">
                  17 days since redesign
                </p>
              </div>
            </div>

            <div className="project-link-row font-medium text-copy">
              <span>You can check out existing projects</span>
              <a
                href="https://www.behance.net/adityasadashiv"
                target="_blank"
                rel="noreferrer noopener"
                className="link-hover work-link flex items-center gap-px font-semibold text-copy"
              >
                <span>here</span>
                <span
                  aria-hidden="true"
                  className="external-link-icon block size-4"
                  style={{
                    mask: 'url(/figma/arrow-up-right.svg) center / contain no-repeat',
                    WebkitMask:
                      'url(/figma/arrow-up-right.svg) center / contain no-repeat',
                  }}
                />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
