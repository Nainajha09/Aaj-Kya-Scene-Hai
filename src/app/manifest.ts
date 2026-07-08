import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aaj Kya Scene Hai",
    short_name: "Scene Hai",
    description: "Office networking, but make it a scene.",
    start_url: "/profile",
    display: "standalone",
    background_color: "#15132a",
    theme_color: "#15132a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}