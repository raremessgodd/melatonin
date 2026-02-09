export function createPlayIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'video-player__icon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M8 5v14l11-7z');
  svg.appendChild(path);

  return svg;
}

export function createPauseIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'video-player__icon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');

  const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect1.setAttribute('x', '6');
  rect1.setAttribute('y', '4');
  rect1.setAttribute('width', '4');
  rect1.setAttribute('height', '16');

  const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect2.setAttribute('x', '14');
  rect2.setAttribute('y', '4');
  rect2.setAttribute('width', '4');
  rect2.setAttribute('height', '16');

  svg.appendChild(rect1);
  svg.appendChild(rect2);

  return svg;
}

export function createFullscreenIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'video-player__icon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z');
  svg.appendChild(path);

  return svg;
}

