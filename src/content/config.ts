import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Ray Huffenreuter'),
    category: z.string().optional(),
    image: z.string().optional(),
    relatedLinks: z.array(z.object({
      href: z.string(),
      label: z.string(),
      description: z.string().optional(),
    })).optional(),
  }),
});

export const collections = { blog };
