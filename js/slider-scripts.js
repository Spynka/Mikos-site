// =============================================
// ИНИЦИАЛИЗАЦИЯ СЛАЙДЕРА С МОДАЛЬНЫМ ОКНОМ
// Работает на базе tour-data.js
// =============================================
(function() {
    'use strict';
    
    function initWhenReady() {
        const slider = document.getElementById('heroSliderAfisha');
        if (!slider) {
            setTimeout(initWhenReady, 500);
            return;
        }
        
        const slides = slider.querySelectorAll('.hero-slide-afisha');
        if (slides.length === 0) {
            observeSliderContent(slider);
            return;
        }
        
        initHeroSliderWithModal();
    }
    
    function observeSliderContent(slider) {
        const observer = new MutationObserver(function(mutations) {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    const slides = slider.querySelectorAll('.hero-slide-afisha');
                    if (slides.length > 0) {
                        observer.disconnect();
                        initHeroSliderWithModal();
                        break;
                    }
                }
            }
        });
        observer.observe(slider, { childList: true, subtree: true });
        setTimeout(() => {
            observer.disconnect();
            if (slider.querySelectorAll('.hero-slide-afisha').length > 0) {
                initHeroSliderWithModal();
            }
        }, 5000);
    }
    
    function initHeroSliderWithModal() {
        const slider = document.getElementById('heroSliderAfisha');
        if (!slider) return;
        
        const slides = slider.querySelectorAll('.hero-slide-afisha');
        const dots = slider.querySelectorAll('.slider-dot');
        const leftArrow = document.getElementById('sliderArrowLeft');
        const rightArrow = document.getElementById('sliderArrowRight');
        
        if (slides.length === 0) return;
        
        let currentSlide = 0;
        let autoPlayInterval;
        const autoPlayDelay = 5000;
        
        // 🔥 Состояние для модалки
        let currentEvent = null;
        let selectedSession = null;
        let currentMonthFilter = 'all';
        
        // =============================================
        // 🔥 ЕДИНАЯ ФУНКЦИЯ ПЕРЕХОДА К ОФОРМЛЕНИЮ
        // =============================================
        function goToCheckout(eventId) {
            const event = TOUR_SCHEDULE.find(ev => ev.id === eventId);
            if (!event) return;
            
            const orderInfo = {
                title: event.title,
                dateTime: formatEventDate(event.date, event.time),
                hall: event.venueWithCity || event.venue,
                address: event.address,
                price: event.price ? `от ${event.price.min.toLocaleString('ru-RU')} ₽` : 'Уточняйте',
                poster: event.image,
                eventId: event.id,
                performanceId: event.performanceId
            };
            
            localStorage.setItem('selectedPerformance', JSON.stringify(orderInfo));
            window.location.href = 'checkout.html';
        }
        
        // =============================================
        // 🔥 ОТКРЫТИЕ МОДАЛКИ С ВЫБОРОМ ДАТЫ
        // =============================================
        function openSessionModal(performanceId) {
            // 🔥 Берём будущие события этого спектакля из tour-data.js
            const events = filterEventsByPerformance(performanceId, getUpcomingEvents(TOUR_SCHEDULE));
            if (!events.length) {
                alert('На этот спектакль пока нет запланированных показов. Следите за обновлениями!');
                return;
            }
            
            currentEvent = events[0];
            selectedSession = null;
            currentMonthFilter = 'all';
            
            // Создаём/показываем модалку
            initModalOnce();
            
            const playTitle = document.getElementById('selectedPlayTitle');
            const modalName = document.getElementById('modalPerformanceName');
            if (playTitle) playTitle.textContent = currentEvent.title;
            if (modalName) modalName.textContent = `Выбор сеанса: ${currentEvent.title}`;
            
            renderMonthFilter(performanceId);
            renderSessionsList(performanceId);
            
            const confirmBtn = document.getElementById('confirmSessionBtn');
            if (confirmBtn) confirmBtn.disabled = true;
            
            const sessionModal = document.getElementById('sessionModal');
            if (sessionModal) {
                sessionModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            stopAutoPlay();
        }
        
        // =============================================
        // 🔥 ИНИЦИАЛИЗАЦИЯ МОДАЛКИ (один раз)
        // =============================================
        function initModalOnce() {
            if (document.getElementById('sessionModal')) {
                bindModalEvents();
                return;
            }
            
            const modalHTML = `
                <div class="modal-overlay" id="sessionModal">
                    <div class="modal-container">
                        <div class="modal-header">
                            <h3 id="modalPerformanceName">Выбор сеанса</h3>
                            <button class="modal-close" id="closeSessionModalBtn"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <div class="modal-performance-title">
                                <i class="fas fa-ticket-alt"></i> <span id="selectedPlayTitle"></span>
                            </div>
                            <div class="date-filter" id="dateFilterContainer"></div>
                            <div class="sessions-list" id="sessionsListContainer"></div>
                        </div>
                        <div class="modal-footer">
                            <button class="modal-confirm-btn" id="confirmSessionBtn" disabled>
                                <i class="fas fa-shopping-cart"></i> Перейти к покупке
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            bindModalEvents();
        }
        
        function bindModalEvents() {
            const sessionModal = document.getElementById('sessionModal');
            const closeBtn = document.getElementById('closeSessionModalBtn');
            const confirmBtn = document.getElementById('confirmSessionBtn');
            
            if (closeBtn) {
                closeBtn.onclick = (e) => { e.preventDefault(); closeSessionModal(); };
            }
            if (sessionModal) {
                sessionModal.onclick = (e) => { if (e.target === sessionModal) closeSessionModal(); };
            }
            if (confirmBtn) {
                confirmBtn.onclick = (e) => {
                    e.preventDefault();
                    if (selectedSession) goToCheckout(selectedSession.id);
                };
            }
            document.onkeydown = (e) => {
                if (e.key === 'Escape' && sessionModal?.classList.contains('active')) closeSessionModal();
            };
        }
        
        function closeSessionModal() {
            const sessionModal = document.getElementById('sessionModal');
            if (sessionModal) {
                sessionModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            currentEvent = null;
            selectedSession = null;
            startAutoPlay();
        }
        
        // =============================================
        // 🔥 РЕНДЕР ФИЛЬТРА ПО МЕСЯЦАМ
        // =============================================
        function renderMonthFilter(performanceId) {
            const container = document.getElementById('dateFilterContainer');
            if (!container) return;
            
            const events = filterEventsByPerformance(performanceId, getUpcomingEvents(TOUR_SCHEDULE));
            const months = getEventMonths(events);
            
            let html = `<button class="filter-btn ${currentMonthFilter === 'all' ? 'active' : ''}" data-month="all">Все даты</button>`;
            months.forEach(m => {
                const value = `${m.name}-${m.year}`;
                const label = m.name.charAt(0).toUpperCase() + m.name.slice(1) + ' ' + m.year;
                html += `<button class="filter-btn ${currentMonthFilter === value ? 'active' : ''}" data-month="${value}">${label}</button>`;
            });
            container.innerHTML = html;
            
            container.querySelectorAll('.filter-btn').forEach(btn => {
                btn.onclick = () => {
                    currentMonthFilter = btn.dataset.month;
                    renderMonthFilter(performanceId);
                    renderSessionsList(performanceId);
                };
            });
        }
        
        // =============================================
        // 🔥 РЕНДЕР СПИСКА СЕАНСОВ
        // =============================================
        function renderSessionsList(performanceId) {
            const container = document.getElementById('sessionsListContainer');
            if (!container) return;
            
            let events = filterEventsByPerformance(performanceId, getUpcomingEvents(TOUR_SCHEDULE));
            if (currentMonthFilter !== 'all') {
                events = filterEventsByMonth(events, currentMonthFilter);
            }
            events = sortEventsByDate(events);
            
            if (!events.length) {
                container.innerHTML = '<div class="no-sessions"><i class="far fa-calendar-times"></i> Нет сеансов в выбранном периоде</div>';
                return;
            }
            
            container.innerHTML = events.map(ev => {
                const isSelected = selectedSession?.id === ev.id;
                const venueDisplay = ev.venueWithCity || ev.venue;
                return `
                    <div class="session-item ${isSelected ? 'selected' : ''}" data-event-id="${ev.id}">
                        <div class="session-info">
                            <div class="session-date">${formatEventDate(ev.date, ev.time)}</div>
                            <div class="session-meta">
                                <span><i class="fas fa-map-marker-alt"></i> ${venueDisplay}</span>
                                <span><i class="far fa-clock"></i> ${ev.duration}</span>
                            </div>
                            ${ev.price ? `<div class="session-price">от ${ev.price.min.toLocaleString('ru-RU')} ₽</div>` : ''}
                        </div>
                        <div class="session-select-indicator">${isSelected ? '<i class="fas fa-check"></i>' : ''}</div>
                    </div>
                `;
            }).join('');
            
            container.querySelectorAll('.session-item').forEach(item => {
                item.onclick = () => {
                    selectedSession = TOUR_SCHEDULE.find(ev => ev.id === item.dataset.eventId);
                    renderSessionsList(performanceId);
                    const confirmBtn = document.getElementById('confirmSessionBtn');
                    if (confirmBtn) confirmBtn.disabled = false;
                };
            });
        }
        
        // =============================================
        // 🔥 УПРАВЛЕНИЕ СЛАЙДЕРОМ
        // =============================================
        function showSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            slides[index].classList.add('active');
            if (dots[index]) dots[index].classList.add('active');
            currentSlide = index;
            setTimeout(attachButtonEvents, 100);
        }
        
        function nextSlide() { showSlide(currentSlide + 1); }
        function prevSlide() { showSlide(currentSlide - 1); }
        
        function startAutoPlay() {
            stopAutoPlay();
            autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
        }
        
        function stopAutoPlay() {
            if (autoPlayInterval) { clearInterval(autoPlayInterval); autoPlayInterval = null; }
        }
        
        // Стрелки
        if (leftArrow) leftArrow.onclick = () => { prevSlide(); startAutoPlay(); };
        if (rightArrow) rightArrow.onclick = () => { nextSlide(); startAutoPlay(); };
        
        // Точки
        dots.forEach((dot, i) => {
            dot.onclick = () => { showSlide(i); startAutoPlay(); };
        });
        
        // 🔥 СВАЙП-ЖЕСТЫ ДЛЯ МОБИЛЬНЫХ
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50; // минимальное расстояние для свайпа

        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoPlay(); // при касании пауза
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;

            if (Math.abs(diff) > minSwipeDistance) {
                if (diff < 0) {
                    // свайп влево → следующий слайд
                    nextSlide();
                } else {
                    // свайп вправо → предыдущий слайд
                    prevSlide();
                }
            }
            // после свайпа или простого касания возобновляем автоплей
            startAutoPlay();
        });

        // Пауза при наведении мыши (для десктопа)
        slider.onmouseenter = stopAutoPlay;
        slider.onmouseleave = startAutoPlay;
        
        // =============================================
        // 🔥 ОБРАБОТЧИКИ КНОПОК В СЛАЙДАХ
        // =============================================
        function attachButtonEvents() {
            // Кнопки "Купить билет" → открывают модалку выбора даты
            document.querySelectorAll('.hero-btn-dark[data-id]').forEach(btn => {
                if (btn.dataset.bound) return;
                btn.dataset.bound = 'true';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const perfId = parseInt(btn.dataset.id);
                    if (perfId) openSessionModal(perfId);
                };
            });
            
            // Кнопки "О спектакле" → переход на страницу спектакля
            document.querySelectorAll('.hero-btn-light[data-id]').forEach(btn => {
                if (btn.dataset.bound) return;
                btn.dataset.bound = 'true';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const perfId = btn.dataset.id;
                    if (perfId) window.location.href = `performance.html?id=${perfId}`;
                };
            });
        }
        
        // Запуск
        showSlide(0);
        startAutoPlay();
        attachButtonEvents();
        setTimeout(attachButtonEvents, 500);
    }
    
    // Запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initWhenReady, 300));
    } else {
        setTimeout(initWhenReady, 300);
    }
})();