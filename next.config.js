// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack è il bundler di default in Next 16: nessun flag necessario.
  // La root va fissata, altrimenti nei git worktree Turbopack trova più
  // lockfile e sceglie la directory sbagliata.
  turbopack: { root: __dirname },
};

module.exports = nextConfig;
