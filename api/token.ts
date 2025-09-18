export const runtime = "edge";
export default async function handler(_req: Request) {
  return new Response(JSON.stringify({ ok: true, route: "token" }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
