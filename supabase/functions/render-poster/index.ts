// Draws ONE poster (1 or 2) as a PNG. Called only by the bot / form functions, with the service key.
import { httpLoader, loadAssets } from "../_shared/assets.ts";
import { renderPoster } from "../_shared/posters.ts";

const ASSET_BASE = Deno.env.get("ASSET_BASE_URL") ?? "https://raw.githubusercontent.com/kurafatengineer/testing/main/assets";

Deno.serve(async (req) => {
  if (req.headers.get("authorization") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("forbidden", { status: 403 });
  }
  try {
    const { poster, data } = await req.json();
    if (poster !== 1 && poster !== 2) return new Response("poster must be 1 or 2", { status: 400 });
    const t0 = performance.now();
    const assets = await loadAssets(httpLoader(ASSET_BASE), fetch(`${ASSET_BASE.replace(/\/+$/, "")}/resvg.wasm`));
    const t1 = performance.now();
    const png = await renderPoster(poster, data, assets);
    console.log(`poster ${poster}: assets ${(t1 - t0).toFixed(0)} ms, draw ${(performance.now() - t1).toFixed(0)} ms`);
    return new Response(png as BodyInit, { headers: { "content-type": "image/png" } });
  } catch (e) {
    console.error("render failed:", e);
    return new Response(`render failed: ${(e as Error).message}`, { status: 500 });
  }
});
