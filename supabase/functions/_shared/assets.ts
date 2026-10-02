// Loads fonts, images and the renderer's WebAssembly once per function instance.
import { registerFont } from "./fonts.ts";
import { initRenderer } from "./render.ts";

export type AssetLoader = (relPath: string) => Promise<Uint8Array>;
export type Assets = { fontBuffers: Uint8Array[]; peopleHref: string; whatsappHref: string };

const FONT_FILES: Record<string, string> = {
  bebas: "fonts/BebasNeue.ttf",
  pjs200: "fonts/PJS200.ttf",
  pjs500: "fonts/PJS500.ttf",
  pjs600: "fonts/PJS600.ttf",
  pjs700: "fonts/PJS700.ttf",
  pjs800: "fonts/PJS800.ttf",
  poppins: "fonts/Poppins-Black.ttf",
};

export const WASM_URL = "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Loads assets over HTTP, e.g. from the repo's raw GitHub address. */
export function httpLoader(base: string): AssetLoader {
  const root = base.replace(/\/+$/, "");
  return async (rel) => {
    const res = await fetch(`${root}/${rel}`);
    if (!res.ok) throw new Error(`asset ${rel}: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  };
}

let cache: Promise<Assets> | null = null;

/** Safe to call on every request: the work happens once. */
export function loadAssets(load: AssetLoader, wasm: Uint8Array | Promise<Response>): Promise<Assets> {
  cache ??= (async () => {
    const [wasmReady, people, whatsapp, ...fonts] = await Promise.all([
      initRenderer(wasm as any),
      load("people.png"),
      load("whatsapp.png"),
      ...Object.values(FONT_FILES).map((p) => load(p)),
    ]);
    void wasmReady;
    Object.keys(FONT_FILES).forEach((key, i) => registerFont(key, fonts[i]));
    return {
      fontBuffers: fonts,
      peopleHref: `data:image/png;base64,${toBase64(people)}`,
      whatsappHref: `data:image/png;base64,${toBase64(whatsapp)}`,
    };
  })();
  cache.catch(() => { cache = null; }); // a failed start is retried on the next request
  return cache;
}
