// src/types/sections.ts
// Типы для данных секций и блоков контента

// ─── Блоки ───────────────────────────────────────────────────────────────────

export interface TextBlock {
  type: 'text';
  titleTag?: 'h1' | 'h2' | 'h3' | 'h4';
  title?: string;
  titleClass?: string;
  description?: string;
  descriptionClass?: string;
}

export interface MediaItem {
  type: 'media';
  mediaType: 'image' | 'video';
  src: string;
  alt?: string;
  ariaLabel?: string;
  ratio?: string;
  fit?: 'cover' | 'contain';
  lightbox?: boolean;
  lazy?: boolean;
  loading?: 'lazy' | 'eager';
  poster?: string;
  muted?: boolean;
  loop?: boolean;
}

export interface PlayerBlock {
  type: 'player';
  audioSrc: string;
  artworkSrc: string;
  trackTitle: string;
  trackArtist: string;
}

export interface GridBlock {
  type: 'grid';
  gridClass?: string;
  items: MediaItem[];
}

export interface VideoBlock {
  type: 'video';
  src: string;
  ratio?: string;
  poster?: string;
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  author?: string;
}

export interface ListBlock {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface ButtonsBlock {
  type: 'buttons';
  buttons: Array<{ label: string; href: string; external?: boolean }>;
}

export interface EmbedBlock {
  type: 'embed';
  src: string;
  title?: string;
}

export interface CollageBlock {
  type: 'collage';
  items: MediaItem[];
}

export interface LineGalleryBlock {
  type: 'lineGallery';
  items: MediaItem[];
}

/** Все возможные типы блоков */
export type Block =
  | TextBlock
  | MediaItem
  | PlayerBlock
  | GridBlock
  | VideoBlock
  | QuoteBlock
  | ListBlock
  | ButtonsBlock
  | EmbedBlock
  | CollageBlock
  | LineGalleryBlock;

// ─── Секция ──────────────────────────────────────────────────────────────────

export type SectionLayout = 'split' | 'quad' | 'stack' | 'full';

export interface SectionData {
  id: string;
  layout: SectionLayout;
  bg?: string;
  blocks: Block[];
}

