// theme-lang.js - Theme (Dark/Light) and Language Management
document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. THEME MANAGEMENT (DARK / LIGHT MODE)
    // -------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const bodyElement = document.body;

    // Load initial theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        bodyElement.classList.add('dark-mode');
        updateThemeToggleIcon(true);
    } else {
        bodyElement.classList.remove('dark-mode');
        updateThemeToggleIcon(false);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = bodyElement.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeToggleIcon(isDark);
        });
    }

    function updateThemeToggleIcon(isDark) {
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            if (isDark) {
                icon.className = 'fa-solid fa-sun';
            } else {
                icon.className = 'fa-solid fa-moon';
            }
        }
    }

    // -------------------------------------------------------------
    // 2. LANGUAGE SWITCHER MANAGEMENT
    // -------------------------------------------------------------
    const langMenuBtn = document.getElementById('lang-menu-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const currentLangText = document.getElementById('current-lang');

    // Toggle dropdown open/close
    if (langMenuBtn && langDropdown) {
        langMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            langDropdown.classList.remove('show');
        });
    }

    // Initialize current language
    let currentLang = localStorage.getItem('lang') || 'tr';
    setLanguage(currentLang);

    // Expose functions globally for layout onclick bindings
    window.changeLanguage = function(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        setLanguage(lang);
        if (langDropdown) {
            langDropdown.classList.remove('show');
        }
    };

    function setLanguage(lang) {
        if (currentLangText) {
            currentLangText.textContent = lang.toUpperCase();
        }

        // Update active class on language links
        document.querySelectorAll('[data-lang]').forEach(el => {
            if (el.getAttribute('data-lang') === lang) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Apply translations
        const trans = window.translations ? window.translations[lang] : null;
        if (!trans) return;

        // Apply text translations
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (trans[key]) {
                el.innerHTML = trans[key];
            }
        });

        // Apply placeholder translations
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (trans[key]) {
                el.setAttribute('placeholder', trans[key]);
            }
        });

        // Apply text direction for Arabic (RTL)
        if (lang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.style.textAlign = 'right';
        } else {
            document.documentElement.removeAttribute('dir');
            document.body.style.textAlign = 'left';
        }

        // Emit an event so dynamic content (like articles) can know the language changed
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }
});
