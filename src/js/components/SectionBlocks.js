import {
  getResponsiveImagePaths,
  getMaxQualityPath,
  getHLSPath
} from '../utils/MediaUtils.js';
import {
  createPlayIcon,
  createFullscreenIcon,
  createAudioPlayIcon,
  createAudioPauseIcon
} from '../utils/SvgIcons.js';

export class SectionBlocks {
  appendTextBlock(container, block) {
    if (block.title) {
      const heading = document.createElement(block.titleTag || 'h1');
      if (block.titleClass) {
        heading.className = block.titleClass;
      }
      heading.textContent = block.title;
      container.appendChild(heading);
    }

    if (block.description) {
      const paragraph = document.createElement('p');
      if (block.descriptionClass) {
        paragraph.className = block.descriptionClass;
      }
      paragraph.textContent = block.description;
      container.appendChild(paragraph);
    }
  }

  createResponsiveImage(block, options = {}) {
    const img = document.createElement('img');
    const shouldLazyLoad = block.lazy !== false;
    const responsivePaths = getResponsiveImagePaths(block.src);

    img.dataset.originalSrc = getMaxQualityPath(block.src);

    if (shouldLazyLoad) {
      img.dataset.src = responsivePaths.src;
      if (responsivePaths.srcset) {
        img.dataset.srcset = responsivePaths.srcset;
      }
      if (responsivePaths.sizes) {
        img.dataset.sizes = responsivePaths.sizes;
      }
      img.dataset.lazyMedia = 'image';
    } else {
      img.src = responsivePaths.src;
      if (responsivePaths.srcset) {
        img.srcset = responsivePaths.srcset;
      }
      if (responsivePaths.sizes) {
        img.sizes = responsivePaths.sizes;
      }
    }

    img.alt = block.alt || '';
    img.loading = block.loading || 'lazy';
    img.decoding = 'async';
    img.className = `media-content ${block.fit || ''}`.trim();

    if (options.className) {
      img.className = options.className;
    }

    if (options.forceLazy) {
      img.dataset.lazyMedia = 'image';
    }

    return img;
  }

  createVideoElement(block) {
    const video = document.createElement('video');
    const shouldLazyLoad = block.lazy !== false;

    const hlsPath = getHLSPath(block.src);
    video.dataset.hlsSrc = hlsPath;

    video.dataset.originalSrc = getMaxQualityPath(block.src);

    if (shouldLazyLoad) {
      video.dataset.lazyMedia = 'video';
    }

    video.dataset.video = '';
    video.autoplay = false;
    video.muted = block.muted ?? true;
    video.controls = false;
    video.playsInline = true;
    video.loop = block.loop ?? true;
    video.preload = 'none';

    const posterPath = this.getVideoPosterPath(block.src);
    if (posterPath) {
      video.poster = posterPath;
      video.setAttribute('data-poster-preload', posterPath);
    } else if (block.poster) {
      video.poster = block.poster;
    } else if (block.posterAuto !== false) {
      video.dataset.posterAuto = '1';
    }

    video.className = `media-content ${block.fit || ''}`.trim();

    return video;
  }

  createVideoControls(video) {
    const centerToggle = document.createElement('button');
    centerToggle.type = 'button';
    centerToggle.className = 'video-player__center-toggle';
    centerToggle.setAttribute('aria-label', 'Воспроизведение');
    centerToggle.setAttribute('tabindex', '0');
    centerToggle.appendChild(createPlayIcon());

    const controls = document.createElement('div');
    controls.className = 'video-player__controls';

    const seek = document.createElement('input');
    seek.type = 'range';
    seek.min = '0';
    seek.max = '100';
    seek.step = '0.1';
    seek.value = '0';
    seek.className = 'video-player__seek';
    seek.setAttribute('aria-label', 'Перемотка видео');
    seek.dataset.videoSeek = '';

    const volume = document.createElement('input');
    volume.type = 'range';
    volume.min = '0';
    volume.max = '1';
    volume.step = '0.01';
    volume.value = video.muted ? '0' : '1';
    volume.className = 'video-player__volume';
    volume.setAttribute('aria-label', 'Громкость');
    volume.dataset.videoVolume = '';

    const fullscreen = document.createElement('button');
    fullscreen.type = 'button';
    fullscreen.className = 'video-player__fullscreen';
    fullscreen.setAttribute('aria-label', 'Полный экран');
    fullscreen.dataset.videoFullscreen = '';
    fullscreen.appendChild(createFullscreenIcon());

    controls.appendChild(seek);
    controls.appendChild(volume);
    controls.appendChild(fullscreen);

    return { centerToggle, controls };
  }

  createMedia(block) {
    const wrapper = document.createElement('div');
    wrapper.className = `media-wrapper ${block.ratio ? `ratio-${block.ratio}` : ''}`.trim();

    if (block.lightbox) {
      wrapper.dataset.lightbox = '';
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      if (block.ariaLabel) {
        wrapper.setAttribute('aria-label', block.ariaLabel);
      }
    }

    if (block.mediaType === 'video') {
      wrapper.classList.add('video-player');
      wrapper.dataset.videoPlayer = '';

      const video = this.createVideoElement(block);
      wrapper.appendChild(video);

      const { centerToggle, controls } = this.createVideoControls(video);
      wrapper.appendChild(centerToggle);
      wrapper.appendChild(controls);
    } else {
      const img = this.createResponsiveImage(block);
      wrapper.appendChild(img);
    }

    return wrapper;
  }

  createQuote(block) {
    const wrapper = document.createElement('blockquote');
    wrapper.className = 'block-quote';

    const text = document.createElement('p');
    text.className = 'block-quote__text';
    text.textContent = block.text || '';
    wrapper.appendChild(text);

    if (block.cite) {
      const cite = document.createElement('div');
      cite.className = 'block-quote__cite';
      cite.textContent = block.cite;
      wrapper.appendChild(cite);
    }

    return wrapper;
  }

  createList(block) {
    const list = document.createElement(block.ordered ? 'ol' : 'ul');
    list.className = 'block-list';

    (block.items || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    return list;
  }

  createButtons(block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'block-actions';

    (block.items || []).forEach((item) => {
      const link = document.createElement('a');
      link.className = 'block-button';
      link.href = item.href || '#';
      link.textContent = item.label || '';
      link.target = item.target || '_blank';
      link.rel = 'noopener';
      wrapper.appendChild(link);
    });

    return wrapper;
  }

  createEmbed(block) {
    const wrapper = document.createElement('div');
    const ratioClass = block.ratio ? `ratio-${block.ratio}` : 'ratio-16-9';
    wrapper.className = `media-wrapper ${ratioClass} block-embed`;

    const iframe = document.createElement('iframe');
    iframe.src = block.src || '';
    iframe.title = block.title || 'Embedded content';
    iframe.loading = 'lazy';
    iframe.allow = block.allow || 'autoplay; fullscreen; picture-in-picture';
    iframe.referrerPolicy = 'no-referrer';
    wrapper.appendChild(iframe);

    return wrapper;
  }

  createCollage(block) {
    const wrapper = document.createElement('div');
    wrapper.className = block.gridClass || 'collage-grid';

    (block.items || []).forEach((item) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'collage__item';
      const node = item.type === 'media'
        ? this.createMedia(item)
        : this.createNestedBlock(item);
      if (node) {
        if (item.type === 'text') {
          itemWrapper.classList.add('collage__text');
        }
        itemWrapper.appendChild(node);
        wrapper.appendChild(itemWrapper);
      }
    });

    return wrapper;
  }


  createPlayer(block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-player';

    const audio = document.createElement('audio');
    audio.id = 'album-audio';
    audio.preload = 'metadata';

    const source = document.createElement('source');
    source.src = block.audioSrc;
    source.type = 'audio/mpeg';
    audio.appendChild(source);
    wrapper.appendChild(audio);

    const artwork = document.createElement('div');
    artwork.className = 'player-artwork';
    artwork.dataset.lightbox = '';
    artwork.setAttribute('role', 'button');
    artwork.setAttribute('tabindex', '0');
    artwork.setAttribute('aria-label', 'Обложка альбома');

    const img = this.createResponsiveImage({
      src: block.artworkSrc,
      alt: 'Album Artwork',
      lazy: true,
      fit: '',
      loading: 'lazy'
    }, {
      className: 'artwork-image',
      forceLazy: true
    });
    artwork.appendChild(img);

    wrapper.appendChild(artwork);

    const controls = document.createElement('div');
    controls.className = 'player-controls';

    const trackInfo = document.createElement('div');
    trackInfo.className = 'track-info';

    const trackTitle = document.createElement('h3');
    trackTitle.className = 'track-title text-center';
    trackTitle.textContent = block.trackTitle || '';
    trackInfo.appendChild(trackTitle);

    const trackArtist = document.createElement('p');
    trackArtist.className = 'track-artist text-center';
    trackArtist.textContent = block.trackArtist || '';
    trackInfo.appendChild(trackArtist);

    controls.appendChild(trackInfo);

    const controlButtons = document.createElement('div');
    controlButtons.className = 'control-buttons';

    const playPause = document.createElement('button');
    playPause.className = 'play-pause-btn';
    playPause.dataset.audioToggle = '';
    playPause.setAttribute('aria-label', 'Play/Pause');

    const playIcon = document.createElement('span');
    playIcon.className = 'play-icon';
    playIcon.appendChild(createAudioPlayIcon());
    playPause.appendChild(playIcon);

    const pauseIcon = document.createElement('span');
    pauseIcon.className = 'pause-icon';
    pauseIcon.style.display = 'none';
    pauseIcon.appendChild(createAudioPauseIcon());
    playPause.appendChild(pauseIcon);

    controlButtons.appendChild(playPause);

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = '0%';
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'time-display';

    const currentTime = document.createElement('span');
    currentTime.className = 'current-time';
    currentTime.textContent = '0:00';
    timeDisplay.appendChild(currentTime);

    const totalTime = document.createElement('span');
    totalTime.className = 'total-time';
    totalTime.textContent = '0:00';
    timeDisplay.appendChild(totalTime);

    progressContainer.appendChild(timeDisplay);
    controlButtons.appendChild(progressContainer);
    controls.appendChild(controlButtons);
    wrapper.appendChild(controls);

    return wrapper;
  }

  createGrid(block) {
    const grid = document.createElement('div');
    grid.className = block.gridClass || 'grid-2-fill';

    (block.items || []).forEach((item) => {
      const itemWithContext = {
        ...item,
        gridClass: block.gridClass,
        context: 'grid'
      };
      const node = item.type === 'media'
        ? this.createMedia(itemWithContext)
        : this.createNestedBlock(itemWithContext);
      if (node) {
        grid.appendChild(node);
      }
    });

    return grid;
  }

  createNestedBlock(item) {
    switch (item.type) {
      case 'text': {
        const wrapper = document.createElement('div');
        this.appendTextBlock(wrapper, item);
        return wrapper;
      }
      case 'quote':
        return this.createQuote(item);
      case 'list':
        return this.createList(item);
      case 'buttons':
        return this.createButtons(item);
      case 'embed':
        return this.createEmbed(item);
      case 'collage':
        return this.createCollage(item);
      case 'video':
        return this.createVideo(item);
      case 'player':
        return this.createPlayer(item);
      case 'grid':
        return this.createGrid(item);
      case 'media':
      default:
        return this.createMedia(item);
    }
  }

  createVideo(block) {
    return this.createMedia({
      ...block,
      mediaType: 'video',
      ratio: block.ratio || '16-9'
    });
  }

  getVideoPosterPath(videoSrc) {
    if (!videoSrc) return null;

    const fileName = videoSrc.split('/').pop();
    const baseName = fileName.includes('.') ? fileName.split('.').slice(0, -1).join('.') : fileName;

    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 768;

    if (!isMobile) {
      const bigVersions = [
        `assets/img/covers/${baseName}_cover_big.jpeg`,
        `assets/img/covers/${baseName}_cover_big.jpg`,
        `assets/img/covers/${baseName}_cover_big.png`,
      ];

      for (const posterPath of bigVersions) {
        const img = new Image();
        img.onerror = null;
        img.src = posterPath;
        if (img.complete && img.width > 0) {
          return posterPath;
        }
      }
    }

    const regularVersions = [
      `assets/img/covers/${baseName}_cover.jpeg`,
      `assets/img/covers/${baseName}_cover.jpg`,
      `assets/img/covers/${baseName}_cover.png`,
    ];

    return regularVersions[0];
  }
}

