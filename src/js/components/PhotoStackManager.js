/**
 * PhotoStackManager — Static Slider
 *
 * Страница статична (не скроллится).
 * Переключение слайдов: колесо мыши, свайп, клавиши ↑↓.
 * Новый слайд выезжает снизу поверх текущего.
 * Текст появляется плавно после завершения въезда.
 */
export class PhotoStackManager {
  constructor(opts = {}) {
    this.SLIDE_DURATION = opts.slideDuration ?? 720;   // ms анимации въезда
    this.TEXT_DELAY     = opts.textDelay    ?? 60;     // ms задержки текста после въезда
    this.WHEEL_THRESHOLD = opts.wheelThreshold ?? 60;  // px накопленного delta
    this.SWIPE_THRESHOLD = opts.swipeThreshold ?? 50;  // px для свайпа

    this.sections = [];
    this._init();
  }

  _init() {
    const sectionEls = document.querySelectorAll('[data-photo-stack]');
    if (!sectionEls.length) return;

    sectionEls.forEach(el => this._initSection(el));
    document.body.classList.add('has-photo-stack');
  }

  _initSection(sectionEl) {
    const slides = Array.from(sectionEl.querySelectorAll('.photo-stack__slide'));
    if (!slides.length) return;

    const sticky = sectionEl.querySelector('.photo-stack__sticky');

    // Убираем height секции (она больше не нужна для скролла)
    sectionEl.style.height = '';

    // Активируем контейнер сразу
    if (sticky) sticky.classList.add('is-active');

    // Начальное состояние: первый слайд виден, остальные — снизу
    slides.forEach((slide, i) => {
      slide.style.transform = i === 0 ? 'translateY(0)' : 'translateY(100%)';
      slide.classList.remove('is-landed', 'is-text-visible', 'is-entering');
      if (i === 0) {
        slide.classList.add('is-landed');
        // Текст первого слайда показываем сразу
        setTimeout(() => slide.classList.add('is-text-visible'), this.TEXT_DELAY);
      }
    });

    const dots = this._buildProgress(sticky, slides.length);

    const section = {
      el: sectionEl,
      sticky,
      slides,
      count: slides.length,
      dots,
      current: 0,
      isAnimating: false,
      wheelAccum: 0,
      touchStartY: 0,
    };

    this.sections.push(section);
    this._updateDots(section, 0);
    this._bindEvents(section);
  }

  // ─── Индикатор точек ──────────────────────────────────────────────────────

  _buildProgress(sticky, count) {
    const old = sticky && sticky.querySelector('.photo-stack__progress');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.className = 'photo-stack__progress';
    wrap.setAttribute('aria-hidden', 'true');

    const dots = Array.from({ length: count }, (_, i) => {
      const dot = document.createElement('div');
      dot.className = 'photo-stack__dot';
      wrap.appendChild(dot);
      return dot;
    });

    if (sticky) sticky.appendChild(wrap);
    return dots;
  }

  _updateDots(section, index) {
    section.dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });
  }

  // ─── События ──────────────────────────────────────────────────────────────

  _bindEvents(section) {
    const el = section.el;

    // Колесо мыши (накопительный threshold)
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (section.isAnimating) return;

      section.wheelAccum += e.deltaY;
      if (Math.abs(section.wheelAccum) >= this.WHEEL_THRESHOLD) {
        const dir = section.wheelAccum > 0 ? 1 : -1;
        section.wheelAccum = 0;
        this._goTo(section, section.current + dir, dir);
      }
    }, { passive: false });

    // Свайп
    el.addEventListener('touchstart', (e) => {
      section.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (section.isAnimating) return;
      const delta = section.touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) >= this.SWIPE_THRESHOLD) {
        const dir = delta > 0 ? 1 : -1;
        this._goTo(section, section.current + dir, dir);
      }
    }, { passive: true });

    // Клавиатура (глобально, но только при наличии секции)
    document.addEventListener('keydown', (e) => {
      if (section.isAnimating) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        this._goTo(section, section.current + 1, 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        this._goTo(section, section.current - 1, -1);
      }
    });
  }

  // ─── Переход к слайду ─────────────────────────────────────────────────────
  // dir: +1 — вперёд (новый едет снизу), -1 — назад (новый едет сверху)

  _goTo(section, next, dir = 1) {
    const { slides, count, current } = section;

    if (section.isAnimating) return;
    if (next === current) return;
    if (next < 0 || next >= count) return;

    section.isAnimating = true;

    const prevSlide = slides[current];
    const nextSlide = slides[next];

    // Скрываем текст уходящего слайда
    prevSlide.classList.remove('is-text-visible');

    // Стартовая позиция нового слайда: снизу (вперёд) или сверху (назад)
    const startY = dir > 0 ? '100%' : '-100%';
    const parkY  = dir > 0 ? '-100%' : '100%'; // куда прячем старый

    // Позиционируем новый слайд без transition
    nextSlide.style.transition = 'none';
    nextSlide.style.transform = `translateY(${startY})`;
    nextSlide.classList.add('is-entering');

    // Форсируем reflow — браузер «видит» начальную позицию
    void nextSlide.offsetHeight;

    // Запускаем анимацию въезда
    nextSlide.style.transition = `transform ${this.SLIDE_DURATION}ms cubic-bezier(0.76, 0, 0.24, 1)`;
    nextSlide.style.transform = 'translateY(0)';

    // После завершения анимации
    const onEnd = () => {
      nextSlide.removeEventListener('transitionend', onEnd);

      nextSlide.style.transition = '';
      nextSlide.classList.remove('is-entering');
      nextSlide.classList.add('is-landed');

      // Убираем старый слайд под новый
      prevSlide.classList.remove('is-landed');
      // Паркуем предыдущий в противоположную сторону без анимации
      prevSlide.style.transition = 'none';
      prevSlide.style.transform = `translateY(${parkY})`;
      // Сброс transition через кадр
      requestAnimationFrame(() => { prevSlide.style.transition = ''; });

      section.current = next;
      this._updateDots(section, next);

      // Показываем текст с небольшой задержкой
      setTimeout(() => {
        nextSlide.classList.add('is-text-visible');
        section.isAnimating = false;
      }, this.TEXT_DELAY);
    };

    nextSlide.addEventListener('transitionend', onEnd, { once: true });
  }

  // ─── Destroy ──────────────────────────────────────────────────────────────

  destroy() {
    document.body.classList.remove('has-photo-stack');
    this.sections = [];
  }
}
