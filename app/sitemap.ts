import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cronly.app";
  return [
    { url: base,           lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/reverse`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/history`, lastModified: new Date(), changeFrequency: "never",  priority: 0.3 },
  ];
}
