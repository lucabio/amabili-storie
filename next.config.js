// @ts-check
// eslint-disable-next-line @typescript-eslint/no-require-imports -- niente "type": "module" nel package.json, questo file resta CommonJS.
const { withWorkflow } = require("@workflow/next");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack è il bundler di default in Next 16: nessun flag necessario.
  // La root va fissata, altrimenti nei git worktree Turbopack trova più
  // lockfile e sceglie la directory sbagliata.
  turbopack: { root: __dirname },
};

module.exports = withWorkflow(nextConfig);
