import { SectionBlocks } from './SectionBlocks.js';

export class SectionRenderer {
  constructor(container) {
    this.container = container;
    this.blocks = new SectionBlocks();
    this.blockRenderers = this.createBlockRenderers();
  }

  createBlockRenderers() {
    return {
      text: (container, block) => this.blocks.appendTextBlock(container, block),
      media: (container, block) => container.appendChild(this.blocks.createMedia(block)),
      quote: (container, block) => container.appendChild(this.blocks.createQuote(block)),
      list: (container, block) => container.appendChild(this.blocks.createList(block)),
      buttons: (container, block) => container.appendChild(this.blocks.createButtons(block)),
      embed: (container, block) => container.appendChild(this.blocks.createEmbed(block)),
      collage: (container, block) => container.appendChild(this.blocks.createCollage(block)),
      lineGallery: (container, block) => container.appendChild(this.blocks.createLineGallery(block)),
      player: (container, block) => container.appendChild(this.blocks.createPlayer(block)),
      grid: (container, block) => container.appendChild(this.blocks.createGrid(block)),
      video: (container, block) => container.appendChild(this.blocks.createVideo(block))
    };
  }

  render(sections) {
    if (!this.container) return;
    this.container.innerHTML = '';

    sections.forEach((section) => {
      const panel = this.createPanel(section);
      const inner = this.createPanelInner(section.layout);

      section.blocks.forEach((block) => {
        const blockWithContext = {
          ...block,
          layout: section.layout
        };
        const blockEl = this.createBlockContainer(section.layout);
        if (!blockEl) return;
        this.fillBlock(blockEl, blockWithContext);
        inner.appendChild(blockEl);
      });

      panel.appendChild(inner);
      this.container.appendChild(panel);
    });
  }

  createPanel(section) {
    const panel = document.createElement('section');
    panel.className = 'panel';
    if (section.bg) {
      panel.dataset.bg = section.bg;
    }
    return panel;
  }

  createPanelInner(layout) {
    const inner = document.createElement('div');
    if (layout === 'quad') {
      inner.className = 'panel__inner panel__inner--quad';
    } else if (layout === 'stack') {
      inner.className = 'panel__inner panel__inner--stack';
    } else {
      inner.className = 'panel__inner';
    }
    return inner;
  }

  createBlockContainer(layout) {
    if (layout === 'quad') {
      const quad = document.createElement('div');
      quad.className = 'quad reveal';
      return quad;
    }

    const col = document.createElement('div');
    col.className = 'panel__col reveal';
    return col;
  }

  fillBlock(container, block) {
    const textBlocks = new Set(['text', 'quote', 'list', 'buttons']);
    if (textBlocks.has(block.type)) {
      container.classList.add('block--text');
    } else {
      container.classList.add('block--media');
    }

    const renderer = this.blockRenderers[block.type];
    if (renderer) {
      renderer(container, block);
    }
  }
}
