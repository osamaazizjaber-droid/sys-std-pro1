// sys-wms-web/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.sbClient;
    
    // --- State & DOM Elements ---
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const langToggleBtn = document.getElementById('langToggle');
    const themeToggleBtn = document.getElementById('themeToggle');
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const pageTitleEl = document.getElementById('page-title');

    // Modals
    const workerModal = document.getElementById('worker-modal');
    const workerForm = document.getElementById('worker-form');
    const btnNewWorker = document.getElementById('btnNewWorker');
    const btnCancelWorker = document.getElementById('btn-cancel-worker');

    let currentLang = 'ar';
    let currentTabId = 'workers';
    let workersList = [];

    const texts = {
        ar: {
            workers: "إدارة العمال",
            idcards: "إصدار الهويات",
            attendance: "سجل الحضور",
            advances: "السلف النقدية",
            reports: "تقرير الرواتب",
            settings: "الإعدادات",
            loading: "جاري التحميل...",
            empty: "لا يوجد عمال. اضف عاملا جديدا.",
            error: "فشل تحميل البيانات.",
            save: "حفظ",
            delete: "حذف",
            edit: "تعديل",
            newWorker: "عامل جديد",
            editWorker: "تعديل عامل",
            confirmDelete: "هل أنت متأكد من حذف هذا السجل؟"
        },
        en: {
            workers: "Manage Workers",
            idcards: "ID Cards",
            attendance: "Attendance",
            advances: "Advances",
            reports: "Reports",
            settings: "Settings",
            loading: "Loading...",
            empty: "No workers found. Add one.",
            error: "Failed to load data.",
            save: "Save",
            delete: "Delete",
            edit: "Edit",
            newWorker: "New Worker",
            editWorker: "Edit Worker",
            confirmDelete: "Are you sure you want to delete this record?"
        }
    };

    // --- Init ---
    initNavigation();
    initTheme();
    loadWorkersData();

    // --- Event Listeners ---
    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        htmlEl.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
        htmlEl.setAttribute('lang', currentLang);
        updatePageTitle();
        if (currentTabId === 'workers') renderWorkersTable();
    });

    themeToggleBtn.addEventListener('click', () => {
        const isDark = bodyEl.classList.contains('theme-dark');
        if (isDark) {
            bodyEl.classList.remove('theme-dark');
            bodyEl.classList.add('theme-light');
            localStorage.setItem('theme', 'theme-light');
        } else {
            bodyEl.classList.remove('theme-light');
            bodyEl.classList.add('theme-dark');
            localStorage.setItem('theme', 'theme-dark');
        }
    });

    function initNavigation() {
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                currentTabId = btn.dataset.tab;
                views.forEach(v => v.classList.remove('active'));
                const targetView = document.getElementById('view-' + currentTabId);
                if (targetView) targetView.classList.add('active');

                updatePageTitle();
                if(currentTabId === 'workers') loadWorkersData();
                if(currentTabId === 'attendance') loadAttendanceData();
                if(currentTabId === 'advances') loadAdvancesData();
                if(currentTabId === 'idcards') renderIDCardsTable();
            });
        });
    }

    function updatePageTitle() {
        pageTitleEl.textContent = texts[currentLang][currentTabId];
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'theme-light';
        bodyEl.classList.add(savedTheme);
    }

    // --- Worker Modals ---
    btnNewWorker.addEventListener('click', () => {
        document.getElementById('worker-id').value = '';
        workerForm.reset();
        document.getElementById('modal-title').textContent = texts[currentLang].newWorker;
        workerModal.classList.remove('hidden');
    });

    btnCancelWorker.addEventListener('click', () => {
        workerModal.classList.add('hidden');
    });

    workerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('worker-id').value;
        const name = document.getElementById('worker-name').value;
        const position = document.getElementById('worker-position').value;
        const salary = document.getElementById('worker-salary').value;

        const payload = { name, position, salary: parseFloat(salary) };
        const btnSave = document.getElementById('btn-save-worker');
        btnSave.disabled = true;

        try {
            if (id) {
                // Update
                const { error } = await supabase.from('workers').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase.from('workers').insert([payload]);
                if (error) throw error;
            }
            workerModal.classList.add('hidden');
            loadWorkersData(); // reload
        } catch (error) {
            console.error(error);
            alert("Error saving worker: " + error.message);
        } finally {
            btnSave.disabled = false;
        }
    });

    // --- Workers Data ---
    window.editWorker = function(id) {
        const worker = workersList.find(w => w.id == id);
        if (worker) {
            document.getElementById('worker-id').value = worker.id;
            document.getElementById('worker-name').value = worker.name;
            document.getElementById('worker-position').value = worker.position;
            document.getElementById('worker-salary').value = worker.salary;
            document.getElementById('modal-title').textContent = texts[currentLang].editWorker;
            workerModal.classList.remove('hidden');
        }
    };

    window.deleteWorker = async function(id) {
        if (confirm(texts[currentLang].confirmDelete)) {
            try {
                const { error } = await supabase.from('workers').delete().eq('id', id);
                if (error) throw error;
                loadWorkersData();
            } catch (err) {
                alert("Error deleting: " + err.message);
            }
        }
    };

    async function loadWorkersData() {
        if (!window.supabase) return;
        const tbody = document.querySelector('#workersTable tbody');
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${texts[currentLang].loading}</td></tr>`;
        
        try {
            const { data, error } = await supabase.from('workers').select('*').order('id', { ascending: false });
            if (error) throw error;

            workersList = data || [];
            renderWorkersTable();
        } catch (err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">${texts[currentLang].error}</td></tr>`;
        }
    }

    function renderWorkersTable() {
        const tbody = document.querySelector('#workersTable tbody');
        if (workersList.length > 0) {
            tbody.innerHTML = '';
            workersList.forEach(worker => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${worker.id}</td>
                    <td style="font-weight:700;">${worker.name}</td>
                    <td>${worker.position}</td>
                    <td>${worker.salary.toLocaleString()}</td>
                    <td>${new Date(worker.reg_date).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editWorker(${worker.id})" class="btn-secondary" style="padding: 4px 8px; font-size:12px; margin-right:4px;">${texts[currentLang].edit}</button>
                        <button onclick="deleteWorker(${worker.id})" class="btn-secondary" style="padding: 4px 8px; font-size:12px; border-color:#e74c3c; color:#e74c3c;">${texts[currentLang].delete}</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${texts[currentLang].empty}</td></tr>`;
        }
    }

    // --- Attendance Data & Logic ---
    const attDateInput = document.getElementById('attendance-date');
    const attBarcodeInput = document.getElementById('attendance-barcode');
    let attendanceList = [];

    // Init Date to today
    const today = new Date().toISOString().split('T')[0];
    if (attDateInput) attDateInput.value = today;

    if (attDateInput) {
        attDateInput.addEventListener('change', () => {
            if(currentTabId === 'attendance') loadAttendanceData();
        });
    }

    // Barcode scanner (listen for Enter key)
    if (attBarcodeInput) {
        attBarcodeInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const code = attBarcodeInput.value.trim();
                if(!code) return;
                
                await processAttendanceScan(code);
                attBarcodeInput.value = ''; // clear for next scan
            }
        });
    }

    async function processAttendanceScan(code) {
        if(!window.supabase) return;
        
        let workerId = parseInt(code.replace(/\D/g, ''));
        let workerSearch = code;
        
        let worker = workersList.find(w => w.id === workerId || w.name.toLowerCase().includes(workerSearch.toLowerCase()));
        
        if (!worker) {
            const { data, error } = await supabase.from('workers').select('*').or(`id.eq.${workerId},name.ilike.%${workerSearch}%`).limit(1);
            if (data && data.length > 0) worker = data[0];
        }

        if(!worker) {
            alert(`Worker not found: ${code}`);
            return;
        }

        const scanDate = attDateInput.value;
        try {
            const { data: existing } = await supabase.from('attendance')
                .select('*')
                .eq('worker_id', worker.id)
                .eq('date', scanDate);
                
            if (existing && existing.length > 0) {
                await supabase.from('attendance').update({ status: 'Present' }).eq('id', existing[0].id);
            } else {
                await supabase.from('attendance').insert([{
                    worker_id: worker.id,
                    worker_name: worker.name,
                    date: scanDate,
                    status: 'Present',
                    overtime: 0,
                    notes: 'Auto-Log'
                }]);
            }
            loadAttendanceData();
        } catch(err) {
            console.error(err);
            alert("Error logging attendance: " + err.message);
        }
    }

    async function loadAttendanceData() {
        if(!window.supabase) return;
        const scanDate = attDateInput.value;
        const tbody = document.querySelector('#attendanceTable tbody');
        if(!tbody) return;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${texts[currentLang].loading}</td></tr>`;
        
        try {
            const { data, error } = await supabase.from('attendance').select('*').eq('date', scanDate).order('id', {ascending: false});
            if(error) throw error;
            attendanceList = data || [];
            renderAttendanceTable();
        } catch(err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error loading attendance.</td></tr>`;
        }
    }

    function renderAttendanceTable() {
        const tbody = document.querySelector('#attendanceTable tbody');
        if(attendanceList.length > 0) {
            tbody.innerHTML = '';
            attendanceList.forEach(att => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${att.worker_id}</td>
                    <td style="font-weight:700;">${att.worker_name}</td>
                    <td><span style="color:#2ecc71; font-weight:bold;">${att.status}</span></td>
                    <td>${att.overtime}</td>
                    <td>${att.notes || ''}</td>
                    <td>
                        <button class="btn-secondary" style="padding: 4px 8px; font-size:12px; border-color:#e74c3c; color:#e74c3c;" onclick="deleteAttendance(${att.id})">${texts[currentLang].delete}</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No attendance records for this date.</td></tr>`;
        }
    }

    window.deleteAttendance = async function(id) {
        if (confirm(texts[currentLang].confirmDelete)) {
            try {
                const { error } = await supabase.from('attendance').delete().eq('id', id);
                if (error) throw error;
                loadAttendanceData();
            } catch (err) {
                alert("Error deleting: " + err.message);
            }
        }
    };

    // --- Advances Data & Logic ---
    const advanceModal = document.getElementById('advance-modal');
    const advanceForm = document.getElementById('advance-form');
    const btnNewAdvance = document.getElementById('btnNewAdvance');
    const btnCancelAdvance = document.getElementById('btn-cancel-advance');
    const advWorkerSelect = document.getElementById('advance-worker-id');
    let advancesList = [];

    if (btnNewAdvance) {
        btnNewAdvance.addEventListener('click', () => {
            document.getElementById('advance-id').value = '';
            advanceForm.reset();
            // populate select
            advWorkerSelect.innerHTML = '<option value="">-- اختر العامل / Select Worker --</option>';
            workersList.forEach(w => {
                advWorkerSelect.innerHTML += `<option value="${w.id}">${w.name}</option>`;
            });
            advanceModal.classList.remove('hidden');
        });
    }

    if (btnCancelAdvance) {
        btnCancelAdvance.addEventListener('click', () => {
            advanceModal.classList.add('hidden');
        });
    }

    if (advanceForm) {
        advanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('advance-id').value;
            const worker_id = document.getElementById('advance-worker-id').value;
            const amount = document.getElementById('advance-amount').value;
            const reason = document.getElementById('advance-reason').value;

            const worker = workersList.find(w => w.id == worker_id);
            if(!worker) return;

            const payload = {
                worker_id: worker.id,
                worker_name: worker.name,
                amount: parseFloat(amount),
                reason: reason
            };

            const btnSave = document.getElementById('btn-save-advance');
            btnSave.disabled = true;

            try {
                if (id) {
                    await supabase.from('cash_advance').update(payload).eq('id', id);
                } else {
                    payload.date = new Date().toISOString().split('T')[0];
                    await supabase.from('cash_advance').insert([payload]);
                }
                advanceModal.classList.add('hidden');
                loadAdvancesData();
            } catch (error) {
                console.error(error);
                alert("Error saving advance: " + error.message);
            } finally {
                btnSave.disabled = false;
            }
        });
    }

    async function loadAdvancesData() {
        if(!window.supabase) return;
        const tbody = document.querySelector('#advancesTable tbody');
        if(!tbody) return;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${texts[currentLang].loading}</td></tr>`;
        
        try {
            const { data, error } = await supabase.from('cash_advance').select('*').order('id', {ascending: false});
            if(error) throw error;
            advancesList = data || [];
            renderAdvancesTable();
        } catch(err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error loading advances.</td></tr>`;
        }
    }

    function renderAdvancesTable() {
        const tbody = document.querySelector('#advancesTable tbody');
        if(advancesList.length > 0) {
            tbody.innerHTML = '';
            advancesList.forEach(adv => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${adv.id}</td>
                    <td style="font-weight:700;">${adv.worker_name}</td>
                    <td>${new Date(adv.date).toLocaleDateString()}</td>
                    <td>${adv.amount.toLocaleString()} د.ع</td>
                    <td>${adv.reason || '-'}</td>
                    <td>
                        <button class="btn-secondary" style="padding: 4px 8px; font-size:12px; border-color:#e74c3c; color:#e74c3c;" onclick="deleteAdvance(${adv.id})">${texts[currentLang].delete}</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No advances recorded.</td></tr>`;
        }
    }

    window.deleteAdvance = async function(id) {
        if (confirm(texts[currentLang].confirmDelete)) {
            try {
                const { error } = await supabase.from('cash_advance').delete().eq('id', id);
                if (error) throw error;
                loadAdvancesData();
            } catch (err) {
                alert("Error deleting: " + err.message);
            }
        }
    };

    // --- ID Cards Logic ---
    const btnPrintIDCards = document.getElementById('btnPrintIDCards');
    const selectAllIDs = document.getElementById('selectAllIDs');

    function renderIDCardsTable() {
        const tbody = document.querySelector('#idcardsTable tbody');
        if(!tbody) return;
        if(workersList.length > 0) {
            tbody.innerHTML = '';
            workersList.forEach(w => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="id-checkbox" data-id="${w.id}"></td>
                    <td>#${w.id}</td>
                    <td style="font-weight:700;">${w.name}</td>
                    <td>${w.position}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No workers found.</td></tr>`;
        }
    }

    if(selectAllIDs) {
        selectAllIDs.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.id-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    if(btnPrintIDCards) {
        btnPrintIDCards.addEventListener('click', () => {
            const selected = [];
            document.querySelectorAll('.id-checkbox:checked').forEach(cb => {
                const id = cb.dataset.id;
                const worker = workersList.find(w => w.id == id);
                if(worker) selected.push(worker);
            });

            if(selected.length === 0) {
                alert("يرجى تحديد عامل واحد على الأقل / Please select at least one worker.");
                return;
            }

            const printArea = document.getElementById('print-area');
            printArea.innerHTML = '';
            
            selected.forEach(w => {
                const card = document.createElement('div');
                card.className = 'id-card-print';
                card.innerHTML = `
                    <div class="id-card-header">SYS STD PRO</div>
                    <div class="id-card-body">
                        <div class="id-card-name">${w.name}</div>
                        <div class="id-card-pos">${w.position}</div>
                        <div class="id-card-barcode">*WA${w.id}*</div>
                    </div>
                `;
                printArea.appendChild(card);
            });

            printArea.classList.remove('hidden');
            window.print();
            printArea.classList.add('hidden');
        });
    }

    // --- Reports Logic ---
    const btnRunReport = document.getElementById('btnRunReport');
    const btnPrintReport = document.getElementById('btnPrintReport');
    const repStartDate = document.getElementById('report-start-date');
    const repEndDate = document.getElementById('report-end-date');
    
    const dateNow = new Date();
    const firstDay = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 0).toISOString().split('T')[0];
    if(repStartDate) repStartDate.value = firstDay;
    if(repEndDate) repEndDate.value = lastDay;

    if(btnRunReport) {
        btnRunReport.addEventListener('click', async () => {
            if(!window.supabase) return;
            const sDate = repStartDate.value;
            const eDate = repEndDate.value;
            if(!sDate || !eDate) return;

            const tbody = document.querySelector('#reportsTable tbody');
            const tfoot = document.getElementById('reportsFooter');
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${texts[currentLang].loading}</td></tr>`;
            tfoot.innerHTML = '';

            try {
                const { data: attData } = await supabase.from('attendance')
                    .select('*').gte('date', sDate).lte('date', eDate);
                
                const { data: advData } = await supabase.from('cash_advance')
                    .select('*').gte('date', sDate).lte('date', eDate);
                
                let totalNet = 0;
                let totalAdv = 0;
                let totalGross = 0;

                tbody.innerHTML = '';
                workersList.forEach(w => {
                    const days = attData ? attData.filter(a => a.worker_id == w.id && a.status === 'Present').length : 0;
                    const regPay = days * w.salary;
                    
                    const workerAdvs = advData ? advData.filter(a => a.worker_id == w.id) : [];
                    const advancesSum = workerAdvs.reduce((sum, a) => sum + parseFloat(a.amount), 0);
                    
                    const netPay = regPay - advancesSum;
                    
                    if (days > 0 || advancesSum > 0) {
                        totalGross += regPay;
                        totalAdv += advancesSum;
                        totalNet += netPay;
                        
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>#${w.id}</td>
                            <td style="font-weight:700;">${w.name}</td>
                            <td>${w.salary.toLocaleString()}</td>
                            <td>${days}</td>
                            <td>${regPay.toLocaleString()}</td>
                            <td style="color:#e74c3c;">${advancesSum > 0 ? advancesSum.toLocaleString() : '-'}</td>
                            <td style="font-weight:bold; color: ${netPay < 0 ? '#e74c3c' : 'inherit'}">${netPay.toLocaleString()} ד.ع</td>
                        `;
                        tbody.appendChild(tr);
                    }
                });

                if(tbody.innerHTML === '') {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">لا توجد بيانات لهذه الفترة/No data for this period.</td></tr>`;
                } else {
                    tfoot.innerHTML = `
                        <tr>
                            <td colspan="4" style="text-align:end;">المجموع / Totals:</td>
                            <td>${totalGross.toLocaleString()}</td>
                            <td style="color:#e74c3c;">${totalAdv.toLocaleString()}</td>
                            <td style="color:var(--clr-accent);">${totalNet.toLocaleString()} ד.ع</td>
                        </tr>
                    `;
                }

            } catch (err) {
                console.error(err);
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Error loading report.</td></tr>`;
            }
        });
    }

    if(btnPrintReport) {
        btnPrintReport.addEventListener('click', () => {
            document.body.classList.add('printing-report');
            window.print();
            document.body.classList.remove('printing-report');
        });
    }

});
