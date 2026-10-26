import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const isUser = !user || user.role === "user";
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Tudun Wada community platform</span>
          <h1>When every detail matters, keep the community connected.</h1>
          <p>
            A clearer way to report local incidents, follow their progress and keep designated community responders informed.
          </p>
          <div className="btn-row">
            {isUser ? (
              <Link className="btn btn-lg" to="/report">Report an incident <span aria-hidden="true">-&gt;</span></Link>
            ) : (
              <Link className="btn btn-lg" to="/dashboard">Open your dashboard <span aria-hidden="true">-&gt;</span></Link>
            )}
            {!user && <Link className="btn btn-lg btn-outline-light" to="/about">How it works</Link>}
          </div>
          <div className="hero-subline">One shared place to report, review and track community incidents.</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit" />
          <div className="hero-core"><span>!</span></div>
          <div className="hero-note note-top"><span className="note-kicker">Community reports</span><strong>One clear record</strong><span>Details stay organized</span></div>
          <div className="hero-note note-bottom"><span className="note-kicker">Follow progress</span><strong>Updates in one place</strong><span>From report to resolution</span></div>
        </div>
      </section>
      <section aria-labelledby="how-it-works">
        <div className="section-heading">
          <div>
            <h2 id="how-it-works">A more organized response starts here</h2>
            <p>Clear steps for residents and designated responders.</p>
          </div>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Share the details</h3>
            <p>Residents submit an incident type, a useful location and the details responders need to review.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Review and coordinate</h3>
            <p>Designated responders review incoming reports, manage assignments and record progress.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Follow each update</h3>
            <p>Residents and staff can follow a report's status and see its recorded incident history.</p>
          </article>
        </div>
      </section>
      <aside className="trust-strip" aria-label="Emergency service notice">
        <span className="trust-mark" aria-hidden="true">!</span>
        <div>
          <strong>For immediate, life-threatening danger, contact emergency services directly.</strong>
          <p>This platform records and tracks reports for community responders. It does not automatically contact or dispatch police, fire or ambulance services. In Nigeria, call 112.</p>
        </div>
      </aside>
    </>
  );
}
