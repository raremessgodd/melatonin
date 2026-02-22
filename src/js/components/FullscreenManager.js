export class FullscreenManager {
  static toggleFullscreen(element) {
    const isFullscreen = document.fullscreenElement ?? document.webkitFullscreenElement;

    if (!isFullscreen) {
      const request = element.requestFullscreen ?? element.webkitRequestFullscreen;
      request?.call(element);
    } else {
      const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
      exit?.call(document);
    }
  }
}

