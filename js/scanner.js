// sys-wms-web/js/scanner.js

document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.sbClient;
    if(!supabase) {
        console.error("Supabase not linked."); 
        return;
    }

    // --- Translations ---
    const TRANSLATIONS = {
        en: {
            'setup-title': 'Device Setup',
            'setup-desc': 'Enter your Company Code to link this scanner to your database.',
            'company-code': 'Company Code',
            'authenticate': 'Authenticate',
            'check-in': 'Check In',
            'check-out': 'Check Out',
            'point-camera': 'Point at Barcode',
            'worker-profile': 'Worker Profile',
            'overtime-hrs': 'Overtime (Hrs)',
            'btn-rescan': 'Rescan',
            'btn-confirm-in': 'Confirm In',
            'btn-confirm-out': 'Confirm Out',
            'err-empty-code': 'Please enter a company code.',
            'alert-logout': 'Logout from this scanner device?',
            'msg-locating': 'Locating Worker...',
            'msg-unknown': 'Unknown Worker',
            'msg-saving': 'Saving...',
            'msg-saved': 'Saved!',
            'msg-retry': 'Retry',
            'err-failed': 'Failed to log attendance.',
            'err-invalid-code': 'Invalid Company Code. Access Denied.',
            'flash-in': 'Checked In!',
            'flash-out': 'Checked Out!'
        },
        ar: {
            'setup-title': 'إعداد الجهاز',
            'setup-desc': 'أدخل رمز الشركة لربط هذا الماسح بقاعدة البيانات.',
            'company-code': 'رمز الشركة',
            'authenticate': 'مصادقة',
            'check-in': 'تسجيل الدخول',
            'check-out': 'تسجيل الخروج',
            'point-camera': 'وجه الكاميرا للباركود',
            'worker-profile': 'ملف العامل',
            'overtime-hrs': 'وقت إضافي (ساعات)',
            'btn-rescan': 'إلغاء / مسح جديد',
            'btn-confirm-in': 'تأكيد الدخول',
            'btn-confirm-out': 'تأكيد الخروج',
            'err-empty-code': 'يرجى إدخال رمز الشركة.',
            'alert-logout': 'تسجيل الخروج من هذا الماسح؟',
            'msg-locating': 'جاري البحث...',
            'msg-unknown': 'عامل غير معروف',
            'msg-saving': 'جاري الحفظ...',
            'msg-saved': 'تم الحفظ!',
            'msg-retry': 'إعادة المحاولة',
            'err-failed': 'فشل تسجيل الحضور.',
            'err-invalid-code': 'رمز الشركة غير صحيح. تم رفض الوصول.',
            'flash-in': 'تم الدخول!',
            'flash-out': 'تم الخروج الموفق!'
        }
    };

    let currentLang = localStorage.getItem('wms_scanner_lang') || 'en';
    
    function applyLang() {
        const dict = TRANSLATIONS[currentLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(dict[key]) el.textContent = dict[key];
        });
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLang;
        document.getElementById('lang-btn').textContent = currentLang === 'ar' ? 'EN' : 'ع';
    }
    
    document.getElementById('lang-btn').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('wms_scanner_lang', currentLang);
        applyLang();
    });
    
    applyLang();

    // --- Dynamic Error Translation ---
    function translateError(msg) {
        if (currentLang !== 'ar') return msg;
        if (!msg) return TRANSLATIONS['ar']['err-failed'];
        
        if (msg.includes('Invalid Company Code')) return 'رمز الشركة غير صحيح';
        if (msg.includes('Worker not found')) return 'العامل غير موجود أو غير مسجل في هذه الشركة';
        if (msg.includes('has no active shift today')) return 'لا يمكن تسجيل الخروج: العامل ليس لديه حضور مسجل اليوم';
        if (msg.includes('has already checked out today')) return 'تم تسجيل خروج هذا العامل مسبقاً اليوم';
        if (msg.includes('is already checked in today')) return 'هذا العامل مسجل حضوره مسبقاً اليوم';
        if (msg.includes('Invalid action mode')) return 'وضع المسح غير صحيح';
        
        return msg;
    }

    // --- Screens & UI Elements ---
    const screenLogin = document.getElementById('login-screen');
    const screenScanner = document.getElementById('scanner-interface');
    
    const loginCode = document.getElementById('login-code');
    const loginSubmit = document.getElementById('login-submit');
    const companyBadge = document.getElementById('company-badge');
    const companyCodeDisplay = document.getElementById('company-code-display');
    const logoutBtn = document.getElementById('logout-btn');

    const btnModeIn = document.getElementById('mode-in');
    const btnModeOut = document.getElementById('mode-out');

    const resultOverlay = document.getElementById('result-overlay');
    const resWorkerName = document.getElementById('res-worker-name');
    const resWorkerId = document.getElementById('res-worker-id');
    const otContainer = document.getElementById('ot-container');
    const resOt = document.getElementById('res-ot');
    const btnCancel = document.getElementById('btn-cancel');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnConfirmText = document.getElementById('btn-confirm-text');
    const resMessage = document.getElementById('res-message');
    const scanBrackets = document.getElementById('scan-brackets');
    
    const successFlash = document.getElementById('success-flash');
    const successFlashTitle = document.getElementById('success-flash-title');
    const successFlashName = document.getElementById('success-flash-name');

    // Overtime Adjusters
    document.getElementById('ot-plus').addEventListener('click', () => {
        resOt.value = parseFloat(resOt.value) + 0.5;
    });
    document.getElementById('ot-minus').addEventListener('click', () => {
        if(parseFloat(resOt.value) >= 0.5) resOt.value = parseFloat(resOt.value) - 0.5;
    });

    let currentCompanyCode = localStorage.getItem('wms_scanner_company');
    if (currentCompanyCode) currentCompanyCode = currentCompanyCode.toUpperCase();
    
    let currentMode = 'in'; // 'in' or 'out' default
    let currentScanId = null;
    let html5QrCode = null;
    let isProcessing = false;

    // --- Initialization ---
    if (currentCompanyCode) {
        activateScannerMode();
    } else {
        screenLogin.classList.remove('translate-y-full');
    }

    loginSubmit.addEventListener('click', async () => {
        const code = loginCode.value.trim().toUpperCase();
        if(!code) { alert(TRANSLATIONS[currentLang]['err-empty-code']); return; }
        
        // Disable UI and show loading state
        loginSubmit.disabled = true;
        loginSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span>`;
        
        try {
            // Verify code securely against the database before allowing camera access
            const { data, error } = await window.sbClient.rpc('verify_scanner_code', { p_company_code: code });
            
            if (error) throw error;
            
            if (data && data.valid) {
                currentCompanyCode = code;
                localStorage.setItem('wms_scanner_company', code);
                activateScannerMode();
            } else {
                alert(TRANSLATIONS[currentLang]['err-invalid-code'] || 'Invalid Company Code. Access Denied.');
                loginCode.value = '';
                loginCode.focus();
            }
        } catch (err) {
            console.error("Scanner Auth Error:", err);
            alert("Connection error verifying code.");
        } finally {
            // Restore UI
            loginSubmit.disabled = false;
            loginSubmit.innerHTML = `<span data-i18n="authenticate">${TRANSLATIONS[currentLang]['authenticate']}</span> <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
        }
    });

    logoutBtn.addEventListener('click', () => {
        if(confirm(TRANSLATIONS[currentLang]['alert-logout'])) {
            localStorage.removeItem('wms_scanner_company');
            currentCompanyCode = null;
            companyBadge.classList.add('hidden');
            companyBadge.classList.remove('flex');
            loginCode.value = '';
            stopCamera();
            screenLogin.classList.remove('-translate-y-full');
            screenScanner.classList.add('hidden');
        }
    });

    // --- Mode Selection ---
    function setModeUI() {
        if(currentMode === 'in') {
            btnModeIn.className = 'flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1.5 bg-emerald-500 text-white shadow-md active-mode';
            btnModeOut.className = 'flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 text-white/70 hover:text-white backdrop-blur-sm';
        } else {
            btnModeOut.className = 'flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1.5 bg-rose-500 text-white shadow-md active-mode';
            btnModeIn.className = 'flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 text-white/70 hover:text-white backdrop-blur-sm';
        }
    }

    btnModeIn.addEventListener('click', () => { if(isProcessing) return; currentMode = 'in'; setModeUI(); hideResult(); });
    btnModeOut.addEventListener('click', () => { if(isProcessing) return; currentMode = 'out'; setModeUI(); hideResult(); });

    // --- Scanner Logic ---
    function activateScannerMode() {
        screenLogin.classList.add('-translate-y-full'); // Slide up out of view
        setTimeout(() => {
            screenScanner.classList.remove('hidden');
            screenScanner.classList.add('flex');
            companyBadge.classList.remove('hidden');
            companyBadge.classList.add('flex');
            companyCodeDisplay.textContent = currentCompanyCode;
            setModeUI();
            startCamera();
        }, 300);
    }

    async function startCamera() {
        if (html5QrCode) return;
        html5QrCode = new Html5Qrcode("reader");
        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                () => {} // ignore scan failures internally
            );
        } catch(err) {
            console.error("Camera fail", err);
            // Optionally fallback or alert user to grant permissions
        }
    }

    function stopCamera() {
        if(html5QrCode) {
            html5QrCode.stop().then(() => { html5QrCode.clear(); html5QrCode = null; }).catch(e=>console.error(e));
        }
    }

    function onScanSuccess(decodedText) {
        if (isProcessing) return;
        isProcessing = true;
        
        scanBrackets.classList.add('scanning'); // Animates the reticle to green
        
        // Pause underlying scanner processing
        if (html5QrCode) html5QrCode.pause();
        processScannedBarcode(decodedText);
    }

    // --- Processing ---
    function processScannedBarcode(barcode) {
        currentScanId = barcode;
        resWorkerId.textContent = barcode;
        resWorkerName.textContent = TRANSLATIONS[currentLang]['msg-locating'];
        resMessage.classList.add('hidden');
        
        // Setup Result Overlay UI
        if(currentMode === 'in') {
            otContainer.classList.add('hidden');
            btnConfirm.className = 'flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto';
            btnConfirmText.textContent = TRANSLATIONS[currentLang]['btn-confirm-in'];
        } else {
            otContainer.classList.remove('hidden');
            resOt.value = 0;
            btnConfirm.className = 'flex-[2] py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto';
            btnConfirmText.textContent = TRANSLATIONS[currentLang]['btn-confirm-out'];
        }

        btnConfirm.disabled = true;
        showResult();
        verifyWorker(barcode);
    }

    function showResult() {
        resultOverlay.classList.remove('translate-y-full');
    }

    function hideResult() {
        resultOverlay.classList.add('translate-y-full');
        scanBrackets.classList.remove('scanning');
        isProcessing = false;
        try {
            if (html5QrCode) html5QrCode.resume();
        } catch(err) {
            // Ignore resume errors if already running
        }
    }

    async function verifyWorker(barcode) {
        try {
            const { data, error } = await supabase.rpc('get_scanner_worker_info', {
                p_company_code: currentCompanyCode,
                p_worker_barcode: barcode
            });
            if (error) throw error; // Will be caught
            
            resWorkerName.textContent = data;
            btnConfirm.disabled = false;
            
            // AUTO-CONFIRM MAGIC for Check-In
            if(currentMode === 'in') {
                 // Automatically submit the check-in to save time
                 btnConfirm.click();
            }

        } catch(err) {
            console.error(err);
            resWorkerName.textContent = TRANSLATIONS[currentLang]['msg-unknown'];
            resMessage.textContent = translateError(err.message) + ` (C: [${currentCompanyCode}] B: [${barcode}])`;
            resMessage.classList.remove('hidden');
            // User must click Rescan
        }
    }

    btnCancel.addEventListener('click', hideResult);

    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirmText.textContent = TRANSLATIONS[currentLang]['msg-saving'];
        
        try {
            const otValue = parseFloat(resOt.value) || 0;
            const { data, error } = await supabase.rpc('log_scanner_attendance', {
                p_company_code: currentCompanyCode,
                p_action_mode: currentMode,
                p_worker_barcode: currentScanId,
                p_overtime: otValue
            });
            
            if (error) throw error;
            
            // Show massive success flash!
            hideResult();
            
            successFlashTitle.textContent = currentMode === 'in' ? TRANSLATIONS[currentLang]['flash-in'] : TRANSLATIONS[currentLang]['flash-out'];
            successFlashName.textContent = resWorkerName.textContent;
            successFlash.classList.remove('opacity-0', 'pointer-events-none', 'scale-110');
            successFlash.classList.add('opacity-100', 'scale-100');
            if(currentMode === 'out') {
                successFlash.classList.replace('bg-emerald-500', 'bg-rose-500');
            } else {
                successFlash.classList.replace('bg-rose-500', 'bg-emerald-500');
            }

            // Hide success flash after 1.5 seconds and resume scanning
            setTimeout(() => {
                successFlash.classList.remove('opacity-100', 'scale-100');
                successFlash.classList.add('opacity-0', 'pointer-events-none', 'scale-110');
            }, 1500);

        } catch(err) {
            console.error(err);
            resMessage.textContent = translateError(err.message) || TRANSLATIONS[currentLang]['err-failed'];
            resMessage.classList.remove('hidden');
            btnConfirmText.textContent = TRANSLATIONS[currentLang]['msg-retry'];
            btnConfirm.disabled = false;
        }
    });
});
