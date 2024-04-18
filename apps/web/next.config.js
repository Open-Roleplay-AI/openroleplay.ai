const withMDX = require("@next/mdx")();
const withPWA = require("next-pwa")({
  dest: "public",
});
console.log(process.env.CONVEX_URL);
const {
  CONVEX_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  CLERK_SECRET_KEY,
  OPENAI_API_KEY,
  PERPLEXITY_API_KEY,
  FIREWORKS_API_KEY,
  STABILITY_API_KEY,
  MISTRAL_API_KEY,
} = process.env;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  env: {
    NEXT_PUBLIC_CONVEX_URL: CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: CLERK_SECRET_KEY,
    OPENAI_API_KEY: OPENAI_API_KEY,
    PERPLEXITY_API_KEY: PERPLEXITY_API_KEY,
    FIREWORKS_API_KEY: FIREWORKS_API_KEY,
    STABILITY_API_KEY: STABILITY_API_KEY,
    MISTRAL_API_KEY: MISTRAL_API_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.convex.cloud",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "openroleplay.ai",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "r2.openroleplay.ai",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/shop",
        destination: "/crystals",
        permanent: true,
      },
      {
        source: "/empty-canvas",
        destination: "https://emptycanvas.art/",
        permanent: true,
      },
      {
        source: "/star",
        destination:
          "https://github.com/open-roleplay-ai/openroleplay.ai/stargazers",
        permanent: true,
      },
      {
        source: "/github",
        destination: "https://github.com/open-roleplay-ai/openroleplay.ai",
        permanent: true,
      },
      {
        source: "/discord",
        destination: "https://discord.gg/bM5zzMEtdW",
        permanent: true,
      },
      {
        source: "/docs",
        destination: "https://docs.openroleplay.ai",
        permanent: true,
      },
      {
        source: "/affiliate",
        destination: "https://tally.so/r/3jPAVR",
        permanent: true,
      },
      {
        source: "/content-rules",
        destination: "/safety",
        permanent: true,
      },
    ];
  },
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
};

module.exports = withPWA(withMDX(nextConfig));
