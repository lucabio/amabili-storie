// @ts-check
// eslint-disable-next-line @typescript-eslint/no-require-imports -- niente "type": "module" nel package.json, questo file resta CommonJS.
const { withWorkflow } = require("@workflow/next");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack è il bundler di default in Next 16: nessun flag necessario.
  // La root va fissata, altrimenti nei git worktree Turbopack trova più
  // lockfile e sceglie la directory sbagliata.
  turbopack: { root: __dirname },
  // I .ttf in public/ non finirebbero nel bundle della funzione serverless
  // (public è servito dalla CDN, non dal filesystem della funzione). La route
  // PDF li legge da process.cwd(): li includo esplicitamente nel tracing.
  outputFileTracingIncludes: {
    "/admin/stories/[id]/pdf": ["./public/fonts/**"],
    "/account/stories/[id]/pdf": ["./public/fonts/**"],
  },
  experimental: {
    // Le foto dei luoghi (ASD-10) arrivano a una Server Action: il default di 1MB
    // rifiuta qualsiasi foto da telefono. 9mb = gli 8 MB del bucket più l'overhead
    // del multipart, e sotto i 10MB oltre i quali proxy.js tronca il body in silenzio.
    serverActions: { bodySizeLimit: "9mb" },
  },
};

module.exports = withWorkflow(nextConfig);
