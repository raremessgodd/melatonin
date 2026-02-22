// src/content/config.ts
import { defineCollection, z } from 'astro:content';

// ─── Переиспользуемые схемы ───────────────────────────────────────────────────

const mediaItemSchema = z.object({
  type: z.literal('media'),
  mediaType: z.enum(['image', 'video']),
  src: z.string(),
  alt: z.string().optional(),
  ariaLabel: z.string().optional(),
  ratio: z.string().optional(),
  fit: z.enum(['cover', 'contain']).optional(),
  lightbox: z.boolean().optional(),
  lazy: z.boolean().optional(),
  loading: z.enum(['lazy', 'eager']).optional(),
  poster: z.string().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
});

const textBlockSchema = z.object({
  type: z.literal('text'),
  titleTag: z.enum(['h1', 'h2', 'h3', 'h4']).optional(),
  title: z.string().optional(),
  titleClass: z.string().optional(),
  description: z.string().optional(),
  descriptionClass: z.string().optional(),
});

const playerBlockSchema = z.object({
  type: z.literal('player'),
  audioSrc: z.string(),
  artworkSrc: z.string(),
  trackTitle: z.string(),
  trackArtist: z.string(),
});

const gridBlockSchema = z.object({
  type: z.literal('grid'),
  gridClass: z.string().optional(),
  items: z.array(mediaItemSchema),
});

const videoBlockSchema = z.object({
  type: z.literal('video'),
  src: z.string(),
  ratio: z.string().optional(),
  poster: z.string().optional(),
});

const blockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  mediaItemSchema,
  playerBlockSchema,
  gridBlockSchema,
  videoBlockSchema,
]);

// ─── Схема секции ─────────────────────────────────────────────────────────────

const sectionSchema = z.object({
  order: z.number(),
  layout: z.enum(['split', 'quad', 'stack', 'full']),
  bg: z.string().optional(),
  blocks: z.array(blockSchema),
});

// ─── Схема мета-данных страницы ───────────────────────────────────────────────

const pageMetaSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  activePage: z.string().optional(),
  bgImage: z.string().optional(),
  ogImage: z.string().optional(),
  bodyClass: z.string().optional(),
});

// ─── Схема слайда photo-stack (About) ────────────────────────────────────────

const aboutSlideSchema = z.object({
  order: z.number(),
  label: z.string(),
  title: z.string(),
  text: z.string(),
  image: z.string(),
  alt: z.string().optional(),
  loading: z.enum(['eager', 'lazy']).optional(),
});

// ─── Коллекции ────────────────────────────────────────────────────────────────

export const collections = {
  /** Главная страница */
  index: defineCollection({
    type: 'data',
    schema: sectionSchema,
  }),
  /** Страница Farewells */
  farewells: defineCollection({
    type: 'data',
    schema: sectionSchema,
  }),
  /** Мета-данные страниц (title, description, bgImage и т.д.) */
  pages: defineCollection({
    type: 'data',
    schema: pageMetaSchema,
  }),
  /** Слайды photo-stack на странице About */
  about: defineCollection({
    type: 'data',
    schema: aboutSlideSchema,
  }),
};



