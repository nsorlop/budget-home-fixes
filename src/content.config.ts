import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(['Painting', 'Wallpaper', 'Kitchen', 'Storage', 'Guides']),
    image: z.string(),
    imageAlt: z.string(),
  }),
});

export const collections = { blog };
