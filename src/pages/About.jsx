import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()
  return (
    <div className="space-y-8">
      <section className="prose max-w-none">
        <h1 className="mb-2">{t('about.title')}</h1>
        <p>
          We build modern biometric solutions that make identity verification fast,
          secure, and delightful. From fingerprint enrollment to lightning‑quick
          1:N matching, our platform is designed for reliability at scale and
          developer‑friendly integration.
        </p>
      </section>

      {/* Visual comparison using DaisyUI diff component */}
      <section>
        <figure className="diff w-full max-w-xl mx-auto h-64 rounded-lg border border-base-300 overflow-hidden" tabIndex={0}>
          <div className="diff-item-1" role="img" tabIndex={0}>
            <img
              alt="Biometric scan with detail"
              src="https://img.daisyui.com/images/stock/photo-1560717789-0ac7c58ac90a.webp"
            />
          </div>
          <div className="diff-item-2" role="img">
            <img
              alt="Biometric scan blurred preview"
              src="https://img.daisyui.com/images/stock/photo-1560717789-0ac7c58ac90a-blur.webp"
            />
          </div>
          <div className="diff-resizer"></div>
        </figure>
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Fingerprint Enrollment</h3>
              <p className="text-sm text-base-content/70">
                High‑quality capture flows with liveness guidance and instant
                quality feedback to reduce retries.
              </p>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Real‑time Verification</h3>
              <p className="text-sm text-base-content/70">
                Fast 1:1 checks and scalable 1:N matching with confidence scores
                and audit logs.
              </p>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Secure Storage</h3>
              <p className="text-sm text-base-content/70">
                Encrypted templates, role‑based access, and region‑aware data
                residency to meet compliance requirements.
              </p>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Analytics &amp; Monitoring</h3>
              <p className="text-sm text-base-content/70">
                Operational dashboards for throughput, match rates, device
                health, and user behavior.
              </p>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Developer APIs</h3>
              <p className="text-sm text-base-content/70">
                Simple REST and Webhooks, SDKs, and examples to integrate in
                minutes.
              </p>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Device Support</h3>
              <p className="text-sm text-base-content/70">
                Works with popular scanner hardware. WebUSB and desktop bridge
                options available.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100">
        <div className="card-body items-start gap-4 md:flex md:items-center md:justify-between">
          <div>
            <h3 className="card-title">Ready to get started?</h3>
            <p className="text-sm text-base-content/70">
              Explore the scanner demo, try matching, or search users.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/scanner" className="btn btn-primary">{t('home.openScanner')}</a>
            <a href="/search" className="btn btn-secondary">{t('search.search')}</a>
          </div>
        </div>
      </section>
    </div>
  )
}
