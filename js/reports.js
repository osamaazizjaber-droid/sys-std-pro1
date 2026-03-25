// sys-std-web/js/reports.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if(!supabase) return;

    const btnRunReport = document.getElementById('btnRunReport');
    const btnPrintReport = document.getElementById('btnPrintReport');
    const repStartDate = document.getElementById('report-start-date');
    const repEndDate = document.getElementById('report-end-date');
    const matrixHead = document.getElementById('matrix-head');
    const matrixTbody = document.getElementById('matrix-tbody');
    const filterGrade = document.getElementById('report-filter-grade');
    const filterSubject = document.getElementById('report-filter-subject');
    const filterProf = document.getElementById('report-filter-prof');
    let professorsList = [];
    let attendanceChartInstance = null;
    let globalDatesList = [];
    let globalRenderedStudents = [];

    
    // Init dates to current month
    const dateNow = new Date();
    const todayStr = `${dateNow.getFullYear()}-${String(dateNow.getMonth()+1).padStart(2,'0')}-${String(dateNow.getDate()).padStart(2,'0')}`;
    const firstDay = `${dateNow.getFullYear()}-${String(dateNow.getMonth()+1).padStart(2,'0')}-01`;
    repStartDate.value = firstDay;
    repEndDate.value = todayStr;

    let studentsList = [];
    const { data: sData } = await supabase.from('students').select('*').order('student_id');
    if (sData) studentsList = sData;

    btnRunReport.addEventListener('click', generateReport);

    const { data: pData } = await supabase.from('professors').select('*');
    if (pData) professorsList = pData;

    // Populate Dropdowns
    async function populateFilters() {
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];

        const uniqueGrades = [...new Set(studentsList.map(s => s.grade).filter(Boolean))];
        filterGrade.innerHTML = `<option value="ALL">${dict['all-grades'] || 'All Stages'}</option>`;
        uniqueGrades.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g; opt.textContent = g;
            filterGrade.appendChild(opt);
        });

        const { data: aData } = await supabase.from('subject_assignments').select('subject_name');
        const uniqueSubjects = [...new Set((aData || []).map(a => a.subject_name).filter(Boolean))];
        filterSubject.innerHTML = `<option value="ALL">${dict['all-subjects'] || 'All Subjects'}</option>`;
        uniqueSubjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            filterSubject.appendChild(opt);
        });

        filterProf.innerHTML = `<option value="ALL">${dict['all-profs'] || 'All Professors'}</option>`;
        professorsList.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.prof_id; opt.textContent = p.prof_name;
            filterProf.appendChild(opt);
        });
    }
    await populateFilters();

    
    function getDatesInRange(startDate, endDate) {
        const date = new Date(startDate);
        const end = new Date(endDate);
        const dates = [];
        while (date <= end) {
            dates.push(date.toISOString().split('T')[0]);
            date.setDate(date.getDate() + 1);
        }
        return dates;
    }

    async function generateReport() {
        const sDate = repStartDate.value;
        const eDate = repEndDate.value;
        
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const tTo = lang === 'ar' ? 'إلى' : 'to';
        const dateString = `<bdi>${sDate}</bdi> ${tTo} <bdi>${eDate}</bdi>`;

        document.getElementById('date-range-display').innerHTML = dateString;
        const kpiDateRangeEl = document.getElementById('kpi-date-range');
        if(kpiDateRangeEl) kpiDateRangeEl.innerHTML = dateString;
        const printPeriodEl = document.getElementById('print-period-display');
        if(printPeriodEl) printPeriodEl.innerHTML = dateString;
        
        matrixTbody.innerHTML = `<tr><td colspan="10" class="p-12 text-center"><span class="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">sync</span><br>Compiling Matrices...</td></tr>`;

        try {
            
            const selectedGrade = filterGrade.value;
            const selectedSubject = filterSubject.value;
            const selectedProf = filterProf.value;

            // Pre-filter Students List
            let filteredStudents = studentsList;
            if (selectedGrade !== 'ALL') {
                filteredStudents = filteredStudents.filter(s => s.grade === selectedGrade);
            }

            // Fetch attendance data

            let { data: attData } = await supabase.from('attendance')
                .select('*')
                .gte('date', sDate)
                .lte('date', eDate);
            
            const datesList = getDatesInRange(sDate, eDate);
            globalDatesList = datesList;
            
            
            // Filter attendance records by subject/prof
            let filteredAttData = attData || [];
            if (selectedSubject !== 'ALL') {
                filteredAttData = filteredAttData.filter(a => a.subject === selectedSubject);
            }
            if (selectedProf !== 'ALL') {
                filteredAttData = filteredAttData.filter(a => a.prof_id === selectedProf);
            }
            
            // Re-assign to attData for downstream
            attData = filteredAttData;
            
            // KPIs

            const totalStudents = filteredStudents.length;
            const uniqueAttendanceDays = new Set((attData||[]).map(a => a.date)).size;
            const activeDays = uniqueAttendanceDays > 0 ? uniqueAttendanceDays : datesList.length;
            const totalAttendances = (attData||[]).filter(a => !!a.status && a.status !== 'Absent').length;
            
            const possibleAttendances = totalStudents * activeDays;
            const rate = possibleAttendances > 0 ? ((totalAttendances / possibleAttendances) * 100).toFixed(1) : 0;

            document.getElementById('kpi-total-students').textContent = totalStudents;
            document.getElementById('kpi-total-days').textContent = activeDays;
            document.getElementById('kpi-attendances').textContent = totalAttendances;
            document.getElementById('kpi-rate').textContent = `${rate}%`;

            // Build Matrix Head
            const tStudentName = (window.WMS_I18N && window.WMS_I18N[lang] && window.WMS_I18N[lang]['student-name']) || 'Student Name';
            const tTotalLbl = (window.WMS_I18N && window.WMS_I18N[lang] && window.WMS_I18N[lang]['total']) || 'Total';
            
            let headHtml = `<th class="p-4 text-[10px] font-black uppercase text-slate-800 tracking-tighter text-start sticky start-0 bg-slate-100 z-10 w-48 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">${tStudentName}</th>`;
            datesList.forEach(d => {
                const dayStr = d.split('-')[2]; // Extract DD
                headHtml += `<th class="p-2 text-[10px] font-bold text-slate-400 w-10 min-w-[40px] border-s border-slate-200">${dayStr}</th>`;
            });
            headHtml += `<th class="p-4 text-[10px] font-black uppercase text-slate-800 tracking-tighter border-s border-slate-200">${tTotalLbl}</th>`;
            matrixHead.innerHTML = headHtml;

            // Build Matrix Body
            matrixTbody.innerHTML = '';
            
            const showAtRisk = document.getElementById('at-risk-filter')?.checked;
            const renderedStudents = [];
            globalRenderedStudents = renderedStudents;
            
            // First pass: Calculate stats and filter
            filteredStudents.forEach(s => {
                const sAtt = (attData || []).filter(a => a.student_id === s.student_id);
                let pC = 0, lC = 0;
                datesList.forEach(d => {
                    const record = sAtt.find(a => a.date === d);
                    if(record && record.status === 'On Leave') lC++;
                    else if(record && record.status !== 'Absent') pC++;
                });
                const aC = datesList.length - pC - lC;
                const aR = datesList.length > 0 ? (aC / datesList.length) : 0;
                
                if (showAtRisk && aR <= 0.1) return; // Skip
                
                s.calculated = { pC, lC, aC, aR, sAtt };
                renderedStudents.push(s);
            });

            // Second pass: Render Matrix (Chunked for Performance / Virtualization)
            let displayCount = 0;
            const chunkSize = 25; // Render 25 students per frame

            function renderNextChunk() {
                const chunk = renderedStudents.slice(displayCount, displayCount + chunkSize);
                if (chunk.length === 0) return;
                
                // Use DocumentFragment for faster insertion
                const fragment = document.createDocumentFragment();
                
                chunk.forEach(s => {
                    const { pC, lC, aC, aR, sAtt } = s.calculated;
                    const tr = document.createElement('tr');
                    tr.className = "group hover:bg-slate-50 transition-colors";
                    
                    let rowHtml = `<td class="p-4 text-sm font-bold text-slate-800 text-start sticky start-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-e border-slate-100">
                        <button class="text-left w-full hover:text-primary transition-colors cursor-pointer group-hover:underline" onclick="openStudentReport('${s.student_id}')">
                            ${s.student_name}
                            <span class="block text-[10px] text-slate-400 font-mono no-underline">${s.student_id}</span>
                        </button>
                    </td>`;
                    
                    datesList.forEach(d => {
                        const record = sAtt.find(a => a.date === d);
                        let cellContent = '<span class="material-symbols-outlined text-error text-lg" style="font-variation-settings: \'FILL\' 1;">cancel</span>'; // Absent
                        if(record && record.status === 'On Leave') {
                            cellContent = '<span class="material-symbols-outlined text-amber-400 text-lg" style="font-variation-settings: \'FILL\' 1;">pending</span>';
                        }
                        else if(record && record.status !== 'Absent') {
                            cellContent = '<span class="material-symbols-outlined text-emerald-500 text-lg" style="font-variation-settings: \'FILL\' 1;">check_circle</span>';
                        }
                        rowHtml += `<td class="p-2 text-[10px] border-s border-slate-100 text-center">${cellContent}</td>`;
                    });
                    
                    let cellStyles = "text-primary border-s border-slate-200";
                    if (aR > 0.1) {
                        cellStyles = "bg-rose-50 text-rose-700 border-s border-rose-200 shadow-inner";
                    }
                    
                    rowHtml += `<td class="p-2 text-xs font-black ${cellStyles}">
                                <div class="flex flex-col items-center justify-center space-y-0.5">
                                    <span>PR: ${pC}/${datesList.length}</span>
                                    ${lC > 0 ? `<span class="text-[9px] text-amber-500 font-bold uppercase tracking-widest leading-none">LV: ${lC}</span>` : ''}
                                    <span class="text-[9px] ${aR > 0.1 ? 'text-rose-500' : 'text-slate-400'} font-bold uppercase tracking-widest leading-none">ABS: ${aC}</span>
                                </div>
                            </td>`;
                    tr.innerHTML = rowHtml;
                    fragment.appendChild(tr);
                });
                
                matrixTbody.appendChild(fragment);
                displayCount += chunk.length;
                
                // Recursively call next chunk via requestAnimationFrame to keep UI responsive
                if (displayCount < renderedStudents.length) {
                    requestAnimationFrame(renderNextChunk);
                }
            }
            
            // Kickoff rendering
            if (renderedStudents.length > 0) {
                requestAnimationFrame(renderNextChunk);
            }

            // Third pass: Render Chart
            if (window.Chart && renderedStudents.length > 0) {
                document.getElementById('chart-container').classList.remove('hidden');
                const labels = datesList.map(d => d.split('-')[2]); // Just DD
                const dataPresent = [];
                const dataAbsent = [];
                
                datesList.forEach(d => {
                    let dP = 0, dA = 0;
                    renderedStudents.forEach(s => {
                        const record = s.calculated.sAtt.find(a => a.date === d);
                        if(record && record.status !== 'Absent' && record.status !== 'On Leave') dP++;
                        else if(!record || record.status === 'Absent') dA++;
                    });
                    dataPresent.push(dP);
                    dataAbsent.push(dA);
                });
                
                
                let themePrimary = '#f49000'; // Default forge
                if (window.WMSSettings) {
                    const themeId = window.WMSSettings.get('theme');
                    switch(themeId) {
                        case 'slate': themePrimary = '#3b82f6'; break;
                        case 'emerald': themePrimary = '#10b981'; break;
                        case 'rose': themePrimary = '#e11d48'; break;
                        case 'violet': themePrimary = '#7c3aed'; break;
                        case 'forge': default: themePrimary = '#f49000'; break;
                    }
                }
                
                let hex = themePrimary.replace('#', '');
                let r = parseInt(hex.substring(0,2), 16);
                let g = parseInt(hex.substring(2,4), 16);
                let b = parseInt(hex.substring(4,6), 16);
                let themeBg = `rgba(${r}, ${g}, ${b}, 0.15)`;

                const ctx = document.getElementById('attendanceChart').getContext('2d');
                if (attendanceChartInstance) attendanceChartInstance.destroy();
                
                attendanceChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Present Students',
                                data: dataPresent,
                                borderColor: themePrimary,
                                backgroundColor: themeBg,
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Absent Students',
                                data: dataAbsent,
                                borderColor: '#f43f5e',
                                backgroundColor: 'transparent',
                                borderDash: [5, 5],
                                borderWidth: 2,
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { precision: 0 }
                            }
                        }
                    }
                });
            } else {
                document.getElementById('chart-container').classList.add('hidden');
            }
            
            if(renderedStudents.length === 0) {

                matrixTbody.innerHTML = `<tr><td colspan="${datesList.length + 2}" class="p-12 text-center text-slate-400 font-bold tracking-widest"><span data-i18n="no-students">NO STUDENTS REGISTERED</span></td></tr>`;
            }

        } catch (err) {
            console.error(err);
            matrixTbody.innerHTML = `<tr><td colspan="11" class="p-12 text-center text-error font-bold">Error compiling metrics stream. View console.</td></tr>`;
        }
    }

    const btnExportCsv = document.getElementById('btnExportCsv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            if (!globalDatesList || globalDatesList.length === 0 || globalRenderedStudents.length === 0) {
                alert("Compute a report first before exporting.");
                return;
            }
            
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // 1. Headers
            let headers = ["Student ID", "Student Name"];
            globalDatesList.forEach(d => headers.push(d));
            headers.push("Present", "Leave", "Absent", "Absence %");
            
            csvContent += headers.join(",") + "\n";
            
            // 2. Rows
            globalRenderedStudents.forEach(s => {
                const { pC, lC, aC, aR, sAtt } = s.calculated;
                let row = [
                    `"${s.student_id}"`, 
                    `"${s.student_name}"`
                ];
                
                globalDatesList.forEach(d => {
                    const record = sAtt.find(a => a.date === d);
                    let val = "A";
                    if(record && record.status === "On Leave") val = "L";
                    else if(record && record.status !== "Absent") val = "P";
                    row.push(val);
                });
                
                row.push(pC, lC, aC, (aR * 100).toFixed(1) + "%");
                csvContent += row.join(",") + "\n";
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `attendance_export_${document.getElementById('report-start-date').value}_to_${document.getElementById('report-end-date').value}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    btnPrintReport.addEventListener('click', () => {
        window.print();
    });


    // --- Priority 4: Individual Student Term Report Card --- //
    window.openStudentReport = function(student_id) {
        if (!globalRenderedStudents) return;
        const s = globalRenderedStudents.find(stu => stu.student_id === student_id);
        if(!s) return;
        
        document.getElementById('modal-initial').textContent = s.student_name.charAt(0);
        document.getElementById('modal-name').textContent = s.student_name;
        document.getElementById('modal-id').textContent = s.student_id;
        
        const { pC, lC, aC, sAtt } = s.calculated;
        document.getElementById('modal-p').textContent = pC;
        document.getElementById('modal-l').textContent = lC;
        document.getElementById('modal-a').textContent = aC;
        
        const tbody = document.getElementById('modal-history-body');
        tbody.innerHTML = '';
        
        let infractionCount = 0;
        
        // Loop purely through datesList to find absences and leaves
        globalDatesList.forEach(d => {
             const record = sAtt.find(a => a.date === d);
             if(!record || record.status === 'Absent' || record.status === 'On Leave') {
                 infractionCount++;
                 let statHtml = '';
                 let bColor = '';
                 
                 if(record && record.status === 'On Leave') {
                     statHtml = '<span class="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded text-[10px]">ON LEAVE</span>';
                     bColor = 'bg-white';
                 } else {
                     statHtml = '<span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">ABSENT</span>';
                     bColor = 'bg-rose-50/30';
                 }
                 
                 tbody.innerHTML += `
                    <tr class="${bColor}">
                        <td class="p-2 font-bold">${d}</td>
                        <td class="p-2">${statHtml}</td>
                        <td class="p-2 text-slate-500">${record ? (record.subject || '-') : '—'}</td>
                        <td class="p-2 text-slate-500">${record ? (record.prof_name || '-') : '—'}</td>
                    </tr>
                 `;
             }
        });
        
        if(infractionCount === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 font-bold">Perfect Attendance! No history found.</td></tr>';
        }
        
        const modal = document.getElementById('studentModal');
        const modalContent = document.getElementById('studentModalContent');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-95');
    };
    
    window.closeStudentModal = function() {
        const modal = document.getElementById('studentModal');
        const modalContent = document.getElementById('studentModalContent');
        modal.classList.add('opacity-0', 'pointer-events-none');
        modalContent.classList.add('scale-95');
    };
    
    window.printStudentModal = function() {
        const printContents = document.getElementById('studentModalPrintArea').innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = '<div class="p-8 max-w-3xl mx-auto bg-white">' + printContents + '</div>';
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reload to restore event listeners destroyed by innerHTML swap
    };

    generateReport();
});
