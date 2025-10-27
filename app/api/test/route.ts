export async function POST(req: Request) {
  console.log("=== TEST ENDPOINT ===");
  console.log("Headers:", Object.fromEntries(req.headers));
  console.log("Cookies:", req.headers.get("cookie"));
  console.log("Authorization:", req.headers.get("authorization"));

  const body = await req.json();
  console.log("Body:", body);

  return Response.json({
    success: true,
    headers: Object.fromEntries(req.headers),
    authorization: req.headers.get("authorization"),
    cookie: req.headers.get("cookie"),
  });
}
