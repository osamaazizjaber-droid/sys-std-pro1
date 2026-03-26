// sys-std-web/js/assignments.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if(!supabase) return;

    const form = document.getElementById('assignment-form');
    const matrixBody = document.getElementById('schedule-matrix-body');
    const profSelect = document.getElementById('assign-prof');
    const subjectSuggest = document.getElementById('subject-suggestions');
    const importCsvInput = document.getElementById('import-csv-file');

    let professors = [];
    let assignments = [];

    const STAGE_ORDER = [
        "المرحلة الاولى - الصباحي", "المرحلة الاولى - المسائي",
        "المرحلة الثانية - الصباحي", "المرحلة الثانية - المسائي",
        "المرحلة الثالثة - الصباحي", "المرحلة الثالثة - المسائي",
        "المرحلة الرابعة - الصباحي", "المرحلة الرابعة - المسائي"
    ];

    async function start() {
        collegeId = window.WMS_COLLEGE_ID;
        if (!collegeId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) collegeId = user.id;
        }
        if (!collegeId) return;

        await loadProfessors();
        await loadAssignments();
        form?.addEventListener('submit', handleFormSubmit);
        importCsvInput?.addEventListener('change', handleCSVImport);
    }

    if (window.WMS_COLLEGE_ID) {
        start();
    } else {
        document.addEventListener('wms-auth-ready', start);
        setTimeout(() => { if (!assignments.length) start(); }, 2000);
    }

    // ── Toast Logic ──
    function showToast(msg, isError = false) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        const msgEl = document.getElementById('toast-msg');
        const iconEl = document.getElementById('toast-icon');
        
        msgEl.textContent = msg;
        iconEl.textContent = isError ? 'error' : 'check_circle';
        iconEl.className = `material-symbols-outlined ${isError ? 'text-error' : 'text-success'}`;
        
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    async function loadProfessors() {
        const { data } = await supabase.from('professors')
            .select('prof_id, prof_name')
            .eq('college_id', collegeId)
            .order('prof_name');
        
        if (data) {
            professors = data;
            const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
            const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];
            
            profSelect.innerHTML = `<option value="" disabled selected>${dict['select-prof'] || 'Select Professor...'}</option>`;
            data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.prof_id;
                opt.textContent = p.prof_name;
                profSelect.appendChild(opt);
            });
        }
    }

    async function loadAssignments() {
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];
        
        matrixBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-300 animate-pulse">${dict['loading-assignments'] || 'Loading schedule...'}</td></tr>`;
        
        const { data, error } = await supabase.from('subject_assignments')
            .select(`*, professors(prof_name)`)
            .eq('college_id', collegeId);
            
        if (error) {
            console.error(error);
            matrixBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-red-400 font-bold">${dict['error-loading-assignments'] || 'Error loading assignments.'}</td></tr>`;
            return;
        }

        assignments = (data || []).map(a => {
            if (a.subject_name.includes('|')) {
                const parts = a.subject_name.split('|');
                return {
                    ...a,
                    subject_name_display: parts[0],
                    days_extracted: parts[1] ? parts[1].split(',').map(Number) : []
                };
            }
            return {
                ...a,
                subject_name_display: a.subject_name,
                days_extracted: a.days ? (Array.isArray(a.days) ? a.days : a.days.split(',').map(Number)) : []
            };
        });
        
        renderMatrix();
        updateSubjectSuggestions();
    }

    function renderMatrix() {
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];
        matrixBody.innerHTML = '';

        if (assignments.length === 0) {
            matrixBody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-slate-400 font-medium">${dict['no-records'] || 'No assignments mapped yet.'}</td></tr>`;
            return;
        }

        const stageMap = {};
        assignments.forEach(a => {
            if (!stageMap[a.stage_name]) stageMap[a.stage_name] = [];
            stageMap[a.stage_name].push(a);
        });

        let foundAny = false;
        STAGE_ORDER.forEach(stageName => {
            const stageData = stageMap[stageName];
            if (!stageData || stageData.length === 0) return;
            foundAny = true;

            const tr = document.createElement('tr');
            const tdHeader = document.createElement('td');
            tdHeader.className = "stage-header sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]";
            
            const subLabel = (dict['num-subjects'] || '{n} Subjects').replace('{n}', stageData.length);

            tdHeader.innerHTML = `
                <div class="text-[13px] tracking-tight font-black font-arabic leading-snug" dir="rtl">${stageName}</div>
                <div class="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">${subLabel}</div>
            `;
            tr.appendChild(tdHeader);

            for (let dayIdx = 0; dayIdx <= 4; dayIdx++) {
                const tdDay = document.createElement('td');
                const coursesToday = stageData.filter(a => a.days_extracted.includes(dayIdx));

                if (coursesToday.length > 0) {
                    let cellHTML = `<div class="flex flex-col gap-2">`;
                    coursesToday.forEach(course => {
                        const removeTitle = dict['remove-assignment'] || 'Remove Assignment';
                        cellHTML += `
                            <div class="group relative bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-default overflow-hidden">
                                <button onclick="window.removeCourse('${course.id}')" class="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500 hover:text-white" title="${removeTitle}">
                                    <span class="material-symbols-outlined text-[14px]">close</span>
                                </button>
                                <div class="font-bold text-slate-800 text-sm leading-tight pr-5">${course.subject_name_display}</div>
                                <div class="flex items-center gap-1.5 mt-2 text-slate-500">
                                    <span class="material-symbols-outlined text-[13px] text-primary">person</span>
                                    <span class="text-[10px] uppercase font-bold tracking-widest">${course.professors?.prof_name || '...'}</span>
                                </div>
                            </div>
                        `;
                    });
                    cellHTML += `</div>`;
                    tdDay.innerHTML = cellHTML;
                } else {
                    tdDay.innerHTML = `
                        <div class="h-full min-h-[80px] flex items-center justify-center flex-col text-slate-300 opacity-40">
                            <span class="material-symbols-outlined text-2xl mb-1">free_cancellation</span>
                        </div>
                    `;
                }
                tr.appendChild(tdDay);
            }
            matrixBody.appendChild(tr);
        });

        if (!foundAny) {
            matrixBody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-slate-400 font-medium">${dict['no-records'] || 'No assignments found in matrix.'}</td></tr>`;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const stage = document.getElementById('assign-stage').value;
        const subject = document.getElementById('assign-subject').value.trim();
        const profId = document.getElementById('assign-prof').value;
        
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';

        const daysArr = [];
        document.querySelectorAll('input[name="assign-days"]:checked').forEach(cb => {
            daysArr.push(parseInt(cb.value));
        });

        if (daysArr.length === 0) {
            showToast(lang === 'ar' ? 'يرجى اختيار يوم واحد على الأقل.' : 'Please select at least one day.', true);
            return;
        }

        const btn = document.getElementById('btn-save-assignment');
        btn.disabled = true;

        try {
            const compositeSubjectName = `${subject}|${daysArr.join(',')}`;

            const { data: existing } = await supabase.from('subject_assignments')
                .select('id')
                .eq('college_id', collegeId)
                .eq('stage_name', stage)
                .or(`subject_name.eq."${subject}",subject_name.ilike."${subject}|%"`)
                .limit(1)
                .maybeSingle();

            let saveResult;
            if (existing) {
                saveResult = await supabase.from('subject_assignments')
                    .update({
                        subject_name: compositeSubjectName,
                        prof_id: profId
                    })
                    .eq('id', existing.id);
            } else {
                saveResult = await supabase.from('subject_assignments')
                    .insert([{
                        college_id: collegeId,
                        stage_name: stage,
                        subject_name: compositeSubjectName,
                        prof_id: profId
                    }]);
            }

            if (saveResult.error) throw saveResult.error;

            showToast(lang === 'ar' ? "تم حفظ التوزيع بنجاح!" : "Assignment saved successfully!");
            form.reset();
            await loadAssignments();
        } catch (err) {
            console.error(err);
            showToast("Update failed: " + err.message, true);
        } finally {
            btn.disabled = false;
        }
    }

    window.removeCourse = async (id) => {
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const msg = lang === 'ar' ? 'هل أنت متأكد من حذف هذا التوزيع؟' : 'Are you sure you want to remove this assignment?';
        if (!confirm(msg)) return;
        
        const { error } = await supabase.from('subject_assignments').delete().eq('id', id).eq('college_id', collegeId);
        if (error) showToast(error.message, true);
        else {
            showToast(lang === 'ar' ? "تم الحذف بنجاح" : "Removed successfully");
            await loadAssignments();
        }
    };

    // ── Enhanced PDF Exporter ──
    window.exportSchedulePDF = async function() {
        const btn = document.getElementById('btn-print-pdf');
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const dict = window.WMS_I18N[lang] || window.WMS_I18N['en'];
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span><span class="text-sm">${lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>`;
        btn.disabled = true;
        
        try {
            await document.fonts.ready;
            const wrapper = document.getElementById('matrix-wrapper');
            
            // Inject a temporary localized header for html2canvas to capture
            const pdfHeader = document.createElement('div');
            pdfHeader.id = 'temp-pdf-header';
            pdfHeader.style.padding = '30px';
            pdfHeader.style.backgroundColor = '#ffffff';
            pdfHeader.style.borderBottom = '2px solid #f1f5f9';
            pdfHeader.style.marginBottom = '20px';
            
            const dateStr = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
            const genText = (dict['generated-on'] || "Generated: {d}").replace('{d}', dateStr);
            
            pdfHeader.innerHTML = `
                <div style="font-family: Arial, sans-serif; ${lang === 'ar' ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'}">
                    <h1 style="font-size: 28px; font-weight: 800; color: #191c1d; margin: 0; line-height: 1.2;">
                        ${dict['schedule-matrix-pdf'] || "Academic Course Schedule Matrix"}
                    </h1>
                    <p style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 8px;">
                        ${genText}
                    </p>
                </div>
            `;
            wrapper.prepend(pdfHeader);

            const originalOverflow = wrapper.style.overflow;
            wrapper.classList.remove('overflow-x-auto');
            wrapper.style.overflow = 'visible';
            wrapper.style.width = 'max-content';

            const canvas = await html2canvas(wrapper, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                windowWidth: wrapper.scrollWidth + 100
            });
            
            // Clean up temporary header and styles
            pdfHeader.remove();
            wrapper.classList.add('overflow-x-auto');
            wrapper.style.overflow = originalOverflow;
            wrapper.style.width = '';

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4'); 
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);
            const contentHeight = (canvas.height * contentWidth) / canvas.width;
            
            // Directly add the image (which now includes the header) to the PDF
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, contentHeight);
            pdf.save('Academic_Schedule.pdf');
            showToast(lang === 'ar' ? "تم تصدير PDF بنجاح!" : "PDF exported successfully!");
        } catch (err) {
            console.error(err);
            showToast(lang === 'ar' ? "فشل تصدير التقرير" : "Failed to export PDF.", true);
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    };

    function updateSubjectSuggestions() {
        if (!subjectSuggest) return;
        const uniqueSubjects = [...new Set(assignments.map(a => a.subject_name_display))];
        subjectSuggest.innerHTML = '';
        uniqueSubjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            subjectSuggest.appendChild(opt);
        });
    }

    async function handleCSVImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) return showToast("CSV is empty.", true);

            const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';

            const headers = lines[0].toLowerCase().split(',');
            const stageIdx = headers.findIndex(h => h.includes('stage'));
            const subjectIdx = headers.findIndex(h => h.includes('subject'));
            const profIdx = headers.findIndex(h => h.includes('prof'));
            const daysIdx = headers.findIndex(h => h.includes('days'));

            const importEntries = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(s => s.trim());
                const sName = parts[stageIdx];
                const subName = parts[subjectIdx];
                const pName = parts[profIdx] || '';
                const dList = parts[daysIdx] || '0,2';

                if (!sName || !subName) continue;

                let profIdMatched = null;
                if (pName) {
                    const found = professors.find(p => p.prof_name.toLowerCase() === pName.toLowerCase());
                    if (found) profIdMatched = found.prof_id;
                }
                importEntries.push({ sName, subName, dList, profIdMatched });
            }

            if (importEntries.length === 0) return showToast("No valid data found.", true);

            const confirmMsg = lang === 'ar' ? `استيراد ${importEntries.length} توزيع؟` : `Import ${importEntries.length} assignments?`;
            if (confirm(confirmMsg)) {
                for (const item of importEntries) {
                    const composite = `${item.subName}|${item.dList}`;
                    const { data: existing } = await supabase.from('subject_assignments')
                        .select('id').eq('college_id', collegeId).eq('stage_name', item.sName)
                        .or(`subject_name.eq."${item.subName}",subject_name.ilike."${item.subName}|%"`)
                        .limit(1).maybeSingle();

                    if (existing) {
                        await supabase.from('subject_assignments').update({ subject_name: composite, prof_id: item.profIdMatched }).eq('id', existing.id);
                    } else {
                        await supabase.from('subject_assignments').insert([{ college_id: collegeId, stage_name: item.sName, subject_name: composite, prof_id: item.profIdMatched }]);
                    }
                }
                showToast(lang === 'ar' ? "تم الاستيراد بنجاح" : "Import completed.");
                await loadAssignments();
            }
            importCsvInput.value = '';
        };
        reader.readAsText(file);
    }

    // No manual init call needed anymore as start() handles it via listeners
});
