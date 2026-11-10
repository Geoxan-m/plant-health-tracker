import { env } from 'cloudflare:workers';
export function database() { if (!env.DB) throw new Error('Plant records are temporarily unavailable.'); return env.DB; }
