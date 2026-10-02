// deno run -A tests/render_compare.ts <outDir>   (renders both posters from local files)
import { loadAssets } from "../supabase/functions/_shared/assets.ts";
import { renderPoster } from "../supabase/functions/_shared/posters.ts";

const out = Deno.args[0] ?? ".";
const root = new URL("../assets/", import.meta.url);
const load = async (rel: string) => await Deno.readFile(new URL(rel, root));
const wasm = await Deno.readFile(Deno.env.get("RESVG_WASM")!);
const assets = await loadAssets(load, wasm);

const cases: Record<string, any> = {
  sample: { gender: "Male | Female", class_board: "2nd CBSE", subject: "All Subjects", location: "Kautilya Apartment, Sector 14, Dwarka", city: "New Delhi", pin: "110075" },
  long: { gender: "Female", class_board: "11 CBSE", subject: "Physics, Chemistry, Mathematics, Biology and English", location: "flat 402 sunrise heights near metro station sector 62 noida uttar pradesh", city: "gautam buddh nagar", pin: "201301" },
};
for (const [name, data] of Object.entries(cases)) {
  for (const which of [1, 2] as const) {
    const t0 = performance.now();
    const png = await renderPoster(which, data, assets);
    const ms = performance.now() - t0;
    await Deno.writeFile(`${out}/js_${name}_p${which}.png`, png);
    console.log(`${name} poster ${which}: ${ms.toFixed(0)} ms, ${(png.length / 1024).toFixed(0)} KB`);
  }
}
