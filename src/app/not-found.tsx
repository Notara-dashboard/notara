import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>This page is outside your workspace.</h1>
      <p>Head back to your daily brief.</p>
      <Link className="button button-primary" href="/">
        Back to Today
      </Link>
    </div>
  );
}
