export const runtime = "nodejs"; // QUAN TRỌNG: đừng dùng "edge" cho tạo ảnh

const ALLOWED_ORIGIN = process.env.APP_URL || "*";
const BASE = "https://generativelanguage.googleapis.com"; // đích Google

function withCors(resp: Response) {
  const h = new Headers(resp.headers);
  h.set("access-control-allow-origin", ALLOWED_ORIGIN);
  h.set("access-control-expose-headers", "content-type,content-length");
  h.set("cache-control", "no-store");
  return new Response(resp.body, { status: resp.status, headers: h });
}

export default async function handler(req: Request) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": ALLOWED_ORIGIN,
        "access-control-allow-methods": "POST,GET,OPTIONS",
        "access-control-allow-headers": "authorization,content-type",
      },
    });
  }

  // Gộp path còn lại sau /api/gemini
  const url = new URL(req.url);
  const subpath = url.pathname.replace(/^\/api\/gemini/, "") || "/";
  const target = new URL(BASE + subpath + url.search);

  // Gắn API key (nếu chưa có ?key=)
  if (!target.searchParams.has("key")) {
    target.searchParams.set("key", process.env.GEMINI_API_KEY || "");
  }

  // Forward request tới Google (stream luôn)
  const upstream = await fetch(target.toString(), {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") || "application/json",
    },
    body: req.method === "GET" ? undefined : await req.arrayBuffer(),
  });

  return withCors(upstream);
}
