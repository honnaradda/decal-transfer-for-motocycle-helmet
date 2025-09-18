export default async function handler(req: Request) {
  return new Response(JSON.stringify({ ok: true, demo: "token route alive" }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
