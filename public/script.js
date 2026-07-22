var API_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', () => {

    const preloader = document.getElementById('preloader');
    if (preloader) {
        if (!sessionStorage.getItem('preloaderShown')) {
            const minLoadingTime = 2500;
            const startTime = Date.now();
            window.addEventListener('load', () => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                setTimeout(() => {
                    preloader.classList.add('hidden');
                    setTimeout(() => { preloader.remove(); }, 800);
                    sessionStorage.setItem('preloaderShown', 'true');
                }, remainingTime);
            });
        } else {
            preloader.style.display = 'none';
            preloader.remove();
        }
    }

    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.playsInline = true;
        heroVideo.loop = true;

        const tryPlay = () => {
            const playPromise = heroVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {}).catch(() => {});
            }
        };

        tryPlay();
        heroVideo.addEventListener('loadedmetadata', tryPlay);
        heroVideo.addEventListener('loadeddata', tryPlay);
        heroVideo.addEventListener('canplay', tryPlay);
        heroVideo.addEventListener('canplaythrough', tryPlay);

        const playOnUserAction = () => {
            heroVideo.play().then(() => {
                document.removeEventListener('click', playOnUserAction);
                document.removeEventListener('touchstart', playOnUserAction);
                document.removeEventListener('touchend', playOnUserAction);
                document.removeEventListener('scroll', playOnUserAction);
                document.removeEventListener('mousemove', playOnUserAction);
            }).catch(() => {});
        };

        document.addEventListener('click', playOnUserAction, { passive: true });
        document.addEventListener('touchstart', playOnUserAction, { passive: true });
        document.addEventListener('touchend', playOnUserAction, { passive: true });
        document.addEventListener('scroll', playOnUserAction, { passive: true });
        document.addEventListener('mousemove', playOnUserAction, { passive: true });
    }

    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    if (window.location.pathname.includes('/yonetim-paneli') || window.location.pathname.includes('panel.html')) {
        yukleRandevular();
        yukleGenelIstatistikler();

        let aramaTimeout;
        const aramaInput = document.getElementById('arama-input');
        if (aramaInput) {
            aramaInput.addEventListener('input', () => {
                clearTimeout(aramaTimeout);
                aramaTimeout = setTimeout(() => {
                    panelState.arama = aramaInput.value;
                    panelState.sayfa = 1;
                    yukleRandevular();
                }, 400);
            });
        }

        const durumSelect = document.getElementById('durum-filtre');
        if (durumSelect) {
            durumSelect.addEventListener('change', () => {
                panelState.durum = durumSelect.value;
                panelState.sayfa = 1;
                yukleRandevular();
            });
        }

        const tarihSelect = document.getElementById('tarih-filtre');
        if (tarihSelect) {
            tarihSelect.addEventListener('change', () => {
                panelState.tarihFiltre = tarihSelect.value;
                panelState.sayfa = 1;
                yukleRandevular();
            });
        }

        const tabAgendaBtn = document.getElementById('tab-agenda-btn');
        const tabCalendarBtn = document.getElementById('tab-calendar-btn');
        const viewAgenda = document.getElementById('view-agenda');
        const viewCalendar = document.getElementById('view-calendar');
        const toolbarEl = document.getElementById('panel-toolbar-el');

        if (tabAgendaBtn && tabCalendarBtn && viewAgenda && viewCalendar) {
            tabAgendaBtn.addEventListener('click', () => {
                tabAgendaBtn.classList.add('active');
                tabCalendarBtn.classList.remove('active');
                viewAgenda.classList.add('active');
                viewCalendar.classList.remove('active');
                if (toolbarEl) toolbarEl.style.display = 'flex';
                yukleRandevular();
            });

            tabCalendarBtn.addEventListener('click', () => {
                tabCalendarBtn.classList.add('active');
                tabAgendaBtn.classList.remove('active');
                viewCalendar.classList.add('active');
                viewAgenda.classList.remove('active');
                if (toolbarEl) toolbarEl.style.display = 'none';
                yukleTakvimRandevulari();
            });
        }

        const prevBtn = document.getElementById('cal-prev-btn');
        const nextBtn = document.getElementById('cal-next-btn');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                calendarDate.setMonth(calendarDate.getMonth() - 1);
                renderCalendar();
                const detailList = document.getElementById('selected-day-appointments');
                const detailTitle = document.getElementById('selected-day-title');
                if (detailList) detailList.innerHTML = '<div class="empty-state-sm">Randevuları görmek için takvimden bir gün seçin.</div>';
                if (detailTitle) detailTitle.innerHTML = 'Randevuları görmek için takvimden bir gün seçin';
            });

            nextBtn.addEventListener('click', () => {
                calendarDate.setMonth(calendarDate.getMonth() + 1);
                renderCalendar();
                const detailList = document.getElementById('selected-day-appointments');
                const detailTitle = document.getElementById('selected-day-title');
                if (detailList) detailList.innerHTML = '<div class="empty-state-sm">Randevuları görmek için takvimden bir gün seçin.</div>';
                if (detailTitle) detailTitle.innerHTML = 'Randevuları görmek için takvimden bir gün seçin';
            });
        }
    }

    if (window.location.pathname.includes('/login') || window.location.pathname.includes('login.html')) {
        if (window.location.protocol === 'file:') {
            const token = localStorage.getItem('adminToken');
            if (token) {
                window.location.href = 'panel.html';
            }
        } else {
            localStorage.removeItem('adminToken');
        }
    }

    const tarihInput = document.getElementById('tarih');
    const saatSelect = document.getElementById('saat');

    if (tarihInput && saatSelect) {
        const bugun = new Date().toISOString().split('T')[0];
        tarihInput.setAttribute('min', bugun);

        tarihInput.addEventListener('change', async (e) => {
            const secilenTarih = e.target.value;
            if (secilenTarih) {
                const dateObj = new Date(secilenTarih);
                if (dateObj.getDay() === 0) {
                    showToast('Pazar günleri kliniğimiz kapalıdır. Lütfen başka bir tarih seçiniz.', 'error');
                    e.target.value = '';
                    saatSelect.innerHTML = '<option value="">Seçiniz</option>';
                    return;
                }
                await saatleriGetir(secilenTarih, 'saat');
            }
        });
    }

    const adminTarihInput = document.getElementById('admin-randevu-tarih');
    const adminSaatSelect = document.getElementById('admin-randevu-saat');
    if (adminTarihInput && adminSaatSelect) {
        const bugun = new Date().toISOString().split('T')[0];
        adminTarihInput.setAttribute('min', bugun);

        adminTarihInput.addEventListener('change', async (e) => {
            const secilenTarih = e.target.value;
            if (secilenTarih) {
                const dateObj = new Date(secilenTarih);
                if (dateObj.getDay() === 0) {
                    showToast('Pazar günleri kliniğimiz kapalıdır. Lütfen başka bir tarih seçiniz.', 'error');
                    e.target.value = '';
                    adminSaatSelect.innerHTML = '<option value="">Seçiniz</option>';
                    return;
                }
                await saatleriGetir(secilenTarih, 'admin-randevu-saat');
            }
        });
    }

    const randevuForm = document.getElementById('randevu-form');
    if (randevuForm) {
        randevuForm.addEventListener('submit', handleRandevuSubmit);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
            } catch (e) {}
            localStorage.removeItem('adminToken');
            window.location.href = window.location.protocol === 'file:' ? 'login.html' : '/login';
        });
    }

    const serviceModal = document.getElementById('service-modal');
    if (serviceModal) {
        serviceModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');

    function openMobileMenu() {
        if (mobileDrawer && mobileOverlay) {
            mobileDrawer.classList.add('open');
            mobileOverlay.classList.add('open');
            if (mobileMenuBtn) mobileMenuBtn.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileMenu() {
        if (mobileDrawer && mobileOverlay) {
            mobileDrawer.classList.remove('open');
            mobileOverlay.classList.remove('open');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            if (mobileDrawer && mobileDrawer.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener('click', closeMobileMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    if (mobileDrawer) {
        mobileDrawer.querySelectorAll('.drawer-nav-btn').forEach(btn => {
            btn.addEventListener('click', closeMobileMenu);
        });
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
            closeMobileMenu();
        }
    });
});


function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}


async function saatleriGetir(tarih, selectId = 'saat') {
    const saatSelect = document.getElementById(selectId);
    if (!saatSelect) return;
    saatSelect.innerHTML = '<option value="">Yükleniyor...</option>';
    saatSelect.disabled = true;

    try {
        const response = await fetch(`${API_URL}/appointments/tarih/${tarih}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result.success) {
            const doluSaatler = result.data.map(s => String(s).substring(0, 5));
            const calismaSaatleri = [
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
                "16:00", "16:30", "17:00", "17:30"
            ];

            saatSelect.innerHTML = '<option value="">Seçiniz</option>';
            saatSelect.disabled = false;

            const bugun = new Date();
            const secilenTarihObj = new Date(tarih);
            const bugunSifir = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
            const secilenSifir = new Date(secilenTarihObj.getFullYear(), secilenTarihObj.getMonth(), secilenTarihObj.getDate());

            const bugunMu = bugunSifir.getTime() === secilenSifir.getTime();
            const simdikiSaat = bugun.getHours();
            const simdikiDakika = bugun.getMinutes();

            calismaSaatleri.forEach(saat => {
                const option = document.createElement('option');
                option.value = saat;
                option.textContent = saat;

                if (bugunMu) {
                    const [s, d] = saat.split(':').map(Number);
                    if (s < simdikiSaat || (s === simdikiSaat && d <= simdikiDakika)) {
                        option.disabled = true;
                        option.textContent += ' (Geçmiş)';
                        option.style.color = '#ccc';
                    }
                }

                if (doluSaatler.includes(saat)) {
                    option.disabled = true;
                    option.textContent += ' (Dolu)';
                    option.style.color = '#ccc';
                }

                saatSelect.appendChild(option);
            });
        } else {
            showToast('Saatler yüklenemedi: ' + result.message, 'error');
            saatSelect.innerHTML = '<option value="">Saatler yüklenemedi</option>';
        }

    } catch (err) {
        showToast('Sunucu bağlantı hatası!', 'error');
        saatSelect.innerHTML = '<option value="">Bağlantı hatası!</option>';
    } finally {
        if (saatSelect.disabled && saatSelect.options.length > 0 && saatSelect.options[0].text !== "Yükleniyor...") {
            saatSelect.disabled = false;
        }
    }
}

async function handleRandevuSubmit(e) {
    e.preventDefault();

    const telefon = document.getElementById('telefon').value.replace(/\s/g, '');
    if (!/^\d{11}$/.test(telefon)) {
        showToast("Lütfen geçerli, 11 haneli bir telefon numarası giriniz.", 'error');
        return;
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.telefon = telefon;

    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showToast("Randevunuz başarıyla oluşturuldu! Sizi arayacağız.", 'success');
            e.target.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            showToast(result.message || "Bir hata oluştu", 'error');
        }

    } catch (err) {
        showToast('Sunucu hatası oluştu.', 'error');
    }
}


async function handleLoginSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            localStorage.setItem('adminToken', result.token);
            showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
            setTimeout(() => {
                window.location.href = window.location.protocol === 'file:' ? 'panel.html' : (result.redirectTo || '/yonetim-paneli');
            }, 1000);
        } else {
            showToast('Giriş başarısız: ' + result.message, 'error');
        }

    } catch (err) {
        showToast('Sunucu hatası.', 'error');
    }
}

let calendarDate = new Date();
let calendarAppointments = [];
let selectedDateStr = "";

const panelState = {
    sayfa: 1,
    arama: '',
    durum: '',
    tarihFiltre: ''
};

async function yukleRandevular() {
    const listDiv = document.getElementById('randevu-listesi');
    if (!listDiv) return;

    listDiv.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...</div>';

    try {
        const token = localStorage.getItem('adminToken');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams({
            sayfa: panelState.sayfa,
            arama: panelState.arama,
            durum: panelState.durum,
            tarihFiltre: panelState.tarihFiltre
        });

        const response = await fetch(`${API_URL}/appointments?${params}`, {
            credentials: 'include',
            headers: headers
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.href = window.location.protocol === 'file:' ? 'login.html' : '/login';
            return;
        }

        const result = await response.json();

        if (result.success) {
            if (typeof window.renderRandevular === 'function') {
                window.renderRandevular(result.data);
            } else {
                renderRandevular(result.data);
            }
            if (typeof window.renderPagination === 'function') {
                window.renderPagination(result.pagination);
            } else {
                renderPagination(result.pagination);
            }
        }

    } catch (err) {
        listDiv.innerHTML = '<div class="empty-state">Veriler yüklenemedi.</div>';
    }
}

async function yukleGenelIstatistikler() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/appointments?sayfa=1&arama=&durum=&tarihFiltre=`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            const bekleyenRes = await fetch(`${API_URL}/appointments?sayfa=1&durum=pending&arama=&tarihFiltre=`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const onaylananRes = await fetch(`${API_URL}/appointments?sayfa=1&durum=approved&arama=&tarihFiltre=`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const bekleyenData = await bekleyenRes.json();
            const onaylananData = await onaylananRes.json();

            document.getElementById('toplam-randevu').textContent = result.pagination.toplam;
            document.getElementById('bekleyen-randevu').textContent = bekleyenData.success ? bekleyenData.pagination.toplam : 0;
            document.getElementById('onaylanan-randevu').textContent = onaylananData.success ? onaylananData.pagination.toplam : 0;
        }
    } catch (err) {}
}

function renderRandevular(randevular) {
    const listDiv = document.getElementById('randevu-listesi');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    if (randevular.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem;margin-bottom:12px;display:block;"></i>Bu kriterlere uygun randevu bulunamadı.</div>';
        return;
    }

    const groups = {};
    randevular.forEach(r => {
        const dateKey = r.tarih.split('T')[0];
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(r);
    });

    const tableHeader = document.createElement('div');
    tableHeader.className = 'randevu-table-header';
    tableHeader.innerHTML = `
        <div class="rt-col rt-col-hasta">Hasta</div>
        <div class="rt-col rt-col-tarih">Saat</div>
        <div class="rt-col rt-col-iletisim">İletişim</div>
        <div class="rt-col rt-col-durum">Durum</div>
        <div class="rt-col rt-col-islem">İşlem</div>
    `;
    listDiv.appendChild(tableHeader);

    Object.keys(groups).forEach(dateKey => {
        const dayAppointments = groups[dateKey];

        const groupContainer = document.createElement('div');
        groupContainer.className = 'agenda-day-group';

        dayAppointments.forEach(r => {
            const durumText = { 'pending': 'Beklemede', 'approved': 'Onaylandı', 'cancelled': 'İptal' };
            const durumClass = { 'pending': 'durum-beklemede', 'approved': 'durum-onaylandi', 'cancelled': 'durum-iptal' };
            const durumIcon = { 'pending': 'fa-hourglass-half', 'approved': 'fa-circle-check', 'cancelled': 'fa-circle-xmark' };

            const satir = document.createElement('div');
            satir.className = 'randevu-satir';

            const colHasta = document.createElement('div');
            colHasta.className = 'rt-col rt-col-hasta';
            const hastaDiv = document.createElement('div');
            hastaDiv.className = 'hasta-bilgi';
            const hastaAd = document.createElement('strong');
            hastaAd.className = 'hasta-ad';
            hastaAd.textContent = r.ad;
            hastaDiv.appendChild(hastaAd);
            if (r.notlar) {
                const notBtn = document.createElement('button');
                notBtn.className = 'hasta-not-btn';
                notBtn.innerHTML = '<i class="fa-solid fa-note-sticky"></i> Notu Gör';
                notBtn.addEventListener('click', () => notGosterText(r.notlar));
                hastaDiv.appendChild(notBtn);
            }
            colHasta.appendChild(hastaDiv);
            satir.appendChild(colHasta);

            const colTarih = document.createElement('div');
            colTarih.className = 'rt-col rt-col-tarih';
            const tarihSaat = document.createElement('span');
            tarihSaat.className = 'tarih-saat';
            tarihSaat.innerHTML = `<i class="fa-regular fa-clock"></i> ${r.saat}`;
            colTarih.appendChild(tarihSaat);
            satir.appendChild(colTarih);

            const colIletisim = document.createElement('div');
            colIletisim.className = 'rt-col rt-col-iletisim';
            const telLink = document.createElement('a');
            telLink.className = 'iletisim-link';
            telLink.href = `tel:${r.telefon}`;
            telLink.innerHTML = `<i class="fa-solid fa-phone"></i> ${r.telefon}`;
            const emailSpan = document.createElement('span');
            emailSpan.className = 'iletisim-email';
            const emailText = r.email ? (r.email.length > 20 ? r.email.substring(0, 20) + '…' : r.email) : '—';
            emailSpan.innerHTML = `<i class="fa-regular fa-envelope"></i> ${emailText}`;
            if (r.email) emailSpan.title = r.email;
            colIletisim.appendChild(telLink);
            colIletisim.appendChild(emailSpan);
            satir.appendChild(colIletisim);

            const colDurum = document.createElement('div');
            colDurum.className = 'rt-col rt-col-durum';
            const badge = document.createElement('span');
            badge.className = `durum-badge ${durumClass[r.durum]}`;
            badge.innerHTML = `<i class="fa-solid ${durumIcon[r.durum]}"></i> ${durumText[r.durum]}`;
            colDurum.appendChild(badge);
            satir.appendChild(colDurum);

            const colIslem = document.createElement('div');
            colIslem.className = 'rt-col rt-col-islem';
            const islemBtns = document.createElement('div');
            islemBtns.className = 'islem-btns';

            if (r.durum === 'pending') {
                const onaylaBtn = document.createElement('button');
                onaylaBtn.className = 'btn-icon btn-icon-onayla';
                onaylaBtn.title = 'Onayla';
                onaylaBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                onaylaBtn.addEventListener('click', () => randevuDurumGuncelle(r.id, 'approved'));
                islemBtns.appendChild(onaylaBtn);

                const reddetBtn = document.createElement('button');
                reddetBtn.className = 'btn-icon btn-icon-iptal';
                reddetBtn.title = 'Reddet';
                reddetBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                reddetBtn.addEventListener('click', () => randevuDurumGuncelle(r.id, 'cancelled'));
                islemBtns.appendChild(reddetBtn);
            }

            if (r.durum === 'approved') {
                const iptalBtn = document.createElement('button');
                iptalBtn.className = 'btn-icon btn-icon-iptal';
                iptalBtn.title = 'İptal Et';
                iptalBtn.innerHTML = '<i class="fa-solid fa-ban"></i>';
                iptalBtn.addEventListener('click', () => randevuDurumGuncelle(r.id, 'cancelled'));
                islemBtns.appendChild(iptalBtn);
            }

            const silBtn = document.createElement('button');
            silBtn.className = 'btn-icon btn-icon-sil';
            silBtn.title = 'Sil';
            silBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            silBtn.addEventListener('click', () => randevuSil(r.id));
            islemBtns.appendChild(silBtn);

            colIslem.appendChild(islemBtns);
            satir.appendChild(colIslem);

            groupContainer.appendChild(satir);
        });

        listDiv.appendChild(groupContainer);
    });
}

async function yukleTakvimRandevulari() {
    const daysGrid = document.getElementById('calendar-days');
    if (!daysGrid) return;

    daysGrid.innerHTML = '<div class="empty-state-sm" style="grid-column: span 7;"><i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...</div>';

    try {
        const token = localStorage.getItem('adminToken');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/appointments?limit=1000`, {
            credentials: 'include',
            headers: headers
        });

        const result = await response.json();
        if (result.success) {
            calendarAppointments = result.data;
            renderCalendar();

            if (selectedDateStr) {
                const targetDate = new Date(selectedDateStr);
                const dayApps = calendarAppointments.filter(app => app.tarih.split('T')[0] === selectedDateStr);
                if (typeof window.renderSelectedDayAppointments === 'function') {
                    window.renderSelectedDayAppointments(dayApps, targetDate);
                } else {
                    renderSelectedDayAppointments(dayApps, targetDate);
                }
            }
        }
    } catch (err) {
        daysGrid.innerHTML = '<div class="empty-state-sm" style="grid-column: span 7;">Yükleme hatası.</div>';
    }
}

function renderCalendar() {
    const daysGrid = document.getElementById('calendar-days');
    const monthTitle = document.getElementById('cal-month-title');
    if (!daysGrid || !monthTitle) return;

    daysGrid.innerHTML = '';

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const monthsTr = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    monthTitle.textContent = `${monthsTr[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const getDayBox = window.createDayBox || createDayBox;

    for (let i = startDayOffset; i > 0; i--) {
        const dayNum = prevMonthTotalDays - i + 1;
        daysGrid.appendChild(getDayBox(year, month - 1, dayNum, true));
    }

    for (let i = 1; i <= totalDays; i++) {
        daysGrid.appendChild(getDayBox(year, month, i, false));
    }

    const totalRendered = startDayOffset + totalDays;
    const remaining = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
    for (let i = 1; i <= remaining; i++) {
        daysGrid.appendChild(getDayBox(year, month + 1, i, true));
    }
}

function createDayBox(year, month, day, isOtherMonth) {
    const targetDate = new Date(year, month, day);
    const yStr = targetDate.getFullYear();
    const mStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(targetDate.getDate()).padStart(2, '0');
    const dateKeyStr = `${yStr}-${mStr}-${dStr}`;

    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day-box';
    if (isOtherMonth) dayBox.classList.add('other-month');

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateKeyStr === todayStr) dayBox.classList.add('today');
    if (selectedDateStr === dateKeyStr) dayBox.classList.add('selected');

    const numEl = document.createElement('span');
    numEl.className = 'day-number';
    numEl.textContent = day;
    dayBox.appendChild(numEl);

    const dayAppointments = calendarAppointments.filter(app => app.tarih.split('T')[0] === dateKeyStr);
    dayAppointments.sort((a, b) => a.saat.localeCompare(b.saat));

    const eventsEl = document.createElement('div');
    eventsEl.className = 'calendar-day-events';

    const dotsEl = document.createElement('div');
    dotsEl.className = 'calendar-day-dots';

    dayAppointments.forEach(app => {
        const eventEl = document.createElement('div');
        eventEl.className = `calendar-day-event ${app.durum}`;
        eventEl.textContent = `${app.saat} ${app.ad}`;
        eventsEl.appendChild(eventEl);

        const dotEl = document.createElement('span');
        dotEl.className = `cal-dot ${app.durum}`;
        dotsEl.appendChild(dotEl);
    });

    dayBox.appendChild(eventsEl);
    dayBox.appendChild(dotsEl);

    dayBox.addEventListener('click', () => {
        const prevSelected = document.querySelector('.calendar-day-box.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        dayBox.classList.add('selected');
        selectedDateStr = dateKeyStr;
        if (typeof window.renderSelectedDayAppointments === 'function') {
            window.renderSelectedDayAppointments(dayAppointments, targetDate);
        } else {
            renderSelectedDayAppointments(dayAppointments, targetDate);
        }
    });

    return dayBox;
}

function renderSelectedDayAppointments(appointments, date) {
    const detailList = document.getElementById('selected-day-appointments');
    const detailTitle = document.getElementById('selected-day-title');
    if (!detailList || !detailTitle) return;

    const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
    detailTitle.innerHTML = `<i class="fa-solid fa-calendar-day" style="color:#00b4d8;margin-right:8px;"></i> ${dateStr} Randevuları`;

    detailList.innerHTML = '';

    if (appointments.length === 0) {
        detailList.innerHTML = '<div class="empty-state-sm">Seçilen gün için kayıtlı randevu bulunmuyor.</div>';
        return;
    }

    appointments.forEach(r => {
        const durumText = { 'pending': 'Beklemede', 'approved': 'Onaylandı', 'cancelled': 'İptal' };
        const durumClass = { 'pending': 'durum-beklemede', 'approved': 'durum-onaylandi', 'cancelled': 'durum-iptal' };
        const durumIcon = { 'pending': 'fa-hourglass-half', 'approved': 'fa-circle-check', 'cancelled': 'fa-circle-xmark' };

        const card = document.createElement('div');
        card.className = 'calendar-detail-card';

        card.innerHTML = `
            <div style="border-bottom:1px dashed #e2e8f0;padding-bottom:10px;margin-bottom:8px;display:flex;justify-content:space-between;width:100%;align-items:center;">
                <div class="hasta-bilgi" style="display:flex;flex-direction:column;gap:4px;">
                    <strong class="hasta-ad" style="font-size:15px;font-weight:600;color:#0f172a;">${r.ad}</strong>
                    ${r.notlar ? `<button class="hasta-not-btn" type="button"><i class="fa-solid fa-note-sticky"></i> Notu Gör</button>` : ''}
                </div>
                <span class="durum-badge ${durumClass[r.durum]}">
                    <i class="fa-solid ${durumIcon[r.durum]}"></i> ${durumText[r.durum]}
                </span>
            </div>
            <div class="card-info-row">
                <span>Saat:</span>
                <span class="tarih-saat"><i class="fa-regular fa-clock"></i> ${r.saat}</span>
            </div>
            <div class="card-info-row">
                <span>Telefon:</span>
                <a href="tel:${r.telefon}"><i class="fa-solid fa-phone"></i> ${r.telefon}</a>
            </div>
            <div class="card-info-row">
                <span>E-posta:</span>
                <span>${r.email || '—'}</span>
            </div>
            <div style="border-top:1px solid #f1f5f9;padding-top:12px;margin-top:10px;display:flex;justify-content:flex-end;gap:8px;width:100%;align-items:center;">
                <div class="islem-btns">
                    ${r.durum === 'pending' ? `
                        <button class="btn-icon btn-icon-onayla" title="Onayla" type="button"><i class="fa-solid fa-check"></i></button>
                        <button class="btn-icon btn-icon-iptal" title="Reddet" type="button"><i class="fa-solid fa-xmark"></i></button>
                    ` : ''}
                    ${r.durum === 'approved' ? `
                        <button class="btn-icon btn-icon-iptal" title="İptal Et" type="button"><i class="fa-solid fa-ban"></i></button>
                    ` : ''}
                    <button class="btn-icon btn-icon-sil" title="Sil" type="button"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;

        const notBtn = card.querySelector('.hasta-not-btn');
        if (notBtn) {
            notBtn.addEventListener('click', () => notGosterText(r.notlar));
        }

        const onaylaBtn = card.querySelector('.btn-icon-onayla');
        if (onaylaBtn) {
            onaylaBtn.addEventListener('click', async () => {
                await randevuDurumGuncelle(r.id, 'approved');
                await yukleTakvimRandevulari();
            });
        }

        const reddetBtn = card.querySelector('.btn-icon-iptal');
        if (reddetBtn) {
            reddetBtn.addEventListener('click', async () => {
                await randevuDurumGuncelle(r.id, 'cancelled');
                await yukleTakvimRandevulari();
            });
        }

        const silBtn = card.querySelector('.btn-icon-sil');
        if (silBtn) {
            silBtn.addEventListener('click', async () => {
                await randevuSil(r.id);
                await yukleTakvimRandevulari();
            });
        }

        detailList.appendChild(card);
    });
}

function notGosterText(not) {
    const eskiModal = document.getElementById('not-modal');
    if (eskiModal) eskiModal.remove();

    const modal = document.createElement('div');
    modal.id = 'not-modal';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; transition: opacity 0.2s ease;';
    
    const box = document.createElement('div');
    box.style.cssText = 'background: white; border-radius: 20px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; transform: translateY(0) scale(1); animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); transition: all 0.2s ease;';
    
    box.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
            <div style="display: flex; align-items: center; gap: 12px; color: #0f172a; font-weight: 600; font-size: 16px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                    <i class="fa-solid fa-note-sticky"></i>
                </div>
                Hasta Notu
            </div>
            <button class="not-modal-kapat" style="background: transparent; border: none; width: 32px; height: 32px; font-size: 18px; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 8px;" onmouseover="this.style.color='#ef4444'; this.style.backgroundColor='#fee2e2'" onmouseout="this.style.color='#94a3b8'; this.style.backgroundColor='transparent'">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div style="padding: 24px; font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-wrap;"></div>
    `;
    box.querySelector('div:nth-child(2)').textContent = not;

    const kapatBtn = box.querySelector('.not-modal-kapat');
    const closeIt = () => {
        modal.style.opacity = '0';
        box.style.transform = 'scale(0.95) translateY(10px)';
        setTimeout(() => modal.remove(), 200);
    };
    kapatBtn.addEventListener('click', closeIt);

    modal.appendChild(box);
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) closeIt();
    });
    
    if (!document.getElementById('not-modal-style')) {
        const style = document.createElement('style');
        style.id = 'not-modal-style';
        style.innerHTML = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(modal);
}

window.notGoster = function(btn) {
    const not = btn.getAttribute('data-not');
    notGosterText(not);
};


function renderPagination(pagination) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    container.innerHTML = '';

    if (!pagination || pagination.toplamSayfa <= 1) return;

    const { sayfa, toplamSayfa, toplam, sayfaBasina } = pagination;

    const info = document.createElement('div');
    info.className = 'pagination-info';
    const baslangic = (sayfa - 1) * sayfaBasina + 1;
    const bitis = Math.min(sayfa * sayfaBasina, toplam);
    info.textContent = `${toplam} randevudan ${baslangic}–${bitis} gösteriliyor`;
    container.appendChild(info);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'pagination-btns';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn' + (sayfa === 1 ? ' disabled' : '');
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = sayfa === 1;
    prevBtn.onclick = () => { panelState.sayfa = sayfa - 1; yukleRandevular(); };
    btnGroup.appendChild(prevBtn);

    const pencere = 2;
    for (let i = 1; i <= toplamSayfa; i++) {
        if (i === 1 || i === toplamSayfa || (i >= sayfa - pencere && i <= sayfa + pencere)) {
            const btn = document.createElement('button');
            btn.className = 'page-btn' + (i === sayfa ? ' active' : '');
            btn.textContent = i;
            btn.onclick = () => { panelState.sayfa = i; yukleRandevular(); };
            btnGroup.appendChild(btn);
        } else if (
            (i === sayfa - pencere - 1 && i > 1) ||
            (i === sayfa + pencere + 1 && i < toplamSayfa)
        ) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            btnGroup.appendChild(ellipsis);
        }
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn' + (sayfa === toplamSayfa ? ' disabled' : '');
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = sayfa === toplamSayfa;
    nextBtn.onclick = () => { panelState.sayfa = sayfa + 1; yukleRandevular(); };
    btnGroup.appendChild(nextBtn);

    container.appendChild(btnGroup);
}

async function randevuDurumGuncelle(id, yeniDurum) {
    try {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: headers,
            body: JSON.stringify({ durum: yeniDurum })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturum süresi dolmuş, lütfen tekrar giriş yapın.', 'error');
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast(yeniDurum === 'approved' ? '✓ Randevu onaylandı' : yeniDurum === 'cancelled' ? '✕ Randevu reddedildi' : 'Durum güncellendi', 'success');
            yukleRandevular();
            yukleGenelIstatistikler();
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (err) {
        showToast('Sunucu hatası', 'error');
    }
}
window.randevuDurumGuncelle = randevuDurumGuncelle;

async function randevuSil(id) {
    try {
        const token = localStorage.getItem('adminToken');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: headers
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturum süresi dolmuş, lütfen tekrar giriş yapın.', 'error');
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('🗑 Randevu silindi', 'success');
            yukleRandevular();
            yukleGenelIstatistikler();
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (err) {
        showToast('Sunucu hatası', 'error');
    }
}
window.randevuSil = randevuSil;


const serviceContents = {
    'muayene': { title: 'Muayene ve Teşhis', body: '<p>Ağız ve diş sağlığının temeli doğru teşhisle atılır. Panoramik röntgen ve detaylı ağız içi muayene ile sorunlar erken tespit edilir.</p>' },
    'implant': { title: 'Dental İmplant', body: '<p>Eksik dişlerinizi tamamlamak için çene kemiğine yerleştirilen titanyum ve zirkonyum vidalardır. Doğal dişe en yakın alternatiftir.</p>' },
    'gulus': { title: 'Gülüş Tasarımı', body: '<p>Dudak seviyesi, diş boyu ve yüz hattınıza göre size özel "Altın Oran" gülüş tasarımı yapıyoruz. Dijital ortamda sonucu önceden görün.</p>' },
    'zirkonyum': { title: 'Zirkonyum-Laminate', body: '<p>Işık geçirgenliği yüksek, metal içermeyen ve diş etiyle tam uyumlu kaplamalardır. Estetik beklentisi yüksek hastalar için idealdir.</p>' },
    'lamina': { title: 'Lamina Veneer', body: '<p>Dişlerin sadece ön yüzeyine yapıştırılan, çok az aşındırma gerektiren ince yaprak porselenlerdir. Mükemmel estetik sağlar.</p>' },
    'endo_cerrahi': { title: 'Endodontik Cerrahi', body: '<p>Kanal tedavisinin yetersiz kaldığı durumlarda kök ucuna cerrahi müdahale yapılarak dişin kurtarılması işlemidir.</p>' },
    'kanal': { title: 'Kanal Tedavisi', body: '<p>Çürüğün dişin sinirine (pulpa) ulaştığı durumlarda uygulanan, dişi çekimden kurtaran tedavidir.</p>' },
    'gomulu': { title: 'Gömülü Diş Operasyonları', body: '<p>Özellikle 20 yaş dişlerinin neden olduğu ağrı ve çapraşıklıkları önlemek için yapılan cerrahi çekimlerdir.</p>' },
    'tme': { title: 'Çene Eklemi (TME) Tedavisi', body: '<p>Çene ekleminden ses gelmesi, ağrı veya kilitlenme gibi sorunların splint ve fizik tedavi ile çözülmesidir.</p>' },
    'dolgu': { title: 'Estetik Diş Dolguları', body: '<p>Siyah amalgam dolgular yerine, diş rengindeki kompozit dolgularla hem estetik hem sağlıklı bir restorasyon sunuyoruz.</p>' },
    'ortodonti': { title: 'Ortodontik Tedavi', body: '<p>Diş çapraşıklıklarının metal veya porselen tellerle düzeltilmesi işlemidir. Her yaşta uygulanabilir.</p>' },
    'pedodonti': { title: 'Çocuk Diş Hekimliği', body: '<p>Süt dişlerinin korunması, yer tutucular ve çocuklara özel koruyucu tedavilerle diş hekimi fobisini yeniyoruz.</p>' },
    'dis_eti': { title: 'Diş Eti Hastalıkları', body: '<p>Diş taşı temizliği, küretaj ve diş eti ameliyatları ile diş etlerinizi sağlığına kavuşturuyoruz.</p>' },
    'protez': { title: 'Hareketli Protezler', body: '<p>Çok sayıda diş eksikliğinde uygulanan, takıp çıkarılabilen damak protezleridir.</p>' },
    'lazer': { title: 'Lazer Uygulamaları', body: '<p>Diş eti şekillendirme (Gingivektomi) ve ağız içi yaraların tedavisinde kanamasız ve ağrısız lazer teknolojisi.</p>' },
    'kist': { title: 'Kist ve Tümör Tedavileri', body: '<p>Çene kemiği veya yumuşak dokuda oluşan patolojik kistlerin cerrahi olarak çıkarılmasıdır.</p>' },
    'beyazlatma': { title: 'Diş Beyazlatma', body: '<p>Lazer aktivasyonu ile dişlerin doğal renginin 3-4 ton açılması işlemidir.</p>' },
    'invisalign': { title: 'Şeffaf Plak (Invisalign)', body: '<p>Diş telleri olmadan, şeffaf plaklar kullanılarak yapılan konforlu ve estetik diş düzeltme tedavisidir.</p>' }
};

window.openModal = function (key) {
    const data = serviceContents[key];
    if (data) {
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-body').innerHTML = data.body;
        document.getElementById('service-modal').classList.add('active');
    }
};

window.closeModal = function () {
    const modal = document.getElementById('service-modal');
    if (modal) modal.classList.remove('active');
};
