import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: { extend: { colors: { panel: '#130825', accent: '#7c3aed', soft: '#2a1748' } } },
  plugins: []
};
export default config;
