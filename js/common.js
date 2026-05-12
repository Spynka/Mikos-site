(function() {
	
		document.addEventListener('DOMContentLoaded', function() {
		const burgerIcon = document.getElementById('burgerIcon');
		const mobileNav = document.getElementById('mobileNav');
		const closeMobileMenu = document.getElementById('closeMobileMenu');
		const overlay = document.getElementById('overlay');
		const body = document.body;

		function openMobileMenu() {
			mobileNav.classList.add('open');
			overlay.classList.add('active');
			body.classList.add('menu-open'); // Блокируем скролл фона
		}

		function closeMobileMenuFn() {
			mobileNav.classList.remove('open');
			overlay.classList.remove('active');
			body.classList.remove('menu-open');
		}

		// Обработчики
		if (burgerIcon) burgerIcon.addEventListener('click', openMobileMenu);
		if (closeMobileMenu) closeMobileMenu.addEventListener('click', closeMobileMenuFn);
		if (overlay) overlay.addEventListener('click', closeMobileMenuFn);

		// Закрытие по Escape
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
				closeMobileMenuFn();
			}
		});

		// Предотвращаем скролл внутри меню, когда достигнут край
		mobileNav?.addEventListener('touchmove', (e) => {
			if (mobileNav.scrollTop === 0) {
				mobileNav.scrollTop = 1;
			} else if (mobileNav.scrollTop + mobileNav.clientHeight >= mobileNav.scrollHeight) {
				mobileNav.scrollTop = mobileNav.scrollHeight - mobileNav.clientHeight - 1;
			}
		}, { passive: false });
	});
    // 1. Подсветка активного пункта меню (жирный чёрный)
    function setActiveMenu() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const allLinks = document.querySelectorAll('.nav-menu a, .extra-nav-list a, .mobile-nav a');
        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // 2. Мобильное меню (выезд справа, крестик левее)
    function initMobileMenu() {
        const burgerIcon = document.getElementById('burgerIcon');
        const mobileNav = document.getElementById('mobileNav');
        const overlay = document.getElementById('overlay');
        const closeMobileBtn = document.getElementById('closeMobileMenu');
        if (!burgerIcon || !mobileNav || !overlay) return;

        function openMobileMenu() {
            mobileNav.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeMobileMenu() {
            mobileNav.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        burgerIcon.addEventListener('click', openMobileMenu);
        if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileMenu);
        overlay.addEventListener('click', closeMobileMenu);
    }

    // 3. Дополнительное меню (три точки)
    function initExtraMenu() {
        const dotsIcon = document.getElementById('dotsIcon');
        const closeIcon = document.getElementById('closeIcon');
        const extraRow = document.getElementById('extraMenuRow');
        if (!dotsIcon || !closeIcon || !extraRow) return;
        function openExtraMenu() {
            extraRow.classList.add('open');
            dotsIcon.style.display = 'none';
            closeIcon.style.display = 'inline-flex';
        }
        function closeExtraMenu() {
            extraRow.classList.remove('open');
            dotsIcon.style.display = 'inline-flex';
            closeIcon.style.display = 'none';
        }
        dotsIcon.addEventListener('click', openExtraMenu);
        closeIcon.addEventListener('click', closeExtraMenu);
    }

    // 4. Подписка на новости
    function initNewsletter() {
        const subscribeBtn = document.getElementById('subscribeBtn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => {
                const chk = document.getElementById('consentCheckbox');
                const err = document.getElementById('consentError');
                if (!chk || !chk.checked) {
                    if (err) {
                        err.style.display = 'block';
                        setTimeout(() => err.style.display = 'none', 2500);
                    }
                } else {
                    alert('Спасибо за подписку!');
                    const emailInput = document.getElementById('subscribeEmail');
                    if (emailInput) emailInput.value = '';
                    chk.checked = false;
                }
            });
        }
    }

    // 5. Кнопки "Купить билет" и "Заказать шоу"
    function initButtons() {
        const ticketBtns = document.querySelectorAll('.footer-btn-primary, .buy-ticket-btn');
        ticketBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Билеты скоро в продаже');
            });
        });
        const secondaryBtn = document.querySelector('.footer-btn-secondary');
        if (secondaryBtn) {
            secondaryBtn.addEventListener('click', () => alert('Заказ шоу: свяжитесь с нами по телефону'));
        }
    }

    // Запуск всех функций после загрузки страницы
    document.addEventListener('DOMContentLoaded', function() {
        setActiveMenu();
        initMobileMenu();
        initExtraMenu();
        initNewsletter();
        initButtons();
    });
	
})();

// Если модалкам нужна дополнительная инициализация после загрузки
window.initModals = function() {
    // Привязка событий, настройка и т.д.
    console.log('Модалки инициализированы');
};

/**
 * Устраняет висячие предлоги и короткие союзы в конце строк
 * Работает через TreeWalker → не пересоздаёт DOM, не сбивает eventListeners
 */
document.addEventListener('DOMContentLoaded', () => {
  const fixHangingPrepositions = () => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: (node) => node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
    );

    // Список слов, которые не должны оставаться в конце строки
    const shortWords = [
      'в','на','с','со','к','ко','о','об','по','за','до','под','над','из','изо','без','безо','у','при','через','между',
      'и','а','но','или','да','же','ли','бы','что','как','не','ни','то','так','вот','вдруг','для','от','про','при'
    ];
    
    const regexCache = new Map();
    
    let textNode;
    while (textNode = walker.nextNode()) {
      let text = textNode.textContent;
      if (!text || text.length < 10) continue; // Пропускаем очень короткие фрагменты

      let changed = false;
      shortWords.forEach(word => {
        if (!regexCache.has(word)) {
          regexCache.set(word, new RegExp(`(\\s)(${word})(\\s)`, 'gi'));
        }
        const regex = regexCache.get(word);
        if (regex.test(text)) {
          text = text.replace(regex, '$1$2\u00A0'); // \u00A0 = &nbsp;
          changed = true;
        }
      });

      if (changed) textNode.textContent = text;
    }
  };

  // Запуск с небольшой задержкой, чтобы контент успел отрендериться
  setTimeout(fixHangingPrepositions, 150);
});