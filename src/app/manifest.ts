import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Watt & Watts Portal",
    short_name: "Watt & Watts",
    description: "Client follow-ups and history for Watt & Watts",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f2",
    theme_color: "#b45309",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
