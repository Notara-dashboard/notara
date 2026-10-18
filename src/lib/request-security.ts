// Next's internal request URL can use localhost while the public Host is 127.0.0.1.
// Compare the browser's Origin with the request Host; never allow missing/null origins.
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    const supplied = new URL(origin),
      target = new URL(request.url),
      host = request.headers.get("host") || target.host;
    return (
      supplied.protocol === target.protocol &&
      supplied.host === host &&
      supplied.origin === origin
    );
  } catch {
    return false;
  }
}
export function publicOrigin(request: Request) {
  const target = new URL(request.url);
  return `${target.protocol}//${request.headers.get("host") || target.host}`;
}
