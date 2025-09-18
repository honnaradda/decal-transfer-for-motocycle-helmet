export default async function handler(req: Request) {
  return new Response(JSON.stringify({ ok: true, demo: "gemini proxy alive" }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
