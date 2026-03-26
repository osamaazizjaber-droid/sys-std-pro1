// sys-std-web/js/reports.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if (!supabase) return;

    if (window.WMSSettings) {
        window.WMSSettings.rebuild();
    }

    // ── DOM ELEMENTS ──
    const btnRunReport = document.getElementById('btnRunReport');
    const btnPrintReport = document.getElementById('btnPrintReport');
    const repStartDate = document.getElementById('report-start-date');
    const repEndDate = document.getElementById('report-end-date');
    const filterGrade = document.getElementById('report-filter-grade');
    const searchInput = document.getElementById('report-search-input');
    const badgeTabName = document.getElementById('badge-tab-name');
    const rptTitle = document.getElementById('rpt-title');
    const rptDateVal = document.getElementById('rpt-date-val');
    const rptStage = document.getElementById('rpt-stage');
    const matrixHead = document.getElementById('matrix-head');
    const matrixTbody = document.getElementById('matrix-tbody');
    const toast = document.getElementById('pdf-toast');

    let currentMode = 'daily'; // daily, weekly, monthly
    let studentsList = [];
    let assignmentsList = [];
    let attendanceData = [];

    // ── AUTH HANDLING ──
    let collegeId = window.WMS_COLLEGE_ID;
    
    async function start() {
        collegeId = window.WMS_COLLEGE_ID;
        if (!collegeId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) collegeId = user.id;
        }
        if (!collegeId) return;

        // ── INITIALIZATION ──
        const today = new Date().toISOString().split('T')[0];
        if (repStartDate) repStartDate.value = today;

        // Load initial data
        await refreshData();
        await populateCollegeHeader();
        switchTab('daily');
    }

    if (window.WMS_COLLEGE_ID) {
        start();
    } else {
        document.addEventListener('wms-auth-ready', start);
        // Fallback for direct loads
        setTimeout(start, 2000);
    }

    // ── DATA FETCHING ──
    async function populateCollegeHeader() {
        const { data: college } = await supabase.from('colleges').select('*').eq('id', collegeId).single();
        if (college) {
            // Update English Headers
            const uEn = document.getElementById('hdr-univ-en');
            const cEn = document.getElementById('hdr-coll-en');
            const dEn = document.getElementById('hdr-dept-en');
            if (uEn) uEn.textContent = college.university_name || 'University Name';
            if (cEn) cEn.textContent = college.college_name || 'College Name';
            if (dEn) dEn.textContent = college.department_name || 'Department Name';

            // Update Arabic Headers
            const uAr = document.getElementById('hdr-univ-ar');
            const cAr = document.getElementById('hdr-coll-ar');
            const dAr = document.getElementById('hdr-dept-ar');
            if (uAr) uAr.textContent = college.university_name_ar || college.university_name || 'اسم الجامعة';
            if (cAr) cAr.textContent = college.college_name_ar || college.college_name || 'اسم الكلية';
            if (dAr) dAr.textContent = college.department_name_ar || college.department_name || 'اسم القسم';

            const lSub = document.getElementById('hdr-logo-sub');
            if (lSub) lSub.textContent = college.college_code || 'SYS STD PRO';
        }

        // 2. Logo Logic (Sync with ID Cards / localStorage)
        const savedLogo = localStorage.getItem('wms_secondary_logo');
        const secondaryLogoCont = document.getElementById('hdr-secondary-logo-container');
        if (savedLogo && secondaryLogoCont) {
            secondaryLogoCont.innerHTML = `<img src="${savedLogo}" class="w-full h-full object-contain p-1" />`;
        }
    }

    async function refreshData() {
        // 1. Fetch Students (Filtered by Global Academic Year)
        const currentAY = window.WMSSettings?.get('academic_year');
        let query = supabase.from('students').select('*').eq('college_id', collegeId);
        
        if (currentAY) {
            // Robust check: try both slash (2024/2025) and dash (2024-2025)
            const dashYear = currentAY.replace('/', '-');
            query = query.or(`academic_year.eq."${currentAY}",academic_year.eq."${dashYear}"`);
        }
        
        const { data: sData } = await query.order('student_name');
        studentsList = sData || [];

        // 2. Fetch Assignments with a robust fallback
        let { data: aData } = await supabase.from('subject_assignments').select('*').eq('college_id', collegeId);
        if (!aData || aData.length === 0) {
            const { data: aDataAll } = await supabase.from('subject_assignments').select('*');
            aData = aDataAll;
        }
        assignmentsList = aData || [];

        // Dynamic Grade Population
        if (filterGrade) {
            const studentGrades = [...new Set(studentsList.map(s => s.grade).filter(Boolean))];
            const assignmentGrades = [...new Set(assignmentsList.map(a => a.stage_name).filter(Boolean))];
            const allGrades = assignmentGrades.sort();

            console.log("Reports Metadata Audit:", { students: studentsList.length, assignments: assignmentsList.length, allGrades });

            if (allGrades.length > 0) {
                const currentVal = filterGrade.value;
                filterGrade.innerHTML = '';
                allGrades.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g;
                    opt.textContent = g;
                    filterGrade.appendChild(opt);
                });
                if (currentVal && allGrades.includes(currentVal)) {
                    filterGrade.value = currentVal;
                } else {
                    filterGrade.selectedIndex = 0;
                }
            }
        }
    }

    async function loadAttendance(start, end) {
        let query = supabase.from('attendance')
            .select('*')
            .eq('college_id', collegeId)
            .gte('date', start)
            .lte('date', end);
        
        const { data, error } = await query;
        if (error) console.error("Reports: Attendance fetch error:", error);
        attendanceData = data || [];
    }

    // ── TAB SWITCHING ──
    window.switchTab = async (mode) => {
        currentMode = mode;
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-white', 'text-slate-900', 'shadow-sm', 'border-slate-200', 'active');
            btn.classList.add('text-slate-500', 'border-transparent');
            const iconBox = btn.querySelector('div');
            iconBox.classList.remove('bg-primary/10', 'text-primary');
            iconBox.classList.add('bg-slate-100', 'text-slate-500');
        });

        const activeBtn = document.getElementById(`tab-${mode}`);
        if (activeBtn) {
            activeBtn.classList.add('bg-white', 'text-slate-900', 'shadow-sm', 'border-slate-200', 'active');
            activeBtn.classList.remove('text-slate-500', 'border-transparent');
            const activeIconBox = activeBtn.querySelector('div');
            activeIconBox.classList.remove('bg-slate-100', 'text-slate-500');
            activeIconBox.classList.add('bg-primary/10', 'text-primary');
        }

        badgeTabName.textContent = dict[mode + '-matrix'] || mode;

        const endDateWrapper = document.getElementById('report-end-date-wrapper');
        const endDateInput = document.getElementById('report-end-date');
        let sd = new Date(repStartDate.value);

        if (mode === 'daily') {
            endDateWrapper.style.display = 'none';
            rptTitle.textContent = dict['daily-attendance-report'] || 'Daily Attendance Report';
            generateReport();
        } else if (mode === 'weekly') {
            endDateWrapper.style.display = 'block';
            rptTitle.textContent = dict['weekly-attendance-audit'] || 'Weekly Attendance Audit';
            let ed = new Date(sd);
            ed.setDate(sd.getDate() + 4);
            endDateInput.value = ed.toISOString().split('T')[0];
            generateReport();
        } else if (mode === 'monthly') {
            endDateWrapper.style.display = 'block';
            rptTitle.textContent = dict['monthly-attendance-summary'] || 'Monthly Attendance Summary';
            let ed = new Date(sd.getFullYear(), sd.getMonth() + 1, 0);
            endDateInput.value = ed.toISOString().split('T')[0];
            generateReport();
        }
    };

    // ── REPORT GENERATION ──
    async function generateReport() {
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];
        const selectedGrade = filterGrade.value;
        const startDate = repStartDate.value;
        const endDate = currentMode === 'daily' ? startDate : document.getElementById('report-end-date').value;

        matrixTbody.innerHTML = `<tr><td colspan="20" class="p-20 text-center"><div class="flex flex-col items-center gap-4"><div class="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div><span class="text-slate-400 font-bold tracking-widest text-[10px] uppercase">Retrieving Academic Records...</span></div></td></tr>`;

        await loadAttendance(startDate, endDate);

        const searchQuery = searchInput?.value?.trim().toLowerCase() || '';
        let filteredStudents = studentsList.filter(s => {
            const sg = (selectedGrade || '').toLowerCase().trim();
            const gr = (s.grade || '').toLowerCase().trim();
            if (gr === sg) return true;

            const sgParts = sg.split(' - ').map(p => p.trim()).filter(Boolean);
            const grParts = gr.split(' - ').map(p => p.trim()).filter(Boolean);
            const sgBase = sgParts[0] || '';
            const grBase = grParts[0] || '';
            const sgTime = sgParts[1] || '';
            const grTime = grParts[1] || '';

            // Base must match (exact or fuzzy)
            const baseMatch = sgBase === grBase || sgBase.includes(grBase) || grBase.includes(sgBase);
            if (!baseMatch) return false;

            // If BOTH have timing, they MUST match
            if (sgTime && grTime) {
                return sgTime === grTime || sgTime.includes(grTime) || grTime.includes(sgTime);
            }

            // Otherwise, base match is enough (defensive fallback)
            return true;
        });
        
        if (searchQuery) {
            filteredStudents = filteredStudents.filter(s => 
                s.student_name?.toLowerCase().includes(searchQuery) || 
                s.student_id?.toLowerCase().includes(searchQuery)
            );
        }

        let subjectsForGrade = [...new Set(
            assignmentsList
                .filter(a => {
                    const sn = (a.stage_name || '').toLowerCase().trim();
                    const sg = (selectedGrade || '').toLowerCase().trim();
                    if (sn === sg) return true;

                    const sgParts = sg.split(' - ').map(p => p.trim()).filter(Boolean);
                    const snParts = sn.split(' - ').map(p => p.trim()).filter(Boolean);
                    const sgBase = sgParts[0] || '';
                    const snBase = snParts[0] || '';
                    const sgTime = sgParts[1] || '';
                    const snTime = snParts[1] || '';

                    const baseMatch = sgBase === snBase || sgBase.includes(snBase) || snBase.includes(sgBase);
                    if (!baseMatch) return false;

                    if (sgTime && snTime) {
                        return sgTime === snTime || sgTime.includes(snTime) || snTime.includes(sgTime);
                    }
                    return true;
                })
                .map(a => a.subject_name)
        )];

        // FAILSAFE: If no subjects found via assignments, bridge from existing attendance logs 
        if (subjectsForGrade.length === 0 && attendanceData.length > 0) {
            subjectsForGrade = [...new Set(attendanceData.map(d => d.subject_name).filter(Boolean))];
        }

        rptDateVal.textContent = currentMode === 'daily' 
            ? new Date(startDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : `${startDate} ➔ ${endDate}`;
        rptStage.textContent = selectedGrade;

        // Dynamic Subject Count Badge
        const rptCount = document.getElementById('rpt-subject-count');
        if (rptCount) {
            rptCount.classList.toggle('hidden', subjectsForGrade.length === 0);
            rptCount.innerHTML = subjectsForGrade.length
                ? `<span class="material-symbols-outlined text-primary" style="font-size:14px;">menu_book</span>
                   <span class="text-primary font-black">${subjectsForGrade.length}</span>
                   <span class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">${dict['subjects'] || 'Subjects'}</span>`
                : '';
        }

        if (currentMode === 'daily') {
            renderDaily(filteredStudents, subjectsForGrade, lang, dict);
        } else if (currentMode === 'weekly') {
            renderWeekly(filteredStudents, startDate, endDate, lang, dict);
        } else if (currentMode === 'monthly') {
            renderMonthly(filteredStudents, startDate, endDate, lang, dict);
        }
    }

    function getBadgeHTML(status, lang, dict) {
        if (!status) return `<span class="text-slate-200">—</span>`;
        
        const config = {
            'Present': { class: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500', key: 'present-short' },
            'Absent':  { class: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-rose-500', key: 'absent-short' },
            'Leave':   { class: 'bg-amber-50 text-amber-500 border-amber-100', dot: 'bg-amber-400', key: 'leave-short' }
        };

        const c = config[status] || config['Present'];
        const label = dict[c.key] || status;
        
        return `<span class="inline-flex items-center gap-1 px-1.5 py-1 rounded border ${c.class} font-bold text-[8px] uppercase tracking-wider whitespace-nowrap" style="min-width: 65px; justify-content: center;">
                    <span class="w-1 h-1 rounded-full ${c.dot}"></span>${label}
                </span>`;
    }

    function renderDaily(students, subjects, lang, dict) {
        let headHTML = `<th class="px-2 py-3 font-bold text-slate-700 uppercase tracking-wider text-[8px] w-12 border-r border-slate-200 text-center">${dict['serial-short'] || '#'}</th>`;
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] w-56 border-r border-slate-200 text-start">${dict['student-name'] || 'Student Name'}</th>`;
        
        subjects.forEach(sub => {
            const cleanSub = sub.split('|')[0]; 
            headHTML += `<th class="col-subject px-2 py-3 font-bold text-slate-700 uppercase tracking-wider text-[8px] text-center border-r border-slate-200 whitespace-nowrap">${cleanSub}</th>`;
        });
        matrixHead.innerHTML = headHTML;

        let bodyHTML = '';
        if (students.length === 0) {
            bodyHTML = `<tr><td colspan="${subjects.length + 1}" class="p-16 text-center text-slate-300">No students found in this stage.</td></tr>`;
        } else {
            students.forEach((s, idx) => {
                bodyHTML += `<tr>
                    <td class="px-2 py-2 border-r border-slate-200 text-center text-slate-400 font-mono text-[9px]">${idx + 1}</td>
                    <td class="px-4 py-2 border-r border-slate-200"><div class="font-bold text-slate-800 text-[10px] whitespace-nowrap truncate w-52">${s.student_name}</div></td>`;
                
                subjects.forEach(sub => {
                    const record = attendanceData.find(a => a.student_id === s.student_id && a.subject === sub);
                    bodyHTML += `<td class="col-subject px-1 py-2 border-r border-slate-200 last:border-0 text-center">${getBadgeHTML(record?.status, lang, dict)}</td>`;
                });
                bodyHTML += `</tr>`;
            });
        }
        matrixTbody.innerHTML = bodyHTML;
    }

    function renderWeekly(students, start, end, lang, dict) {
        const days = [];
        let curr = new Date(start);
        const stop = new Date(end);
        while (curr <= stop) {
            const dStr = curr.toISOString().split('T')[0];
            const dayIdx = curr.getDay();
            if (dayIdx !== 5 && dayIdx !== 6) { // Skip Fri/Sat
                days.push({
                    date: dStr,
                    label: dict[['sun','mon','tue','wed','thu','fri','sat'][dayIdx]] || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIdx],
                    short: dStr.split('-').slice(1).reverse().join('/')
                });
            }
            curr.setDate(curr.getDate() + 1);
        }

        let headHTML = `<th class="px-2 py-3 font-bold text-slate-700 uppercase tracking-wider text-[8px] w-12 border-r border-slate-200 text-center">${dict['serial-short'] || 'Ser.'}</th>`;
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] w-56 border-r border-slate-200">${dict['student-name'] || 'Student Name'}</th>`;
        
        days.forEach(d => {
            headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] text-center border-r border-slate-200">${d.label}<br><span class="text-[8px] font-normal opacity-50 font-mono">${d.short}</span></th>`;
        });
        matrixHead.innerHTML = headHTML;

        let bodyHTML = '';
        students.forEach((s, idx) => {
            bodyHTML += `<tr>
                <td class="px-2 py-3 border-r border-slate-200 text-center text-slate-400 font-mono text-[9px]">${idx + 1}</td>
                <td class="px-4 py-3 border-r border-slate-200"><div class="font-bold text-slate-800 text-[11px] whitespace-nowrap">${s.student_name}</div></td>`;
            
            days.forEach(d => {
                const records = attendanceData.filter(a => a.student_id === s.student_id && a.date === d.date);
                // In weekly mode, if ANY record is present, we show present? Or show status aggregate?
                // Logic: prioritize 'Absent' if any session was missed, then 'Leave', else 'Present'
                let status = null;
                if (records.length > 0) {
                    if (records.find(r => r.status === 'Absent')) status = 'Absent';
                    else if (records.find(r => r.status === 'Leave')) status = 'Leave';
                    else status = 'Present';
                }
                bodyHTML += `<td class="px-3 py-3 border-r border-slate-200 text-center">${getBadgeHTML(status, lang, dict)}</td>`;
            });
            bodyHTML += `</tr>`;
        });
        matrixTbody.innerHTML = bodyHTML;
    }

    function renderMonthly(students, start, end, lang, dict) {
        let headHTML = `<th class="px-2 py-3 font-bold text-slate-700 uppercase tracking-wider text-[8px] w-12 border-r border-slate-200 text-center">${dict['serial-short'] || 'Ser.'}</th>`;
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] w-56 border-r border-slate-200">${dict['student-name'] || 'Student Name'}</th>`;
        
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] text-center border-r border-slate-200">${dict['total-present']}</th>`;
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] text-center border-r border-slate-200">${dict['total-absent']}</th>`;
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] text-center border-r border-slate-200">${dict['total-leave']}</th>`;
        headHTML += `<th class="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[9px] text-center">${dict['compliance']}</th>`;
        matrixHead.innerHTML = headHTML;

        let bodyHTML = '';
        students.forEach((s, idx) => {
            const records = attendanceData.filter(a => a.student_id === s.student_id);
            const p = records.filter(r => r.status === 'Present').length;
            const a = records.filter(r => r.status === 'Absent').length;
            const l = records.filter(r => r.status === 'Leave').length;
            const total = records.length;
            const rate = total > 0 ? Math.round(((p + l) / total) * 100) : 0;
            const rateColor = rate > 85 ? 'text-emerald-600' : (rate > 70 ? 'text-amber-600' : 'text-rose-600');

            bodyHTML += `<tr>
                <td class="px-2 py-3 border-r border-slate-200 text-center text-slate-400 font-mono text-[9px]">${idx + 1}</td>
                <td class="px-4 py-3 border-r border-slate-200"><div class="font-bold text-slate-800 text-[11px] whitespace-nowrap">${s.student_name}</div></td>
                <td class="px-4 py-3 border-r border-slate-200 text-center font-bold text-slate-600">${p}</td>
                <td class="px-4 py-3 border-r border-slate-200 text-center font-bold text-rose-500">${a}</td>
                <td class="px-4 py-3 border-r border-slate-200 text-center font-bold text-amber-500">${l}</td>
                <td class="px-4 py-3 text-center font-black ${rateColor}">${rate}%</td>
            </tr>`;
        });
        matrixTbody.innerHTML = bodyHTML;
    }

    // ── PDF EXPORT ──
    // --- High-Fidelity PDF Export (Native Print Engine) ---
    async function exportReportPDF() {
        if (!attendanceData || attendanceData.length === 0) {
            alert('Please generate a report first before exporting PDF.');
            return;
        }

        const spinner = document.getElementById('toast-spinner');
        const check = document.getElementById('toast-check');
        const msg = document.getElementById('toast-msg');
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';

        // 1. Show "Preparing" Toast
        if (spinner) spinner.style.display = 'block';
        if (check) check.style.display = 'none';
        if (msg) msg.textContent = lang === 'ar' ? 'جاري تحضير ملف PDF...' : 'Preparing PDF...';
        toast.classList.add('show');

        // Allow toast to paint before print freezes the thread
        requestAnimationFrame(() => {
            setTimeout(() => {
                // 2. Trigger Native Print
                window.print();

                // 3. Show Success State
                if (msg) msg.textContent = lang === 'ar' ? 'تم تصدير ملف PDF بنجاح ✓' : 'PDF exported successfully ✓';
                if (spinner) spinner.style.display = 'none';
                if (check) check.style.display = 'flex';

                // 4. Cleanup
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (spinner) spinner.style.display = 'block';
                        if (check) check.style.display = 'none';
                    }, 400);
                }, 2800);
            }, 100);
        });
    }

    // ── EVENT LISTENERS ──
    btnRunReport.addEventListener('click', generateReport);
    btnPrintReport.addEventListener('click', exportReportPDF);
    
    // Explicitly call generateReport on date change to ensure it's not "sticked"
    repStartDate.addEventListener('change', async () => {
        await switchTab(currentMode);
        await generateReport();
    });

    filterGrade.addEventListener('change', generateReport);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' || searchInput.value.length >= 2 || searchInput.value.length === 0) {
                generateReport();
            }
        });
    }

    // --- Priority 5: Back to Top Logic ---
    const b2t = document.getElementById('backToTop');
    if (b2t) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                b2t.classList.remove('opacity-0', 'translate-y-20', 'pointer-events-none');
                b2t.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
            } else {
                b2t.classList.add('opacity-0', 'translate-y-20', 'pointer-events-none');
                b2t.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
            }
        });
        b2t.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- REAL-TIME SETTINGS SYNC ---
    window.addEventListener('wms-settings-update', async (e) => {
        if (e.detail.k === 'academic_year') {
            await refreshData();
            generateReport();
        }
    });
});
