import type { Gif } from "./types";

// Add your own free Giphy API key via NEXT_PUBLIC_GIPHY_KEY in .env.local.
// Get one in ~2 min at https://developers.giphy.com/dashboard/.
// (Giphy retired its shared public beta key, so search needs a real key.)
const KEY = process.env.NEXT_PUBLIC_GIPHY_KEY || "";
const BASE = "https://api.giphy.com/v1/gifs";

export const GIPHY_KEY_MISSING = "GIPHY_KEY_MISSING";

type GiphyImage = { url: string; width: string; height: string };
type GiphyItem = {
  title: string;
  images: {
    fixed_width: GiphyImage;
    downsized_medium?: GiphyImage;
  };
};
type GiphyResponse = { data: GiphyItem[] };

function toGif(item: GiphyItem): Gif {
  const img = item.images.downsized_medium ?? item.images.fixed_width;
  return {
    url: img.url,
    width: Number(img.width) || 480,
    height: Number(img.height) || 270,
    title: item.title || "gif",
  };
}

export async function searchGifs(
  query: string,
  signal?: AbortSignal
): Promise<Gif[]> {
  if (!KEY) throw new Error(GIPHY_KEY_MISSING);

  const q = query.trim();
  const endpoint = q
    ? `${BASE}/search?api_key=${KEY}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13&bundle=messaging_non_clips`
    : `${BASE}/trending?api_key=${KEY}&limit=24&rating=pg-13&bundle=messaging_non_clips`;

  const res = await fetch(endpoint, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`Giphy error ${res.status}`);
  const json = (await res.json()) as GiphyResponse;
  return json.data.map(toGif);
}
