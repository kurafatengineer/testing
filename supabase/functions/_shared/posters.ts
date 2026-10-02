// One entry point for both posters: draw as SVG, rasterise to PNG.
import { Assets } from "./assets.ts";
import { renderAd1Svg, type AdData } from "./poster1.ts";
import { renderAd2Svg } from "./poster2.ts";
import { svgToPng } from "./render.ts";
import { OUT, W } from "./svg.ts";

export type { AdData };

export async function renderPoster(which: 1 | 2, data: AdData, assets: Assets, width = W * OUT): Promise<Uint8Array> {
  const svg = which === 1
    ? renderAd1Svg(data)
    : renderAd2Svg(data, { peopleHref: assets.peopleHref, whatsappHref: assets.whatsappHref });
  return await svgToPng(svg, assets.fontBuffers, width);
}
