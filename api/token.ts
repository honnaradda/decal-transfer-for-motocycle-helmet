export const runtime = "edge";

export default async function handler(_req: Request) {
  const body = { token: "ok", expiresInSec: 1800 };
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": process.env.APP_URL || "*",
      "cache-control": "no-store",
    },
  });
}
