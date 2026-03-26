// sys-wms-web/js/scanner.js

document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.sbClient;
    if (!supabase) {
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
            'flash-out': 'Checked Out!', 'setup-config': 'Session Configuration', 'prof-id': 'Professor ID', 'prof-name': 'Professor Name', 'college-code': 'College Code', 'grade-stage': 'Grade / Stage', 'subject': 'Subject', 'first-year': 'First Year', 'second-year': 'Second Year', 'third-year': 'Third Year', 'fourth-year': 'Fourth Year', 'back': 'Back', 'next-step': 'Next Step', 'setup-desc-text': 'Configure your scanner session parameters.', 'start-scanning': 'Start Scanning', 'grade': 'Grade', 'student-profile': 'Student Profile', 'student-name': 'Student Name', 'enter-both-ids': 'Please enter both College and Professor IDs.', 'invalid-prof': 'Invalid Professor ID.', 'verifying': 'Verifying...',
            'attendance-logged': 'Attendance Logged!',
            'select-camera': 'Camera Source',
            'loading-cameras': 'Scanning for cameras...',
            'no-cameras': 'No cameras found'
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
            'flash-out': 'تم الخروج الموفق!', 'setup-config': 'إعداد الجلسة', 'prof-id': 'معرف الأستاذ', 'prof-name': 'اسم الأستاذ', 'college-code': 'رمز الكلية', 'grade-stage': 'المرحلة / الصف', 'subject': 'المادة', 'first-year': 'المرحلة الأولى', 'second-year': 'المرحلة الثانية', 'third-year': 'المرحلة الثالثة', 'fourth-year': 'المرحلة الرابعة', 'back': 'رجوع', 'next-step': 'الخطوة التالية', 'setup-desc-text': 'قم بإعداد معلومات جلسة المسح الخاصة بك.', 'start-scanning': 'بدء المسح', 'grade': 'المرحلة', 'student-profile': 'ملف الطالب', 'student-name': 'اسم الطالب', 'enter-both-ids': 'يرجى إدخال رمز الكلية ومعرف الأستاذ.', 'invalid-prof': 'معرف الأستاذ غير صحيح.', 'verifying': 'جاري التحقق...',
            'attendance-logged': 'تم تسجيل الحضور!',
            'select-camera': 'مصدر الكاميرا',
            'loading-cameras': 'جاري البحث عن الكاميرات...',
            'no-cameras': 'لم يتم العثور على كاميرات'
        }
    };

    let currentLang = localStorage.getItem('wms_scanner_lang') || 'en';

    function applyLang() {
        const dict = TRANSLATIONS[currentLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.placeholder = dict[key];
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

    let currentCompanyCode = '';
    let currentProfId = '';
    let currentProfName = '';
    let profAssignments = [];
    let currentSubject = '';
    let currentGrade = '';
    let currentScanId = '';
    let isProcessing = false;
    let html5QrCode = null;

    const resStudentName = document.getElementById('res-student-name');
    const resStudentId = document.getElementById('res-student-id');
    const resMessage = document.getElementById('res-message');
    const btnCancel = document.getElementById('btn-cancel');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnConfirmText = document.getElementById('btn-confirm-text');
    const resultOverlay = document.getElementById('result-overlay');
    const scanBrackets = document.getElementById('scan-brackets');
    const successFlash = document.getElementById('success-flash');
    const successFlashTitle = document.getElementById('success-flash-title');
    const successFlashName = document.getElementById('success-flash-name');

    const loginCode = document.getElementById('login-code');
    const profIdInput = document.getElementById('prof-id');
    const btnNextStep = document.getElementById('btn-next-step');
    const setupStep1 = document.getElementById('setup-step-1');
    const setupStep2 = document.getElementById('setup-step-2');
    const step1Error = document.getElementById('step-1-error');
    const displayProfName = document.getElementById('display-prof-name');
    const scanGradeSetup = document.getElementById('scan-grade');
    const scanSubjectSetup = document.getElementById('scan-subject-setup');
    const btnBackStep = document.getElementById('btn-back-step');
    const btnBackStepMobile = document.getElementById('btn-back-step-mobile');
    const loginSubmit = document.getElementById('login-submit');
    const companyBadge = document.getElementById('company-badge');
    const companyCodeDisplay = document.getElementById('company-code-display');
    const logoutBtn = document.getElementById('logout-btn');
    const displaySubject = document.getElementById('display-subject');
    const displayGrade = document.getElementById('display-grade');
    const cameraSelect = document.getElementById('camera-select');

    // --- Setup Flow ---
    btnNextStep.addEventListener('click', async () => {
        const code = loginCode.value.trim().toUpperCase();
        let pId = profIdInput.value.trim().toUpperCase(); // Ensure uppercase for matching

        if (!code || !pId) {
            step1Error.textContent = TRANSLATIONS[currentLang]['enter-both-ids'];
            step1Error.classList.remove('hidden');
            return;
        }

        step1Error.classList.add('hidden');
        btnNextStep.disabled = true;
        btnNextStep.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">sync</span> ${TRANSLATIONS[currentLang]['verifying']}`;

        try {
            // 1. Verify Professor using RPC (handles college code, trimming, and case-insensitivity)
            const { data: profRes, error: profErr } = await supabase.rpc('get_scanner_prof_info', {
                p_college_code: code,
                p_prof_id: pId
            });

            if (profErr || !profRes || !profRes.valid) {
                 const errMsg = profRes?.error || (profErr?.message) || TRANSLATIONS[currentLang]['invalid-prof'];
                 throw new Error(errMsg);
            }

            currentProfName = profRes.prof_name;
            currentProfId = pId;
            currentCompanyCode = code;

            // 2. Load Assignments (using ilike for case-insensitivity)
            const { data: assignments, error: assErr } = await supabase.from('subject_assignments').select('*').ilike('prof_id', pId);
            if (assErr) throw assErr;

            profAssignments = assignments || [];

            if (profAssignments.length === 0) {
                step1Error.textContent = currentLang === 'ar' ? "لم يتم العثور على مواد مسندة لهذا الأستاذ" : "No subjects assigned to this professor.";
                step1Error.classList.remove('hidden');
                return;
            }

            // Persistence
            localStorage.setItem('scanner_college_code', code);
            localStorage.setItem('scanner_prof_id', pId);

            displayProfName.textContent = currentProfName;

            // Auto-select first available stage that has assignments
            const firstAvailable = profAssignments[0]?.stage_name;
            if (firstAvailable) scanGradeSetup.value = firstAvailable;

            updateSubjectDropdown();
            loadCameras();

            setupStep1.classList.add('hidden');
            setupStep2.classList.remove('hidden');
        } catch (err) {
            step1Error.textContent = translateError(err.message);
            step1Error.classList.remove('hidden');
        } finally {
            btnNextStep.disabled = false;
            btnNextStep.innerHTML = `${TRANSLATIONS[currentLang]['next-step']} <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
        }
    });

    // --- Persistent Login Initialization ---
    const savedCode = localStorage.getItem('scanner_college_code');
    const savedProf = localStorage.getItem('scanner_prof_id');
    if (savedCode && savedProf) {
        loginCode.value = savedCode;
        profIdInput.value = savedProf;
        setTimeout(() => btnNextStep.click(), 500);
    }

    scanGradeSetup.addEventListener('change', updateSubjectDropdown);

    function updateSubjectDropdown() {
        const grade = scanGradeSetup.value;
        const filtered = profAssignments.filter(a => a.stage_name === grade);

        scanSubjectSetup.innerHTML = filtered.length ? '' : `<option value="">-- No Subjects --</option>`;
        filtered.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.subject_name;
            opt.textContent = a.subject_name;
            scanSubjectSetup.appendChild(opt);
        });
    }

    async function loadCameras() {
        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                cameraSelect.innerHTML = '';
                const savedCameraId = localStorage.getItem('scanner_preferred_camera_id');
                
                devices.forEach(device => {
                    const opt = document.createElement('option');
                    opt.value = device.id;
                    opt.textContent = device.label || `Camera ${cameraSelect.length + 1}`;
                    if (device.id === savedCameraId) opt.selected = true;
                    cameraSelect.appendChild(opt);
                });

                // Save transition
                cameraSelect.addEventListener('change', () => {
                    localStorage.setItem('scanner_preferred_camera_id', cameraSelect.value);
                });
            } else {
                cameraSelect.innerHTML = `<option value="">${TRANSLATIONS[currentLang]['no-cameras']}</option>`;
            }
        } catch (err) {
            console.error("Camera list fail", err);
            cameraSelect.innerHTML = `<option value="">${TRANSLATIONS[currentLang]['no-cameras']}</option>`;
        }
    }

    btnBackStep.addEventListener('click', () => { setupStep2.classList.add('hidden'); setupStep1.classList.remove('hidden'); });
    btnBackStepMobile.addEventListener('click', () => { setupStep2.classList.add('hidden'); setupStep1.classList.remove('hidden'); });

    loginSubmit.addEventListener('click', () => {
        currentSubject = scanSubjectSetup.value;
        currentGrade = scanGradeSetup.value;

        if (!currentSubject) {
            alert(currentLang === 'ar' ? "يرجى اختيار المادة أولاً" : "Please select a subject first.");
            return;
        }

        displaySubject.textContent = currentSubject;
        displayGrade.textContent = currentGrade;
        activateScannerMode();
    });




    function setModeUI() {
        // Simple UI setup for the confirm button
        btnConfirm.className = 'flex-[2] py-4 bg-slate-200 text-slate-400 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none';
        btnConfirmText.textContent = TRANSLATIONS[currentLang]['authenticate'] || 'Wait...';
    }

    logoutBtn?.addEventListener('click', () => {
        if (confirm(TRANSLATIONS[currentLang]['alert-logout'])) {
            localStorage.removeItem('scanner_college_code');
            localStorage.removeItem('scanner_prof_id');
            stopCamera();
            location.reload();
        }
    });

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
        const preferredId = localStorage.getItem('scanner_preferred_camera_id');
        
        try {
            if (preferredId) {
                await html5QrCode.start(
                    preferredId,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    () => { }
                );
            } else {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    () => { }
                );
            }
        } catch (err) {
            console.error("Camera fail", err);
        }
    }

    function stopCamera() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => { html5QrCode.clear(); html5QrCode = null; }).catch(e => console.error(e));
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
        resStudentId.textContent = barcode;
        resStudentName.textContent = TRANSLATIONS[currentLang]['msg-locating'];
        resMessage.classList.add('hidden');

        btnConfirm.className = 'flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto';
        btnConfirmText.textContent = TRANSLATIONS[currentLang]['btn-confirm-in'] || 'Confirm Logic';

        btnConfirm.disabled = true;
        showResult();
        verifyStudent(barcode);
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
        } catch (err) {
            // Ignore resume errors if already running
        }
    }

    async function verifyStudent(barcode) {
        try {
            const { data, error } = await supabase.rpc('get_scanner_student_info', {
                p_college_code: currentCompanyCode,
                p_student_id: barcode
            });
            if (error) throw error;

            resStudentName.textContent = data;
            btnConfirm.disabled = false;
        } catch (err) {
            console.error(err);
            resStudentName.textContent = TRANSLATIONS[currentLang]['msg-unknown'];
            resMessage.textContent = translateError(err.message) + ` (C: [${currentCompanyCode}] B: [${barcode}])`;
            resMessage.classList.remove('hidden');
        }
    }

    btnCancel.addEventListener('click', hideResult);

    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirmText.textContent = TRANSLATIONS[currentLang]['msg-saving'];

        try {
            const { data, error } = await supabase.rpc('log_scanner_attendance', {
                p_college_code: currentCompanyCode,
                p_action_mode: 'none', // Dummy arg
                p_student_id: currentScanId,
                p_prof_id: currentProfId || null,
                p_subject: currentSubject
            });

            if (error) throw error;

            hideResult();

            successFlashTitle.textContent = TRANSLATIONS[currentLang]['attendance-logged'] || "Attendance Logged!";
            successFlashName.textContent = resStudentName.textContent;
            successFlash.classList.remove('opacity-0', 'pointer-events-none', 'scale-110');
            successFlash.classList.add('opacity-100', 'scale-100');
            successFlash.classList.replace('bg-rose-500', 'bg-emerald-500');

            setTimeout(() => {
                successFlash.classList.remove('opacity-100', 'scale-100');
                successFlash.classList.add('opacity-0', 'pointer-events-none', 'scale-110');
            }, 1500);

        } catch (err) {
            console.error(err);
            resMessage.textContent = translateError(err.message) || TRANSLATIONS[currentLang]['err-failed'];
            resMessage.classList.remove('hidden');
            btnConfirmText.textContent = TRANSLATIONS[currentLang]['msg-retry'];
            btnConfirm.disabled = false;
        }
    });

    // Add translation hook for the dynamically set "Attendance Logged!" text
    // The text on successFlashTitle was replaced by translation

});
