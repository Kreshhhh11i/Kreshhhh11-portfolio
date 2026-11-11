export async function POST() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return Response.json({ error: "View counter is not configured" }, { status: 503 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["INCR", "portfolio:views"]),
      cache: "no-store",
    });
    const data: { result?: unknown } = await response.json();
    if (!response.ok || typeof data.result !== "number") throw new Error("Counter unavailable");
    return Response.json({ count: data.result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "View counter unavailable" }, { status: 503 });
  }
}
