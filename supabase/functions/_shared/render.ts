// SVG -> PNG with resvg compiled to WebAssembly (works in Supabase Edge Functions).
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";

let ready: Promise<void> | null = null;

/** Call once per cold start. `wasm` = bytes of index_bg.wasm (or a fetch Response). */
export function initRenderer(wasm: Uint8Array | Response | Promise<Response>): Promise<void> {
  ready ??= initWasm(wasm as any);
  return ready;
}

export async function svgToPng(svg: string, fontBuffers: Uint8Array[], width = 2160): Promise<Uint8Array> {
  await ready;
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: "BebasX" },
  });
  const img = r.render();
  const png = img.asPng();
  img.free();
  r.free();
  return png;
}
