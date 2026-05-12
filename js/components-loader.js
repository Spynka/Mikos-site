/**
 * Загрузчик компонентов: хедер, футер, слайдер + лоадер анимация
 * Автоматически определяет путь для вложенных страниц
 */

(async function loadComponents() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    
    const getBasePath = () => {
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;
        return depth > 1 ? '../'.repeat(depth - 1) : './';
    };
    
    const basePath = getBasePath();
    
    // ===== ИНИЦИАЛИЗАЦИЯ ЛОУДЕРА =====
    const initLoader = () => {
        // Проверяем, не инициализирован ли уже лоадер
        if (document.getElementById('loaderOverlay')) return null;
        
        // Проверяем возврат через историю браузера
        if (window.performance && window.performance.navigation) {
            const navType = window.performance.navigation.type;
            if (navType === 2) { // TYPE_BACK_FORWARD
                showContentImmediately();
                return null;
            }
        }
        
        if (typeof PageLoader !== 'undefined') {
            const loader = new PageLoader({
                minDuration: 2000,
                contentSelector: '.shop-container, .page-content, [data-page-content]',
                loaderId: 'loaderOverlay'
            });
            
            window.__pageLoader = loader;
            return loader.init();
        } else {
            console.warn('PageLoader не найден, показываем контент сразу');
            showContentImmediately();
            return null;
        }
    };
    
    // Функция для немедленного показа контента
const showContentImmediately = () => {
    // 🔑 Ищем контент: сначала page-content, потом shop-container
    let content = document.querySelector('.page-content, [data-page-content]');
    if (!content) {
        content = document.querySelector('.shop-container');
    }
    // Если есть #mainContent внутри shop-container, используем его
    if (!content || content.classList.contains('shop-container')) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            content = mainContent;
        }
    }
    
    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
        content.style.pointerEvents = 'auto';
        content.classList.add('visible');
    }
    
    // Удаляем лоадер если есть
    const existingLoader = document.getElementById('loaderOverlay');
    if (existingLoader) {
        existingLoader.remove();
    }
    
    // Убираем блокировку скролла
    document.body.classList.remove('loader-active');
    document.body.style.overflow = '';
};
    
    // Обработка кликов по ссылкам
    const setupLinkHandling = () => {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || 
                href.startsWith('#') || 
                href.startsWith('javascript:') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:')) return;
            if (link.getAttribute('download') !== null) return;
            if (link.getAttribute('target') === '_blank') return;
            if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
            if (href === window.location.pathname || href === window.location.href) return;
            
            // Показываем лоадер при переходе
            if (!document.getElementById('loaderOverlay') && typeof PageLoader !== 'undefined') {
                const loader = new PageLoader({
                    minDuration: 1500,
                    removeAfter: 300,
                    contentSelector: '.shop-container, .page-content, [data-page-content]'
                });
                
                window.__pageLoader = loader;
                loader.init();
            }
        });
    };
    

    initLoader();
    setupLinkHandling();
    
    // ===== ЗАГРУЗКА КОМПОНЕНТОВ =====
try {
    // 1. Загрузка хедера
    const headerRes = await fetch(`${basePath}components/header.html`);
    if (!headerRes.ok) throw new Error('header.html');
    const headerPlaceholder = document.getElementById('site-header');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = await headerRes.text();
    }
    
    // 2. Загрузка футера
    const footerRes = await fetch(`${basePath}components/footer.html`);
    if (!footerRes.ok) throw new Error('footer.html');
    const footerPlaceholder = document.getElementById('site-footer');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = await footerRes.text();
    }
    
    // 3. Загрузка hero-слайдера
    if (currentPage === 'index' || currentPage === 'affiche') {
        const sliderRes = await fetch(`${basePath}components/hero-slider.html`);
        if (!sliderRes.ok) throw new Error('hero-slider.html');
        const sliderHTML = await sliderRes.text();
        
        const sliderPlaceholder = document.getElementById('site-hero-slider');
        if (sliderPlaceholder) {
            sliderPlaceholder.innerHTML = sliderHTML;
        }
    }
    
    //  4. Загрузка модалок (НОВОЕ)
    const modalsRes = await fetch(`${basePath}components/modals.html`);
    if (!modalsRes.ok) throw new Error('modals.html');
    const modalsPlaceholder = document.getElementById('site-modals');
    if (modalsPlaceholder) {
        modalsPlaceholder.innerHTML = await modalsRes.text();
    }
    
    // 5. Подсветка активной ссылки
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
    
    // 6. Инициализация скриптов
    setTimeout(() => {
        if (typeof window.initHeaderScripts === 'function') {
            window.initHeaderScripts();
        }
        if ((currentPage === 'index' || currentPage === 'affiche') && 
            typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }
        // 🔥 Инициализация скриптов модалок (если есть)
        if (typeof window.initModals === 'function') {
            window.initModals();
        }
    }, 50);
    
    // ===== ЗАВЕРШЕНИЕ ЛОУДЕРА =====
    setTimeout(() => {
        if (window.__pageLoader && typeof window.__pageLoader.finish === 'function') {
            window.__pageLoader.finish();
        } else {
            showContentImmediately();
        }
    }, 300);
    
} catch (err) {
    console.error('❌ Ошибка загрузки компонентов:', err.message);
    
    if (window.__pageLoader && typeof window.__pageLoader.finish === 'function') {
        window.__pageLoader.finish();
    }
    showContentImmediately();
    
    const errorPlaceholder = '<div style="padding:20px;text-align:center;color:#E8454D;background:#fff;border-radius:8px;margin:20px">⚠️ Не удалось загрузить компонент</div>';
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');
    const modalsEl = document.getElementById('site-modals'); // 🔥 Обработка ошибки для модалок
    if (headerEl && !headerEl.innerHTML.trim()) headerEl.innerHTML = errorPlaceholder;
    if (footerEl && !footerEl.innerHTML.trim()) footerEl.innerHTML = errorPlaceholder;
    if (modalsEl && !modalsEl.innerHTML.trim()) modalsEl.innerHTML = errorPlaceholder;
}
    
    // ===== ОБРАБОТКА ВОЗВРАТА ЧЕРЕЗ ИСТОРИЮ =====
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            const existingLoader = document.getElementById('loaderOverlay');
            if (existingLoader) {
                existingLoader.style.display = 'none';
                existingLoader.remove();
            }
            showContentImmediately();
        }
    });
    
    // ===== СТРАХОВКА: принудительно скрываем лоадер через 5 секунд =====
    setTimeout(() => {
        const existingLoader = document.getElementById('loaderOverlay');
        if (existingLoader && !existingLoader.classList.contains('fade-out')) {
            console.warn('⚠️ Лоадер не завершился автоматически, принудительное скрытие');
            if (window.__pageLoader && typeof window.__pageLoader.finish === 'function') {
                window.__pageLoader.finish();
            } else {
                existingLoader.remove();
                showContentImmediately();
            }
        }
    }, 5000);
    
})();