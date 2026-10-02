// Draws ONE poster (1 or 2) as a PNG.
//   POST  - used by the bot / form, needs the service key
//   GET   - TESTING ONLY demo: open  .../render-poster?poster=1  (or 2) to see a poster; add &subject=..&city=.. to change the text
import { httpLoader, loadAssets } from "../_shared/assets.ts";
import { renderPoster } from "../_shared/posters.ts";

const ASSET_BASE = Deno.env.get("ASSET_BASE_URL") ?? "https://raw.githubusercontent.com/kurafatengineer/testing/main/assets";

const DEMO = { gender: "Male | Female", class_board: "9 CBSE", subject: "Maths, Science", city: "New Delhi", location: "Gandhi Vihar, Mukherjee Nagar", pin: "110009" };

async function draw(poster: unknown, data: any): Promise<Response> {
  if (poster !== 1 && poster !== 2) return new Response("poster must be 1 or 2", { status: 400 });
  const t0 = performance.now();
  const assets = await loadAssets(httpLoader(ASSET_BASE), fetch(`${ASSET_BASE.replace(/\/+$/, "")}/resvg.wasm`));
  const t1 = performance.now();
  const png = await renderPoster(poster, data, assets);
  const assetsMs = (t1 - t0).toFixed(0), drawMs = (performance.now() - t1).toFixed(0);
  console.log(`poster ${poster}: assets ${assetsMs} ms, draw ${drawMs} ms`);
  return new Response(png as BodyInit, { headers: { "content-type": "image/png", "x-timing": `assets ${assetsMs} ms, draw ${drawMs} ms` } });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      const q = new URL(req.url).searchParams;
      const data = { ...DEMO };
      for (const k of Object.keys(DEMO) as (keyof typeof DEMO)[]) if (q.get(k)) data[k] = q.get(k)!.slice(0, 150);
      return await draw(Number(q.get("poster") ?? 1), data);
    }
    if (req.headers.get("authorization") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
      return new Response("forbidden", { status: 403 });
    }
    const { poster, data } = await req.json();
    return await draw(poster, data);
  } catch (e) {
    console.error("render failed:", e);
    return new Response(`render failed: ${(e as Error).message}`, { status: 500 });
  }
});
