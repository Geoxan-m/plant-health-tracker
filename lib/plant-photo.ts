import { z } from 'zod';
export const photoSchema=z.string().max(220000).regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/);
export const analysisSchema=z.object({
 isPlant:z.boolean(),commonName:z.string().max(120),scientificName:z.string().max(120),
 confidence:z.enum(['low','medium','high']),observations:z.array(z.string().max(500)).max(8),careNotes:z.array(z.string().max(500)).max(8)
}).strict();
