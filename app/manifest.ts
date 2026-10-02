import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rondo",
    short_name: "Rondo",
    description: "Find pickup football and futsal near you, pay in two taps, and run tournaments.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#171512",
    theme_color: "#171512",
    categories: ["sports", "social", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Find a match", url: "/feed", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My matches", url: "/my-games", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
