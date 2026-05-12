// js/loader-animation.js
class PageLoader {
  constructor(options = {}) {
    this.options = {
      minDuration: options.minDuration || 2000,
      removeAfter: options.removeAfter || 500,
      loaderId: options.loaderId || 'loaderOverlay',
      contentId: options.contentId || 'mainContent',
      ...options
    };
    
    this.loader = null;
    this.content = null;
    this.animationActive = false;
    this.animationFrameId = null;
    this.startTime = null;
    this.isFinished = false;
    this._loadHandler = null;
    this._safetyTimer = null;
    this._physicsTimer = null;
  }

  createLoaderHTML() {
    return `
      <div class="loader-overlay" id="${this.options.loaderId}">
        <div class="loader-logo-container">
          <img class="logo-img" src="SVG/logo-2.svg" alt="Знак" loading="eager">
          <img class="logo-img" src="SVG/logo.svg" alt="Логотип" loading="eager">
        </div>
        <div class="juggling-stage" id="jugglingStage">
          <div class="ball red" id="ball1"></div>
          <div class="ball blue" id="ball2"></div>
          <div class="ball light" id="ball3"></div>
        </div>
        <div class="loader-caption">
          щас загрузится
          <div class="dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    `;
  }

  injectStyles() {
    if (document.getElementById('loader-animation-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'loader-animation-styles';
    styles.textContent = `
      .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #FFFFFF;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }

      .loader-overlay.fade-out {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .loader-logo-container {
        margin-bottom: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }

      .loader-logo-container .logo-img {
        height: 56px;
        width: auto;
        object-fit: contain;
      }

      .juggling-stage {
        position: relative;
        width: 200px;
        height: 180px;
        margin: 0 auto 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
      }

      .ball {
        position: absolute;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid #1A1718;
        will-change: transform;
        transition: none;
        top: 0;
        left: 0;
      }

      .ball.red { background: #E8454D; box-shadow: 4px 4px 0 #1A1718; }
      .ball.blue { background: #2A3D5E; box-shadow: 4px 4px 0 #1A1718; }
      .ball.light { background: #DCE4F0; box-shadow: 4px 4px 0 #1A1718; }

      .loader-caption {
        font-family: 'Unbounded', sans-serif;
        font-weight: 600;
        font-size: 14px;
        color: #5A5556;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding-top: 8px;
      }

      .loader-caption .dots {
        display: inline-flex;
        gap: 4px;
      }

      .loader-caption .dots span {
        width: 5px;
        height: 5px;
        background: #E8454D;
        border-radius: 50%;
        animation: dotPulse 1.2s infinite ease-in-out;
      }

      .loader-caption .dots span:nth-child(2) { animation-delay: 0.2s; }
      .loader-caption .dots span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes dotPulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
        40% { opacity: 1; transform: scale(1.4); }
      }

      body.loader-active .shop-container:not(.visible),
      body.loader-active .page-content:not(.visible),
      body.loader-active [data-content-wrapper]:not(.visible) {
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        pointer-events: none;
      }

      body:not(.loader-active) .shop-container,
      body:not(.loader-active) .page-content,
      body:not(.loader-active) [data-content-wrapper] {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
      }

      .shop-container.visible,
      .page-content.visible,
      [data-content-wrapper].visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
      }

      body.loader-active {
        overflow: hidden !important;
        padding-top: 0 !important;
      }

      @media (max-width: 500px) {
        .ball { width: 40px; height: 40px; border-width: 2px; }
        .juggling-stage { width: 160px; height: 160px; margin-bottom: 28px; }
        .loader-logo-container .logo-img { height: 44px; }
        .loader-logo-container { gap: 14px; margin-bottom: 40px; }
        .loader-caption { font-size: 12px; }
      }
    `;
    document.head.appendChild(styles);
  }

  initJuggling() {
    const stage = document.getElementById('jugglingStage');
    const ball1 = document.getElementById('ball1');
    const ball2 = document.getElementById('ball2');
    const ball3 = document.getElementById('ball3');

    if (!stage || !ball1 || !ball2 || !ball3) return;

    this.animationActive = true;
    this.startTime = Date.now();

    const centerX = stage.offsetWidth / 2;
    const centerY = stage.offsetHeight / 2;
    const radiusX = 55;
    const radiusY = 50;
    let angle = 0;
    const phase1 = 0;
    const phase2 = (2 * Math.PI) / 3;
    const phase3 = (4 * Math.PI) / 3;
    const speed = 0.075;

    const setBallPosition = (ball, currentAngle) => {
      const halfWidth = ball.offsetWidth / 2;
      const halfHeight = ball.offsetHeight / 2;
      const x = radiusX * Math.cos(currentAngle);
      const y = radiusY * Math.sin(currentAngle * 2);
      const left = centerX + x - halfWidth;
      const top = centerY + y - halfHeight;
      
      ball.style.transform = `translate(${left}px, ${top}px)`;
      
      const scaleFactor = 0.88 + 0.24 * ((Math.sin(currentAngle * 2) + 1) / 2);
      ball.style.width = `${48 * scaleFactor}px`;
      ball.style.height = `${48 * scaleFactor}px`;
    };

    const animate = () => {
      if (!this.animationActive) return;
      angle = (angle + speed) % (2 * Math.PI);
      
      setBallPosition(ball1, angle + phase1);
      setBallPosition(ball2, angle + phase2);
      setBallPosition(ball3, angle + phase3);
      
      this.animationFrameId = requestAnimationFrame(animate);
    };

    setBallPosition(ball1, phase1);
    setBallPosition(ball2, phase2);
    setBallPosition(ball3, phase3);
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  finish() {
    if (!this.animationActive || this.isFinished) return;
    
    this.animationActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this._safetyTimer) {
      clearTimeout(this._safetyTimer);
      this._safetyTimer = null;
    }
    
    if (this._physicsTimer) {
      clearTimeout(this._physicsTimer);
      this._physicsTimer = null;
    }

    const stage = document.getElementById('jugglingStage');
    const balls = [
      document.getElementById('ball1'), 
      document.getElementById('ball2'), 
      document.getElementById('ball3')
    ];
    
    if (!stage || balls.some(b => !b)) {
      this.hideLoader();
      return;
    }

    const groundY = stage.offsetHeight + 30;
    let completedBalls = 0;
    
    balls.forEach((ball, index) => {
      const style = ball.style.transform || 'translate(0px, 0px)';
      const match = style.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      let startX = match ? parseFloat(match[1]) : 0;
      let startY = match ? parseFloat(match[2]) : 0;

      const targetX = startX + (index - 1) * 35;
      let velY = 1.2;
      let velX = (targetX - startX) * 0.08;
      let posX = startX;
      let posY = startY;
      let opacity = 1;
      let bounceCount = 0;
      const gravity = 1.0;
      const bounceFactor = 0.2;
      
      const physicsStep = () => {
        if (this.isFinished) {
          ball.style.opacity = '0';
          return;
        }
        
        velY += gravity;
        posY += velY;
        posX += velX;
        
        if (posY >= groundY - 48) {
          posY = groundY - 48;
          velY = -velY * bounceFactor;
          velX *= 0.6;
          bounceCount++;
        }
        
        if (Math.abs(velY) < 0.5 && posY >= groundY - 50) {
          posY = groundY - 48;
          velY = 0;
          velX = 0;
        }
        
        ball.style.transform = `translate(${posX}px, ${posY}px)`;
        ball.style.width = '48px';
        ball.style.height = '48px';
        
        if (bounceCount >= 2 && Math.abs(velY) < 0.7) {
          opacity -= 0.05;
          ball.style.opacity = Math.max(opacity, 0);
        }
        
        if (opacity > 0.02 && (Math.abs(velY) > 0.1 || bounceCount < 3)) {
          requestAnimationFrame(physicsStep);
        } else {
          ball.style.opacity = '0';
          completedBalls++;
          if (completedBalls >= 3) {
            setTimeout(() => this.hideLoader(), 200);
          }
        }
      };
      
      setTimeout(() => physicsStep(), index * 60);
    });

    this._physicsTimer = setTimeout(() => {
      if (!this.isFinished) {
        this.hideLoader();
      }
    }, 1500);
  }

  hideLoader() {
    if (this.isFinished) return;
    this.isFinished = true;
    
    document.body.classList.remove('loader-active');
    document.body.style.overflow = '';
    
    // Вспомогательная функция: делает элемент видимым и убирает transform
    const showAndFix = (el) => {
      if (!el) return;
      el.classList.add('visible');
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      // Принудительно сбрасываем transform, чтобы не мешать position: fixed
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('will-change', 'auto', 'important');
    };
    
    showAndFix(this.content);
    
    const shopContainer = document.querySelector('.shop-container');
    if (shopContainer && shopContainer !== this.content) {
    showAndFix(shopContainer);
    // Убираем clipping, чтобы fixed-элементы (бургер) не обрезались
    shopContainer.style.setProperty('overflow', 'visible', 'important');
    shopContainer.style.setProperty('overflow-x', 'visible', 'important');
    shopContainer.style.setProperty('overflow-y', 'visible', 'important');
}
    
    document.body.style.background = '#FFFFFF';
    
    if (this.loader) {
      this.loader.classList.add('fade-out');
    }
    
    setTimeout(() => {
      if (this.loader && this.loader.parentNode) {
        this.loader.remove();
        this.loader = null;
      }
      this.dispatchEvent('loaderHidden');
      this.destroy();
    }, this.options.removeAfter);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this._safetyTimer) {
      clearTimeout(this._safetyTimer);
      this._safetyTimer = null;
    }
    if (this._physicsTimer) {
      clearTimeout(this._physicsTimer);
      this._physicsTimer = null;
    }
    if (this._loadHandler) {
      window.removeEventListener('load', this._loadHandler);
      this._loadHandler = null;
    }
    this.animationActive = false;
  }

  dispatchEvent(name) {
    window.dispatchEvent(new CustomEvent(name, { detail: { loader: this } }));
  }

  init(contentSelector = null) {
    if (document.getElementById(this.options.loaderId)) {
      console.warn('PageLoader: лоадер уже существует в DOM');
      return this;
    }
    
    this.injectStyles();
    
    document.body.classList.add('loader-active');
    document.body.style.overflow = 'hidden';
    
    const temp = document.createElement('div');
    temp.innerHTML = this.createLoaderHTML();
    const loaderElement = temp.firstElementChild;
    document.body.insertBefore(loaderElement, document.body.firstChild);
    
    this.loader = document.getElementById(this.options.loaderId);
    
    if (contentSelector) {
      this.content = document.querySelector(contentSelector);
    }
    
    if (!this.content) {
      this.content = document.getElementById(this.options.contentId);
    }
    
    if (!this.content) {
      this.content = document.querySelector('.page-content') ||
                     document.querySelector('[data-content-wrapper]');
    }
    
    if (!this.content) {
      this.content = document.querySelector('.shop-container');
    }
    
    if (this.content && this.content.classList.contains('shop-container')) {
      const mainContent = this.content.querySelector('#mainContent');
      if (mainContent) {
        this.content = mainContent;
      }
    }
    
    if (!this.content) {
      console.warn('PageLoader: контент не найден, скрываем лоадер');
      setTimeout(() => this.hideLoader(), 100);
      return this;
    }
    
    console.log('PageLoader: контент найден:', this.content.id || this.content.className);
    
    setTimeout(() => this.initJuggling(), 100);
    
    this._loadHandler = () => {
      const elapsed = Date.now() - (this.startTime || Date.now());
      const remaining = Math.max(0, this.options.minDuration - elapsed);
      
      setTimeout(() => {
        if (!this.isFinished) {
          this.finish();
        }
      }, remaining);
    };
    window.addEventListener('load', this._loadHandler);
    
    if (document.readyState === 'complete') {
      this._loadHandler();
    }
    
    this._safetyTimer = setTimeout(() => {
      if (this.animationActive && !this.isFinished) {
        console.warn('PageLoader: принудительное завершение по таймауту');
        this.finish();
      }
    }, this.options.minDuration + 5000);
    
    return this;
  }
}

window.PageLoader = PageLoader;