// sys-wms-web/js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }

    const kpiTotalStudents = document.getElementById('kpi-total-students');
    const kpiTotalProfessors = document.getElementById('kpi-total-professors');
    const stageChartContainer = document.getElementById('stage-chart-container');

    let collegeId = window.WMS_COLLEGE_ID;

    async function start() {
        collegeId = window.WMS_COLLEGE_ID;
        if (!collegeId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) collegeId = user.id;
        }
        if (!collegeId) return;

        loadMetrics();
    }

    if (window.WMS_COLLEGE_ID) {
        start();
    } else {
        document.addEventListener('wms-auth-ready', start);
        setTimeout(start, 2000);
    }
    
    async function loadMetrics() {
        const currentYear = window.WMSSettings ? window.WMSSettings.get('academic_year') : '';

        // 1. Total Students & Stage Distribution
        try {
            let studentQuery = supabase.from('students').select('grade').eq('college_id', collegeId);
            
            if (currentYear) {
                // Robust check: try both slash (2024/2025) and dash (2024-2025)
                const dashYear = currentYear.replace('/', '-');
                studentQuery = studentQuery.or(`academic_year.eq."${currentYear}",academic_year.eq."${dashYear}"`);
            }
            
            const { data: students, error: sErr } = await studentQuery;
            if (sErr) throw sErr;

            const totalCount = students.length;
            if (kpiTotalStudents) kpiTotalStudents.textContent = totalCount;

            // Group by Stage
            const counts = {};
            students.forEach(s => {
                const stage = s.grade || 'Unknown';
                counts[stage] = (counts[stage] || 0) + 1;
            });

            renderStageChart(counts, totalCount);

        } catch (err) {
            console.error("Enrollment Load Error:", err);
            if (kpiTotalStudents) kpiTotalStudents.textContent = "Err";
        }

        // 2. Total Professors
        try {
            const { count: profsCount, error: profErr } = await supabase
                .from('professors')
                .select('*', { count: 'exact', head: true })
                .eq('college_id', collegeId);
            if (profErr) throw profErr;
            if (kpiTotalProfessors) kpiTotalProfessors.textContent = profsCount || 0;
        } catch (err) {
            console.error("Total Professors Load Error:", err);
            if (kpiTotalProfessors) kpiTotalProfessors.textContent = "Err";
        }
    }

    function renderStageChart(counts, total) {
        if (!stageChartContainer) return;

        const stages = Object.keys(counts).sort();
        if (stages.length === 0) {
            stageChartContainer.innerHTML = `<div class="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No students enrolled.</div>`;
            return;
        }

        stageChartContainer.innerHTML = '';
        stages.forEach(stage => {
            const count = counts[stage];
            const pct = total > 0 ? (count / total) * 100 : 0;

            const row = document.createElement('div');
            row.className = "group space-y-2";
            row.innerHTML = `
                <div class="flex items-center justify-between text-sm">
                    <span class="font-bold text-slate-700 group-hover:text-primary transition-colors">${stage}</span>
                    <span class="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-black text-slate-400 shadow-sm">${count}</span>
                </div>
                <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                    <div class="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(244,144,0,0.4)]" style="width: 0%"></div>
                </div>
            `;
            stageChartContainer.appendChild(row);

            // Animate bar
            setTimeout(() => {
                const bar = row.querySelector('.bg-primary');
                if (bar) bar.style.width = `${pct}%`;
            }, 50);
        });
    }

    // Re-load metrics if academic year changes
    window.addEventListener('wms-settings-update', (e) => {
        if (e.detail.k === 'academic_year') {
            loadMetrics();
        }
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'wms-pro-settings') {
            loadMetrics();
        }
    });
});
