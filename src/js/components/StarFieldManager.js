export class StarFieldManager {
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.colors = options.colors || ['#ffffff', '#8df9ff', '#ffd86b', '#ff9fc6', '#9effa1'];
    this.starChar = options.starChar || '*';
    this.count = options.count || 70;
    this.sizeRange = options.sizeRange || [10, 30];

    this.gravity = options.gravity ?? 120;
    this.bounce = options.bounce ?? 0.78;
    this.friction = options.friction ?? 0.985;
    this.wanderStrength = options.wanderStrength ?? 28;
    this.dragStrength = options.dragStrength ?? 18;
    this.maxSpeed = options.maxSpeed ?? 680;
    this.controlForce = options.controlForce ?? 520;
    this.changeColorOnWallHit = options.changeColorOnWallHit ?? false;
    this.wallHitCooldownMs = options.wallHitCooldownMs ?? 120;
    this.glowBlur = options.glowBlur ?? 0;
    this.glowAlpha = options.glowAlpha ?? 0.6;
    this.glowColor = options.glowColor || '';
    this.fisheyeStrength = options.fisheyeStrength ?? 0;

    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.headerHeight = 0;

    this.particles = [];
    this.lastTime = 0;
    this.rafId = null;

    this.pointer = {
      active: false,
      id: null,
      x: 0,
      y: 0,
      index: -1
    };

    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.reduceMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;

    if (this.reduceMotion) {
      this.count = Math.max(30, Math.round(this.count * 0.6));
      this.wanderStrength *= 0.6;
      this.gravity *= 0.6;
    }

    this.handleResize();
    this.createParticles();
    this.bindEvents();
    this.start();
  }

  bindEvents() {
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', this.handlePointerUp, { passive: true });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  handleVisibility() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  handleResize() {
    if (!this.canvas || !this.ctx) return;

    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    this.dpr = dpr;
    this.width = rect.width;
    this.height = rect.height;

    this.headerHeight = this.getHeaderHeight();

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  createParticles() {
    this.particles = Array.from({ length: this.count }, () => this.createParticle());
  }

  createParticle() {
    const bounds = this.getBounds();
    const size = this.randomRange(this.sizeRange[0], this.sizeRange[1]);
    const radius = size * 0.55;

    const x = this.getSpawnCoordinate(bounds.left, bounds.right, radius, true);
    const y = this.getSpawnCoordinate(bounds.top, bounds.bottom, radius, false);

    return {
      x,
      y,
      vx: this.randomRange(-120, 120),
      vy: this.randomRange(-80, 80),
      size,
      radius,
      mass: Math.max(0.8, size / 18),
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: this.randomRange(0.6, 1.6),
      lastWallHitAt: 0
    };
  }

  start() {
    if (this.rafId) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  stop() {
    if (!this.rafId) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  tick(time) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  update(dt) {
    const bounds = this.getBounds();

    for (const star of this.particles) {
      star.wanderAngle += star.wanderSpeed * dt;
      const wanderX = Math.cos(star.wanderAngle) * this.wanderStrength;
      const wanderY = Math.sin(star.wanderAngle) * this.wanderStrength * 0.6;

      star.vx += wanderX * dt;
      star.vy += (wanderY + this.gravity) * dt;

      if (this.pointer.active && this.pointer.index === star) {
        const dx = this.pointer.x - star.x;
        const dy = this.pointer.y - star.y;
        star.vx += dx * this.dragStrength * dt;
        star.vy += dy * this.dragStrength * dt;
      }

      this.applyKeyControl(star, dt);

      star.vx *= this.friction;
      star.vy *= this.friction;

      const speed = Math.hypot(star.vx, star.vy);
      if (speed > this.maxSpeed) {
        const scale = this.maxSpeed / speed;
        star.vx *= scale;
        star.vy *= scale;
      }

      star.x += star.vx * dt;
      star.y += star.vy * dt;

      let hitWall = false;

      if (star.x - star.radius < bounds.left) {
        star.x = bounds.left + star.radius;
        star.vx = Math.abs(star.vx) * this.bounce;
        hitWall = true;
      } else if (star.x + star.radius > bounds.right) {
        star.x = bounds.right - star.radius;
        star.vx = -Math.abs(star.vx) * this.bounce;
        hitWall = true;
      }

      if (star.y - star.radius < bounds.top) {
        star.y = bounds.top + star.radius;
        star.vy = Math.abs(star.vy) * this.bounce;
        hitWall = true;
      } else if (star.y + star.radius > bounds.bottom) {
        star.y = bounds.bottom - star.radius;
        star.vy = -Math.abs(star.vy) * this.bounce;
        hitWall = true;
      }

      if (hitWall) {
        this.handleWallHit(star);
      }
    }

    this.resolveCollisions();
  }

  handleWallHit(star) {
    if (!this.changeColorOnWallHit) return;

    const now = performance.now();
    if (now - star.lastWallHitAt < this.wallHitCooldownMs) return;

    star.lastWallHitAt = now;
    star.color = this.randomColor(star.color);
  }

  applyKeyControl(star, dt) {
    const ax = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const ay = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    if (ax === 0 && ay === 0) return;

    const magnitude = Math.hypot(ax, ay) || 1;
    const normX = ax / magnitude;
    const normY = ay / magnitude;

    star.vx += normX * this.controlForce * dt;
    star.vy += normY * this.controlForce * dt;
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.keys.left = true;
    if (key === 'arrowright' || key === 'd') this.keys.right = true;
    if (key === 'arrowup' || key === 'w') this.keys.up = true;
    if (key === 'arrowdown' || key === 's') this.keys.down = true;
  }

  handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.keys.left = false;
    if (key === 'arrowright' || key === 'd') this.keys.right = false;
    if (key === 'arrowup' || key === 'w') this.keys.up = false;
    if (key === 'arrowdown' || key === 's') this.keys.down = false;
  }

  resolveCollisions() {
    const items = this.particles;
    const len = items.length;

    for (let i = 0; i < len; i += 1) {
      const a = items[i];
      for (let j = i + 1; j < len; j += 1) {
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist === 0 || dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const totalMass = a.mass + b.mass;
        const aShare = b.mass / totalMass;
        const bShare = a.mass / totalMass;

        a.x -= nx * overlap * aShare;
        a.y -= ny * overlap * aShare;
        b.x += nx * overlap * bShare;
        b.y += ny * overlap * bShare;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal > 0) continue;

        const restitution = 0.7;
        const impulse = -(1 + restitution) * velAlongNormal / totalMass;
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;

        a.vx -= impulseX * b.mass;
        a.vy -= impulseY * b.mass;
        b.vx += impulseX * a.mass;
        b.vy += impulseY * a.mass;
      }
    }
  }

  render() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (const star of this.particles) {
      const display = this.applyFisheye(star.x, star.y);

      this.ctx.font = `${star.size}px "Space Grotesk", sans-serif`;

      if (this.glowBlur > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = this.glowAlpha;
        this.ctx.shadowBlur = this.glowBlur;
        this.ctx.shadowColor = this.glowColor || star.color;
        this.ctx.fillStyle = star.color;
        this.ctx.fillText(this.starChar, display.x, display.y);
        this.ctx.restore();
      }

      this.ctx.fillStyle = star.color;
      this.ctx.fillText(this.starChar, display.x, display.y);
    }
  }

  handlePointerDown(event) {
    if (this.shouldIgnorePointer(event)) return;

    const { clientX, clientY } = event;
    const target = this.findClosestParticle(clientX, clientY);

    if (!target) return;

    this.pointer.active = true;
    this.pointer.id = event.pointerId;
    this.pointer.x = clientX;
    this.pointer.y = clientY;
    this.pointer.index = target;

    event.preventDefault();
  }

  handlePointerMove(event) {
    if (!this.pointer.active || this.pointer.id !== event.pointerId) return;

    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  }

  handlePointerUp(event) {
    if (this.pointer.id !== event.pointerId) return;

    this.pointer.active = false;
    this.pointer.id = null;
    this.pointer.index = -1;
  }

  shouldIgnorePointer(event) {
    const target = event.target;
    if (!target) return false;

    if (target.closest('a, button, input, textarea, select, [role="button"], .menu-trigger')) {
      return true;
    }

    if (target.closest('.lightbox, .video-player, .player, .mobile-menu')) {
      return true;
    }

    return false;
  }

  findClosestParticle(x, y) {
    let closest = null;
    let minDist = Infinity;

    for (const star of this.particles) {
      const dx = star.x - x;
      const dy = star.y - y;
      const dist = Math.hypot(dx, dy);

      if (dist < star.radius * 1.6 && dist < minDist) {
        minDist = dist;
        closest = star;
      }
    }

    return closest;
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  randomColor(prevColor) {
    if (this.colors.length <= 1) return this.colors[0] || '#ffffff';

    let next = prevColor;
    let safety = 0;
    while (next === prevColor && safety < 6) {
      next = this.colors[Math.floor(Math.random() * this.colors.length)];
      safety += 1;
    }
    return next;
  }

  safeRandom(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
    if (max <= min) return min;
    return this.randomRange(min, max);
  }

  getSpawnCoordinate(min, max, radius, isHorizontal) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;

    const span = max - min;
    if (span <= radius * 2) {
      return isHorizontal ? (min + max) / 2 : (min + max) / 2;
    }

    return this.randomRange(min + radius, max - radius);
  }

  getBounds() {
    return {
      left: 0,
      top: 0,
      right: this.width,
      bottom: this.height,
      width: Math.max(0, this.width),
      height: Math.max(0, this.height)
    };
  }

  applyFisheye(x, y) {
    if (!this.fisheyeStrength) return { x, y };

    const cx = this.width / 2;
    const cy = this.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const maxR = Math.max(1, Math.min(this.width, this.height) * 0.5);
    const r = Math.sqrt(dx * dx + dy * dy) / maxR;
    const factor = 1 + this.fisheyeStrength * r * r;

    return {
      x: cx + dx * factor,
      y: cy + dy * factor
    };
  }

  getHeaderHeight() {
    const header = document.querySelector('.page-title');
    if (!header) return 0;

    const rect = header.getBoundingClientRect();
    return rect.height || 0;
  }
}

