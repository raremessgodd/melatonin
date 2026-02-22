const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {string} className
 * @param {Array<{tag: string, attrs: Record<string, string>}>} shapes
 */
function createSvgIcon(className, shapes) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');

  shapes.forEach(({ tag, attrs }) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    svg.appendChild(el);
  });

  return svg;
}

const PLAY_PATH  = 'M8 5v14l11-7z';
const PAUSE_RECTS = [
  { tag: 'rect', attrs: { x: '6',  y: '4', width: '4', height: '16' } },
  { tag: 'rect', attrs: { x: '14', y: '4', width: '4', height: '16' } }
];

export function createPlayIcon() {
  return createSvgIcon('video-player__icon', [{ tag: 'path', attrs: { d: PLAY_PATH } }]);
}

export function createPauseIcon() {
  return createSvgIcon('video-player__icon', PAUSE_RECTS);
}

export function createFullscreenIcon() {
  return createSvgIcon('video-player__icon', [
    { tag: 'path', attrs: { d: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z' } }
  ]);
}

export function createAudioPlayIcon() {
  return createSvgIcon('audio-player__icon', [{ tag: 'path', attrs: { d: PLAY_PATH } }]);
}

export function createAudioPauseIcon() {
  return createSvgIcon('audio-player__icon', PAUSE_RECTS);
}
