"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="page-content">
      <div className="panel empty-state">
        <h1>We couldn’t load your workspace.</h1>
        <p>
          Check your connection and try again. If your session has expired, sign
          in again.
        </p>
        <button className="button button-primary" onClick={reset}>
          Try again
        </button>
        <a className="text-link" href="/login">
          Sign in
        </a>
      </div>
    </main>
  );
}
