/**
 * ModalController - единый менеджер модальных окон
 * Открывает/закрывает по ID, управляет ESC, кликом вне области, динамическим контентом
 */
class ModalController {
  constructor() {
    this.activeModals = new Set();
    this.galleryState = { images: [], index: 0 };
    this.bindGlobalEvents();
  }

  /** Открыть модалку */
  open(id, options = {}) {
    const modal = document.getElementById(id);
    if (!modal) return console.warn(`Modal #${id} not found`);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.activeModals.add(modal);

    // Хуки для динамического заполнения
    if (options.onOpen && typeof options.onOpen === 'function') options.onOpen(modal);
  }

  /** Закрыть модалку */
  close(id) {
    const modal = typeof id === 'string' ? document.getElementById(id) : id;
    if (!modal) return;

    modal.classList.remove('active');
    if (this.activeModals.size === 1) document.body.style.overflow = '';
    this.activeModals.delete(modal);
  }

  /** Закрыть все */
  closeAll() {
    this.activeModals.forEach(m => this.close(m));
  }

  /** Глобальные обработчики */
  bindGlobalEvents() {
    // Закрытие по клику на оверлей или крестик
    document.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      const closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn) this.close(overlay);
      if (overlay && e.target === overlay) this.close(overlay);
    });

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModals.size > 0) {
        this.close([...this.activeModals].pop());
      }
    });

    // Галерея: клавиатура
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('modal-gallery')?.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') this.galleryPrev();
      if (e.key === 'ArrowRight') this.galleryNext();
    });
  }

  /** Хелперы для галереи */
  initGallery(images, startIndex = 0) {
    if (!images?.length) return;
    this.galleryState = { images, index: startIndex };
    this.renderGallery();
    this.open('modal-gallery');
  }
  galleryPrev() {
    const s = this.galleryState;
    if (s.images.length <= 1) return;
    s.index = (s.index - 1 + s.images.length) % s.images.length;
    this.renderGallery();
  }
  galleryNext() {
    const s = this.galleryState;
    if (s.images.length <= 1) return;
    s.index = (s.index + 1) % s.images.length;
    this.renderGallery();
  }
  renderGallery() {
    const s = this.galleryState;
    document.getElementById('gallery-img').src = s.images[s.index];
    document.getElementById('gallery-counter').textContent = `${s.index + 1} / ${s.images.length}`;
    document.getElementById('gallery-prev').style.display = s.images.length > 1 ? 'flex' : 'none';
    document.getElementById('gallery-next').style.display = s.images.length > 1 ? 'flex' : 'none';
    
    // Миниатюры
    const thumbs = document.getElementById('gallery-thumbs');
    thumbs.innerHTML = '';
    if (s.images.length <= 1) { thumbs.style.display = 'none'; return; }
    thumbs.style.display = 'flex';
    s.images.forEach((src, i) => {
      const t = document.createElement('div');
      t.className = `gallery-thumb ${i === s.index ? 'active' : ''}`;
      t.innerHTML = `<img src="${src}" alt="thumb">`;
      t.onclick = (e) => { e.stopPropagation(); this.galleryState.index = i; this.renderGallery(); };
      thumbs.appendChild(t);
    });
  }
}

// Экспорт в глобальную область
window.ModalCtrl = new ModalController();

// Делегирование событий для динамических элементов внутри модалок
document.addEventListener('DOMContentLoaded', () => {
  // Навигация галереи
  document.getElementById('gallery-prev')?.addEventListener('click', (e) => { e.stopPropagation(); window.ModalCtrl.galleryPrev(); });
  document.getElementById('gallery-next')?.addEventListener('click', (e) => { e.stopPropagation(); window.ModalCtrl.galleryNext(); });
  
  // Подтверждение сеанса (пример использования)
  document.getElementById('session-confirm-btn')?.addEventListener('click', () => {
    const selected = document.querySelector('.session-item.selected');
    if (selected && window.goToCheckout) window.goToCheckout(selected.dataset.eventId);
  });
});