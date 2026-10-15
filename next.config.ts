import type { NextConfig } from "next";

/**
 * One canonical URL per search intent. Alternate spellings people type or link
 * to are folded into the real page with a permanent redirect.
 */
const PERMANENT_REDIRECTS: [from: string, to: string][] = [
  ["/answer", "/today"],
  ["/answers", "/today"],
  ["/answer-today", "/today"],
  ["/originle-answer", "/today"],
  ["/originle-answer-today", "/today"],
  ["/hint", "/hints"],
  ["/hints-today", "/hints"],
  ["/originle-hints", "/hints"],
  ["/past-answers", "/archive"],
  ["/originle-archive", "/archive"],
  ["/rules", "/how-to-play"],
  ["/how-to-play-originle", "/how-to-play"],
  ["/similar-games", "/games-like-originle"],
  ["/contact", "/about"],
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  // Metadata must be in the first HTML head for crawlers and cached browser responses alike.
  htmlLimitedBots: /.*/,
  async redirects() {
    return PERMANENT_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
