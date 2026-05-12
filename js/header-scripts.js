/**
 * Общая логика хедера и футера
 * Вызывается после подгрузки компонентов
 */


function initHeaderScripts() {
    // ===== Десктоп: выпадающее меню "⋯" =====
    const dotsIcon = document.getElementById('dotsIcon');
    const closeIcon = document.getElementById('closeIcon');
    const extraRow = document.getElementById('extraMenuRow');
    
    function openExtraMenu() {
        extraRow?.classList.add('open');
        if (dotsIcon) dotsIcon.style.display = 'none';
        if (closeIcon) closeIcon.style.display = 'inline-flex';
    }
    function closeExtraMenu() {
        extraRow?.classList.remove('open');
        if (dotsIcon) dotsIcon.style.display = 'inline-flex';
        if (closeIcon) closeIcon.style.display = 'none';
    }
    dotsIcon?.addEventListener('click', openExtraMenu);
    closeIcon?.addEventListener('click', closeExtraMenu);
    
    // ===== Мобильное меню =====
    const burgerIcon = document.getElementById('burgerIcon');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('overlay');
    const closeMobileBtn = document.getElementById('closeMobileMenu');
    
    function openMobileMenu() {
        mobileNav?.classList.add('open');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('menu-open');
    }
    function closeMobileMenu() {
        mobileNav?.classList.remove('open');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('menu-open');
    }
    
    burgerIcon?.addEventListener('click', openMobileMenu);
    closeMobileBtn?.addEventListener('click', closeMobileMenu);
    overlay?.addEventListener('click', closeMobileMenu);
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav?.classList.contains('open')) {
            closeMobileMenu();
        }
    });
    
    // ===== Подписка на новости (футер) =====
    const subscribeBtn = document.getElementById('subscribeBtn');
    const consentCheckbox = document.getElementById('consentCheckbox');
    const consentError = document.getElementById('consentError');
    const subscribeEmail = document.getElementById('subscribeEmail');
    const subscribeForm = document.querySelector('.subscribe-form');
    
    // Валидация email
    const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    
    // Создаём элемент для ошибки ПОД строкой с полем и кнопкой, НАД чекбоксом
    let emailError = document.querySelector('.subscribe-email-error');
    if (!emailError) {
        emailError = document.createElement('div');
        emailError.className = 'subscribe-email-error';
        emailError.style.cssText = 'display:none; color:#E8454D; font-size:12px; font-family:"Nunito Sans",sans-serif; margin-top:8px; margin-bottom:4px; text-align:left; width:100%;';
        // Вставляем сразу после формы (или после поля, но ДО чекбокса)
        const subscribeForm = document.querySelector('.subscribe-form');
        if (subscribeForm) {
            subscribeForm.parentNode.insertBefore(emailError, subscribeForm.nextSibling);
        }
    }
    
    // Функция показа модального окна успешной подписки
    function showSubscribeSuccessModal(email) {
        const existing = document.getElementById('subscribeSuccessModal');
        existing?.remove();
        
        const overlayEl = document.createElement('div');
        overlayEl.id = 'subscribeSuccessModal';
        overlayEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10001;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;padding:20px;box-sizing:border-box;';
        
        overlayEl.innerHTML = `
            <div style="background:#FFFFFF;border-radius:24px;max-width:480px;width:100%;padding:40px 32px;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);border:1px solid rgba(232,69,77,0.2);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);position:relative;">
                <button style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:#F8F7F6;border:1px solid #E5E3E1;color:#5A5556;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;" onclick="this.closest('#subscribeSuccessModal').remove();document.body.style.overflow='';">
                    &times;
                </button>
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#E8454D,#D62830);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;animation:pulse 0.6s ease-out;">
                    <i class="fas fa-check" style="font-size:36px;color:white;"></i>
                </div>
                <h3 style="font-family:Unbounded,sans-serif;font-size:24px;font-weight:700;color:#1A1718;margin-bottom:12px;">Спасибо за подписку! 🎉</h3>
                <p style="font-family:'Nunito Sans',sans-serif;font-size:15px;color:#5A5556;line-height:1.6;margin-bottom:8px;">На адрес <strong style="color:#2A3D5E;">${email}</strong> отправлено письмо для подтверждения.</p>
                <p style="font-family:'Nunito Sans',sans-serif;font-size:13px;color:#888;margin-bottom:24px;">Проверьте почту и подтвердите подписку, чтобы получать новости театра.</p>
                <button style="background:#E8454D;color:white;border:none;padding:14px 32px;border-radius:10px;font-family:Unbounded,sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;" onclick="this.closest('#subscribeSuccessModal').remove();document.body.style.overflow='';">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        `;
        
        document.body.appendChild(overlayEl);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlayEl.style.opacity = '1';
            const inner = overlayEl.firstElementChild;
            if (inner) inner.style.transform = 'scale(1)';
        });
        
        const close = () => {
            overlayEl.style.opacity = '0';
            setTimeout(() => {
                overlayEl.remove();
                document.body.style.overflow = prevOverflow || '';
            }, 300);
        };
        
        overlayEl.addEventListener('click', (e) => {
            if (e.target === overlayEl) close();
        });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
    
    subscribeBtn?.addEventListener('click', () => {
        emailError.style.display = 'none';
        if (subscribeEmail) subscribeEmail.style.borderColor = '';
        
        if (!consentCheckbox?.checked) {
            if (consentError) {
                consentError.style.display = 'block';
                setTimeout(() => consentError.style.display = 'none', 2500);
            }
            return;
        }
        
        const email = subscribeEmail?.value.trim();
        
        if (!email) {
            emailError.textContent = 'Пожалуйста, введите email';
            emailError.style.display = 'block';
            if (subscribeEmail) subscribeEmail.style.borderColor = '#E8454D';
            return;
        }
        
        if (!validateEmail(email)) {
            emailError.textContent = 'Введите корректный email (например: name@example.com)';
            emailError.style.display = 'block';
            if (subscribeEmail) subscribeEmail.style.borderColor = '#E8454D';
            return;
        }
        
        // Успех
        if (consentCheckbox) consentCheckbox.checked = false;
        if (subscribeEmail) {
            subscribeEmail.style.borderColor = '#4CAF50';
            setTimeout(() => {
                subscribeEmail.value = '';
                subscribeEmail.style.borderColor = '';
            }, 300);
        }
        showSubscribeSuccessModal(email);
    });
    
    // Форма "Заказчикам" обрабатывается отдельно на index.html
}

// Экспортируем функцию глобально
window.initHeaderScripts = initHeaderScripts;