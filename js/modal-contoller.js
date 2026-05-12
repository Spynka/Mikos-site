/**
 * ModalController — единый менеджер модальных окон
 * Поддерживает:
 * • Загрузку контента из внешних файлов
 * • Шаблонизацию {{переменные}}
 * • Кэширование
 * • Галерею изображений
 * • Глобальные обработчики (ESC, overlay click)
 *
 * @example
 * ModalCtrl.open('session-modal', {
 *   src: 'modals/session.html',
 *   data: { title: 'Богатыри', events: [...] }
 * });
 */
class ModalController {
  constructor(options = {}) {
    this.activeModals = new Set();
    this.galleryState = { images: [], index: 0 };
    this.cache = new Map(); // Кэш загруженных модалок
    this.config = {
      basePath: options.basePath || './modals/',
      extension: options.extension || '.html',
      timeout: options.timeout || 10000,
      ...options
    };
    this.bindGlobalEvents();
  }

  /**
   * Загрузить и открыть модалку
   * @param {string} id - ID модалки в DOM или для кэша
   * @param {Object} options - Опции: src, data, onOpen, onClose
   */
  async open(id, options = {}) {
    const { src, data = {}, onOpen, onClose } = options;
    
    // 1. Проверяем кэш или загружаем
    let modal = document.getElementById(id);
    if (!modal) {
      if (!src) return console.warn(`Modal #${id}: нет src для загрузки`);
      modal = await this.loadModal(id, src);
      if (!modal) return;
    }

    // 2. Инжектим данные в шаблон
    if (Object.keys(data).length > 0) {
      this.injectData(modal, data);
    }

    // 3. Показываем
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.activeModals.add(modal);

    // 4. Хук после открытия
    if (typeof onOpen === 'function') {
      await onOpen(modal, data);
    }

    // 5. Привязываем onClose для этой модалки
    if (typeof onClose === 'function') {
      modal._onClose = onClose;
    }

    return modal;
  }

  /**
   * Загрузить модалку из внешнего файла
   * @private
   */
  async loadModal(id, src) {
    // Проверяем кэш
    if (this.cache.has(id)) {
      const cached = this.cache.get(id);
      document.body.insertAdjacentHTML('beforeend', cached.html);
      return this.initModal(document.getElementById(id), cached.data);
    }

    try {
      const url = `${this.config.basePath}${src}${this.config.extension}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      
      // Кэшируем
      this.cache.set(id, { html, timestamp: Date.now() });
      
      // Вставляем в DOM
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html.trim();
      const modal = wrapper.firstElementChild;
      if (!modal?.classList.contains('modal-overlay')) {
        throw new Error('Загруженный файл не содержит .modal-overlay');
      }
      modal.id = id;
      document.body.appendChild(modal);
      
      return this.initModal(modal);
    } catch (error) {
      console.error(`❌ Не удалось загрузить модалку #${id}:`, error);
      // Fallback: показываем ошибку пользователю
      this.showErrorModal(id, error.message);
      return null;
    }
  }

  /**
   * Инициализация модалки после вставки в DOM
   * @private
   */
  initModal(modal) {
    if (!modal) return null;
    
    // Кнопка закрытия
    const closeBtn = modal.querySelector('[data-modal-close], .modal-close, .team-modal-close');
    if (closeBtn) {
      closeBtn.onclick = (e) => { e.preventDefault(); this.close(modal); };
    }
    
    // Клик по оверлею
    modal.onclick = (e) => {
      if (e.target === modal) this.close(modal);
    };
    
    // Специфичная инициализация по типу
    if (modal.classList.contains('product-gallery-overlay')) {
      this.initGalleryModal(modal);
    }
    
    return modal;
  }

  /**
   * Подстановка данных в шаблон {{variable}}
   */
  injectData(modal, data) {
    const walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      let text = node.textContent;
      let changed = false;
      for (const [key, value] of Object.entries(data)) {
        const placeholder = `{{${key}}}`;
        if (text.includes(placeholder)) {
          text = text.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), 
            this.escapeHtml(String(value)));
          changed = true;
        }
      }
      if (changed) node.textContent = text;
    }
    
    // Также заменяем в атрибутах (data-*, href, src)
    modal.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.dataset.bind;
      if (data[key] !== undefined) {
        if (el.tagName === 'IMG') {
          el.src = data[key];
        } else if (el.tagName === 'A') {
          el.href = data[key];
        } else {
          el.textContent = data[key];
        }
      }
    });
  }

  /** Экранирование HTML для XSS-защиты */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Закрыть модалку
   */
  close(id) {
    const modal = typeof id === 'string' ? document.getElementById(id) : id;
    if (!modal) return;

    // Хук перед закрытием
    if (typeof modal._onClose === 'function') {
      modal._onClose(modal);
    }

    modal.classList.remove('active');
    
    // Возвращаем скролл, если это последняя модалка
    if (this.activeModals.size <= 1) {
      document.body.style.overflow = '';
    }
    this.activeModals.delete(modal);
    
    // Опционально: удалять динамические модалки из DOM после закрытия
    if (modal.dataset.dynamic === 'true') {
      setTimeout(() => modal.remove(), 300); // после анимации
    }
  }

  /** Закрыть все модалки */
  closeAll() {
    // Копируем в массив, т.к. Set изменяется во время итерации
    [...this.activeModals].forEach(modal => this.close(modal));
  }

  /**
   * Инициализация галереи внутри модалки
   */
  initGalleryModal(modal) {
    const prev = modal.querySelector('#galleryPrevBtn, .gallery-nav.prev');
    const next = modal.querySelector('#galleryNextBtn, .gallery-nav.next');
    const close = modal.querySelector('#galleryCloseBtn, .gallery-close-btn');
    const mainImg = modal.querySelector('#galleryMainImage, .product-gallery-image');
    const counter = modal.querySelector('#galleryCounter, .gallery-counter');
    const thumbs = modal.querySelector('#galleryThumbnails, .gallery-thumbnails');

    if (prev) prev.onclick = (e) => { e.stopPropagation(); this.galleryPrev(modal); };
    if (next) next.onclick = (e) => { e.stopPropagation(); this.galleryNext(modal); };
    if (close) close.onclick = (e) => { e.preventDefault(); this.close(modal); };
    
    // Свайпы для мобильных
    if (mainImg) {
      let startX = 0;
      mainImg.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      mainImg.addEventListener('touchend', (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? this.galleryNext(modal) : this.galleryPrev(modal);
      }, { passive: true });
    }
  }

  /** Галерея: предыдущее изображение */
  galleryPrev(modal = document.querySelector('.product-gallery-overlay.active')) {
    if (!modal) return;
    const s = this.galleryState;
    if (s.images.length <= 1) return;
    s.index = (s.index - 1 + s.images.length) % s.images.length;
    this.renderGallery(modal);
  }

  /** Галерея: следующее изображение */
  galleryNext(modal = document.querySelector('.product-gallery-overlay.active')) {
    if (!modal) return;
    const s = this.galleryState;
    if (s.images.length <= 1) return;
    s.index = (s.index + 1) % s.images.length;
    this.renderGallery(modal);
  }

  /** Рендер галереи */
  renderGallery(modal) {
    const s = this.galleryState;
    const mainImg = modal.querySelector('#galleryMainImage, .product-gallery-image');
    const counter = modal.querySelector('#galleryCounter, .gallery-counter');
    const thumbs = modal.querySelector('#galleryThumbnails, .gallery-thumbnails');
    const prevBtn = modal.querySelector('#galleryPrevBtn, .gallery-nav.prev');
    const nextBtn = modal.querySelector('#galleryNextBtn, .gallery-nav.next');

    if (mainImg) {
      mainImg.src = s.images[s.index];
      mainImg.alt = `Фото ${s.index + 1}`;
    }
    if (counter) {
      counter.textContent = s.images.length > 1 ? `${s.index + 1} / ${s.images.length}` : '';
      counter.style.display = s.images.length > 1 ? 'block' : 'none';
    }
    if (prevBtn && nextBtn) {
      const display = s.images.length > 1 ? 'flex' : 'none';
      prevBtn.style.display = display;
      nextBtn.style.display = display;
    }
    
    // Миниатюры
    if (thumbs) {
      thumbs.innerHTML = '';
      if (s.images.length <= 1) {
        thumbs.style.display = 'none';
        return;
      }
      thumbs.style.display = 'flex';
      s.images.forEach((src, i) => {
        const thumb = document.createElement('div');
        thumb.className = `gallery-thumb ${i === s.index ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${src}" alt="Миниатюра ${i + 1}">`;
        thumb.onclick = (e) => {
          e.stopPropagation();
          s.index = i;
          this.renderGallery(modal);
        };
        thumbs.appendChild(thumb);
      });
    }
  }

  /**
   * Открыть галерею с изображениями
   */
  openGallery(images, startIndex = 0, options = {}) {
    if (!images?.length) return;
    this.galleryState = { images, index: startIndex };
    
    // Если модалка ещё не загружена — загружаем
    const modal = document.getElementById('modal-gallery');
    if (!modal) {
      this.open('modal-gallery', {
        src: 'gallery',
        data: { images },
        onOpen: (m) => this.renderGallery(m),
        ...options
      });
    } else {
      this.renderGallery(modal);
      this.open('modal-gallery', options);
    }
  }

  /**
   * Показать модалку с ошибкой (fallback)
   */
  showErrorModal(id, message) {
    const errorModal = document.createElement('div');
    errorModal.className = 'modal-overlay active';
    errorModal.id = `error-${id}`;
    errorModal.dataset.dynamic = 'true';
    errorModal.innerHTML = `
      <div class="modal-container">
        <button class="modal-close" data-modal-close>&times;</button>
        <div class="modal-body" style="text-align:center;padding:40px 24px;">
          <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#E8454D;margin-bottom:16px;"></i>
          <h3 style="font-family:'Unbounded',sans-serif;font-weight:700;margin-bottom:12px;">Ошибка загрузки</h3>
          <p style="color:#5A5556;margin-bottom:24px;">${this.escapeHtml(message)}</p>
          <button class="modal-confirm-btn" data-modal-close style="background:#2A3D5E">
            Закрыть
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorModal);
    this.activeModals.add(errorModal);
    document.body.style.overflow = 'hidden';
    
    // Авто-закрытие через 5 сек
    setTimeout(() => this.close(errorModal), 5000);
  }

  /** Глобальные обработчики событий */
  bindGlobalEvents() {
    // Клик по оверлею или кнопке закрытия
    document.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      const closeBtn = e.target.closest('[data-modal-close], .modal-close, .team-modal-close, .gallery-close-btn, .success-modal-close');
      
      if (closeBtn) {
        e.preventDefault();
        this.close(overlay);
      } else if (overlay && e.target === overlay) {
        this.close(overlay);
      }
    }, { capture: true });

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || this.activeModals.size === 0) return;
      e.preventDefault();
      // Закрываем верхнюю модалку
      const last = [...this.activeModals].pop();
      if (last) this.close(last);
    });

    // Навигация галереи клавиатурой
    document.addEventListener('keydown', (e) => {
      const gallery = document.querySelector('.product-gallery-overlay.active');
      if (!gallery) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.galleryPrev(gallery); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.galleryNext(gallery); }
    });

    // Очистка кэша каждые 30 мин (опционально)
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > 30 * 60 * 1000) {
          this.cache.delete(key);
        }
      }
    }, 30 * 60 * 1000);
  }

  /** Очистить кэш (для отладки или принудительного обновления) */
  clearCache(id = null) {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }

  /** Проверить, загружена ли модалка */
  isLoaded(id) {
    return this.cache.has(id) || !!document.getElementById(id);
  }

  /** Предзагрузить модалки (для ускорения первого открытия) */
  async preload(ids) {
    const promises = ids.map(id => {
      const modal = document.getElementById(id);
      if (modal) return Promise.resolve(modal);
      return this.loadModal(id, id).catch(() => null);
    });
    return Promise.all(promises);
  }
}

// Экспорт глобального инстанса
window.ModalCtrl = new ModalController({ basePath: './modals/' });

// =============================================
// ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Делегирование для динамических кнопок галереи
  document.body.addEventListener('click', (e) => {
    const prev = e.target.closest('.gallery-nav.prev, #galleryPrevBtn');
    const next = e.target.closest('.gallery-nav.next, #galleryNextBtn');
    if (prev) { e.preventDefault(); window.ModalCtrl.galleryPrev(); }
    if (next) { e.preventDefault(); window.ModalCtrl.galleryNext(); }
  });

  // Пример: инициализация кнопок "Купить" для спектаклей
  document.querySelectorAll('[data-open-session-modal]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const perfId = btn.dataset.performanceId;
      if (!perfId) return;
      
      // Загружаем данные из tour-data.js
      const events = typeof filterEventsByPerformance === 'function' 
        ? filterEventsByPerformance(perfId, getUpcomingEvents(TOUR_SCHEDULE))
        : [];
      
      if (!events.length) {
        alert('На этот спектакль пока нет запланированных показов.');
        return;
      }
      
      // Открываем модалку с данными
      await window.ModalCtrl.open('session-modal', {
        src: 'session',
        data: {
          performanceTitle: events[0].title,
          performanceId: perfId,
          events: JSON.stringify(events) // Передаём как JSON для парсинга внутри
        },
        onOpen: (modal) => {
          // Дополнительная инициализация после открытия
          initSessionModalLogic(modal, events);
        }
      });
    });
  });
});

/**
 * Логика модалки выбора сеанса (выносится отдельно для переиспользования)
 */
function initSessionModalLogic(modal, events) {
  const filterContainer = modal.querySelector('#dateFilterContainer');
  const listContainer = modal.querySelector('#sessionsListContainer');
  const confirmBtn = modal.querySelector('#confirmSessionBtn');
  let selectedSession = null;
  let currentMonth = 'all';

  if (!filterContainer || !listContainer) return;

  function renderFilters() {
    const months = typeof getEventMonths === 'function' ? getEventMonths(events) : [];
    let html = `<button class="filter-btn ${currentMonth === 'all' ? 'active' : ''}" data-month="all">Все даты</button>`;
    months.forEach(m => {
      const value = `${m.name}-${m.year}`;
      html += `<button class="filter-btn ${currentMonth === value ? 'active' : ''}" data-month="${value}">${m.name} ${m.year}</button>`;
    });
    filterContainer.innerHTML = html;
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        currentMonth = btn.dataset.month;
        renderFilters();
        renderList();
      };
    });
  }

  function renderList() {
    let filtered = currentMonth === 'all' ? events : 
      (typeof filterEventsByMonth === 'function' ? filterEventsByMonth(events, currentMonth) : events);
    filtered = typeof sortEventsByDate === 'function' ? sortEventsByDate(filtered) : filtered;
    
    if (!filtered.length) {
      listContainer.innerHTML = '<div class="no-sessions">Нет сеансов в выбранном периоде</div>';
      if (confirmBtn) confirmBtn.disabled = true;
      return;
    }
    
    listContainer.innerHTML = filtered.map(ev => {
      const isSelected = selectedSession?.id === ev.id;
      return `
        <div class="session-item ${isSelected ? 'selected' : ''}" data-event-id="${ev.id}">
          <div class="session-info">
            <div class="session-date">${typeof formatEventDate === 'function' ? formatEventDate(ev.date, ev.time) : ''}</div>
            <div class="session-meta">
              <span><i class="fas fa-map-marker-alt"></i> ${ev.venue}${ev.address ? ', ' + ev.address.split(',')[0] : ''}</span>
              <span><i class="far fa-clock"></i> ${ev.duration}</span>
            </div>
            ${ev.price ? `<div class="session-price">от ${ev.price.min.toLocaleString('ru-RU')} ₽</div>` : ''}
          </div>
          <div class="session-select-indicator">${isSelected ? '<i class="fas fa-check"></i>' : ''}</div>
        </div>
      `;
    }).join('');
    
    listContainer.querySelectorAll('.session-item').forEach(item => {
      item.onclick = () => {
        selectedSession = events.find(ev => ev.id === item.dataset.eventId);
        renderList();
        if (confirmBtn) confirmBtn.disabled = false;
      };
    });
  }

  if (confirmBtn) {
    confirmBtn.onclick = (e) => {
      e.preventDefault();
      if (selectedSession && typeof window.goToCheckout === 'function') {
        window.goToCheckout(selectedSession.id);
      }
    };
  }

  renderFilters();
  renderList();
}