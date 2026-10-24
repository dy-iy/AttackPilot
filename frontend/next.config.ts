import type { NextConfig } from "next";

// This is a server-only setting. API credentials belong in the backend environment.
const backend = new URL(process.env.ATTACKPILOT_BACKEND_URL || "http://127.0.0.1:8000");
if (!["http:", "https:"].includes(backend.protocol) || backend.username || backend.password
  || backend.pathname !== "/" || backend.search || backend.hash) {
  throw new Error("ATTACKPILOT_BACKEND_URL must be an HTTP(S) origin, such as http://127.0.0.1:8000");
}

const config: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return ["auth", "attackpilot"].map(namespace => ({
      source: `/api/${namespace}/:path*`,
      destination: `${backend.origin}/api/${namespace}/:path*`,
    }));
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default config;
