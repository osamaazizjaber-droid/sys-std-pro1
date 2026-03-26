document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase from global reference found in config.js
    const supabase = window.sbClient;
    if (!supabase) {
        console.error("Supabase client not found!");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated.");
        return;
    }
    const userId = user.id;

    const tbody = document.getElementById('students-tbody');
    const kpiTotalStudents = document.getElementById('kpi-total-students');
    
    const photoInput = document.getElementById('student-photo-input');
    const photoPreview = document.getElementById('student-photo-preview');
    const photoIcon = document.getElementById('photo-placeholder-icon');
    
    const inputName = document.getElementById('student-name');
    const inputPos = document.getElementById('student-grade');
    const inputYear = document.getElementById('student-academic-year');
    const btnSubmit = document.getElementById('btn-submit-student');

    const searchInput = document.getElementById('search-students');
    const filterStage = document.getElementById('filter-stage');
    const sortBtn = document.getElementById('sort-student-id');
    const sortIcon = document.getElementById('sort-icon');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIconEl = document.getElementById('toast-icon');

    let studentsData = [];
    let currentPhotoBase64 = "";
    let sortColumn = 'student_id';
    let sortAscending = false; 

    // --- HELPER: Toast Notifications ---
    function showToast(message, type = 'success') {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        
        if (type === 'success') {
            toastIconEl.textContent = 'check_circle';
            toastIconEl.style.color = '#10b981';
        } else {
            toastIconEl.textContent = 'error';
            toastIconEl.style.color = '#ef4444';
        }
        
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Load initial data
    await loadStudents();
    populateAcademicYears();
    populateStages();

    function populateStages() {
        // Collect existing stages and merge with defaults
        const defaultStages = [
            "المرحلة الاولى - الصباحي",
            "المرحلة الاولى - المسائي",
            "المرحلة الثانية - الصباحي",
            "المرحلة الثانية - المسائي"
        ];
        const uniqueStages = [...new Set([...defaultStages, ...studentsData.map(s => s.grade).filter(Boolean)])].sort();
        
        const stageDropdowns = [
            document.getElementById('student-grade'),
            document.getElementById('edit-student-grade')
        ];
        const filterDropdown = document.getElementById('filter-stage');

        if (filterDropdown) {
            const lang = (window.WMSSettings && window.WMSSettings.get('lang')) || 'en';
            const allText = (window.WMS_I18N[lang] && window.WMS_I18N[lang]['all-stages']) || 'All Stages Overview';
            filterDropdown.innerHTML = `<option value="all">${allText}</option>`;
            uniqueStages.forEach(st => {
                const opt = document.createElement('option');
                opt.value = st; opt.textContent = st;
                filterDropdown.appendChild(opt);
            });
        }

        stageDropdowns.forEach(dd => {
            if (!dd) return;
            const placeholder = dd.querySelector('option[disabled]')?.outerHTML || '';
            dd.innerHTML = placeholder;
            uniqueStages.forEach(st => {
                const opt = document.createElement('option');
                opt.value = st; opt.textContent = st;
                dd.appendChild(opt);
            });
        });
    }

    function populateAcademicYears() {
        const studentAY = document.getElementById('student-academic-year');
        const targetAY = document.getElementById('target-academic-year');
        const editAY = document.getElementById('edit-student-academic-year');
        if (!studentAY || !targetAY) return;

        const start = 2024;
        const end = 2030;
        let options = `<option value="" disabled selected data-i18n-placeholder="academic-year">Select Year...</option>`;
        let targetOptions = `<option value="" disabled selected data-i18n="target-year-label">Target Year</option>`;
        let editOptions = `<option value="" disabled selected>Select Year...</option>`;

        for (let y = start; y < end; y++) {
            const val = `${y}/${y+1}`;
            options += `<option value="${val}">${val}</option>`;
            targetOptions += `<option value="${val}">${val}</option>`;
            editOptions += `<option value="${val}">${val}</option>`;
        }

        studentAY.innerHTML = options;
        targetAY.innerHTML = targetOptions;
        if (editAY) editAY.innerHTML = editOptions;

        // Auto-select current global academic year if set
        if (window.WMSSettings) {
            const globalAY = window.WMSSettings.get('academic_year');
            if (globalAY) studentAY.value = globalAY;
        }
    }

    // 1. Photo selection & scaling logic
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 256;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                
                photoIcon.classList.add('hidden');
                photoPreview.src = currentPhotoBase64;
                photoPreview.classList.remove('hidden');
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });

    // 2. Submit Student
    btnSubmit.addEventListener('click', async () => {
        const name = inputName.value.trim();
        const pos = inputPos.value;
        const year = inputYear ? inputYear.value : '';

        if (!name) {
            showToast("Please provide a valid Name!", "error");
            return;
        }

        const btnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin">sync</span><span>Enrolling...</span>`;
        btnSubmit.disabled = true;

        try {
            // Calculate Next Sequential ID
            const { data: lastStudent } = await supabase
                .from('students')
                .select('student_id')
                .eq('college_id', userId)
                .like('student_id', 'std%')
                .order('student_id', { ascending: false })
                .limit(1);
            
            let nextIdNum = 1;
            if (lastStudent && lastStudent.length > 0) {
                const lastId = lastStudent[0].student_id;
                const match = lastId.match(/std(\d+)/);
                if (match) nextIdNum = parseInt(match[1]) + 1;
            }
            const nextId = "std" + String(nextIdNum).padStart(3, '0');

            const payload = {
                student_id: nextId,
                college_id: userId,
                student_name: name,
                grade: pos,
                academic_year: year,
                photo_url: currentPhotoBase64
            };
            
            const { error } = await supabase.from('students').insert([payload]);
            if (error) throw error;

            showToast("Student profile enrolled successfully!");
            
            // clear form
            inputName.value = '';
            inputPos.selectedIndex = 0;
            if(inputYear) inputYear.selectedIndex = 0;
            
            currentPhotoBase64 = "";
            if(photoInput) photoInput.value = "";
            photoPreview.classList.add('hidden');
            photoIcon.classList.remove('hidden');

            await loadStudents(); 
            populateStages(); // Update filters if new stage added
        } catch (err) {
            console.error(err);
            showToast("Error adding student: " + err.message, "error");
        } finally {
            btnSubmit.innerHTML = btnText;
            btnSubmit.disabled = false;
        }
    });

    // 3. Fetch and Render Table Data
    async function loadStudents() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const stageFilter = filterStage?.value || 'all';

        try {
            let query = supabase
                .from('students')
                .select('*', { count: 'exact' })
                .eq('college_id', userId)
                .neq('status', 'Graduated');
            
            if (stageFilter !== 'all') {
                query = query.eq('grade', stageFilter);
            }

            const { data, error, count } = await query.order(sortColumn, { ascending: sortAscending });
            if (error) throw error;
            studentsData = data || [];

            let filteredData = data;
            if (searchTerm) {
                filteredData = data.filter(s => 
                    s.student_name.toLowerCase().includes(searchTerm) || 
                    s.student_id.toLowerCase().includes(searchTerm)
                );
            }

            if (kpiTotalStudents) kpiTotalStudents.textContent = count || 0;

            tbody.innerHTML = '';
            if (filteredData.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-16 text-center text-slate-400 font-medium">No results found</td></tr>`;
                return;
            }

            filteredData.forEach(w => {
                const tr = document.createElement('tr');
                const photoSrc = w.photo_url && w.photo_url.startsWith('data:image') 
                    ? w.photo_url 
                    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmMWY1ZjkiIHJ4PSI4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJJbnRlciIgc2l6ZT0iMTYiIGZpbGw9IiM5NGFzYjgiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QPC90ZXh0Pjwvc3ZnPg==';

                tr.innerHTML = `
                    <td class="text-center">
                        <input type="checkbox" class="wms-checkbox mx-auto student-cb" value="${w.student_id}">
                    </td>
                    <td class="font-mono text-xs font-bold text-slate-400">${w.student_id || '---'}</td>
                    <td>
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                                <img src="${photoSrc}" class="w-full h-full object-cover">
                            </div>
                            <span class="font-bold text-slate-900">${w.student_name}</span>
                        </div>
                    </td>
                    <td>
                        <div class="font-bold text-sm text-slate-700">${w.grade || '---'}</div>
                        <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest">${w.academic_year || '---'}</div>
                    </td>
                    <td class="text-right">
                        <div class="flex justify-end gap-2">
                            <button class="size-9 rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-orange-50 border border-slate-200 flex items-center justify-center transition-all edit-btn" data-id="${w.student_id}">
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button class="size-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 flex items-center justify-center transition-all delete-btn" data-id="${w.student_id}">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Re-attach events
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm("Permanently remove this student?")) {
                        await deleteStudent(id);
                    }
                });
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    await openEditModal(id);
                });
            });

        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-8">Error loading database</td></tr>`;
        }
    }

    async function deleteStudent(id) {
        try {
            const { error } = await supabase.from('students').delete().eq('college_id', userId).eq('student_id', id);
            if (error) throw error;
            showToast("Student record deleted.");
            await loadStudents();
        } catch(error) {
            console.error(error);
            showToast("Deletion failed: " + error.message, "error");
        }
    }

    // --- EDIT MODAL LOGIC ---
    const editPhotoInput = document.getElementById('edit-photo-input');
    const editPhotoPreview = document.getElementById('edit-photo-preview');
    const editInputId = document.getElementById('edit-student-id');
    const editInputName = document.getElementById('edit-student-name');
    const editInputPos = document.getElementById('edit-student-grade');
    const editInputYear = document.getElementById('edit-student-academic-year');
    const btnSaveEdit = document.getElementById('btn-save-edit');

    let editPhotoBase64 = "";

    async function openEditModal(id) {
        try {
            const { data, error } = await supabase.from('students').select('*').eq('college_id', userId).eq('student_id', id).single();
            if (error) throw error;

            editInputId.value = data.student_id;
            editInputName.value = data.student_name || '';
            editInputPos.value = data.grade || '';
            if(editInputYear) editInputYear.value = data.academic_year || '';
            
            if (data.photo_url) {
                editPhotoPreview.src = data.photo_url;
                editPhotoPreview.classList.remove('hidden');
                editPhotoBase64 = data.photo_url;
            } else {
                editPhotoPreview.classList.add('hidden');
                editPhotoBase64 = "";
            }

            if (window.showEditModal) {
                window.showEditModal();
            } else {
                const modal = document.getElementById('edit-student-modal');
                modal.classList.remove('hidden');
                modal.classList.add('flex', 'opacity-100');
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to load student!", "error");
        }
    }

    editPhotoInput?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = img.height * (256 / img.width);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                editPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                editPhotoPreview.src = editPhotoBase64;
                editPhotoPreview.classList.remove('hidden');
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });

    btnSaveEdit?.addEventListener('click', async () => {
        const id = editInputId.value;
        const name = editInputName.value.trim();
        const pos = editInputPos.value;

        if (!name) {
            showToast("Invalid data!", "error");
            return;
        }

        const btnText = btnSaveEdit.innerHTML;
        btnSaveEdit.innerHTML = `<span class="material-symbols-outlined animate-spin">sync</span><span>Saving...</span>`;
        btnSaveEdit.disabled = true;

        try {
            const payload = {
                student_name: name,
                grade: pos,
                photo_url: editPhotoBase64
            };
            if (editInputYear) payload.academic_year = editInputYear.value;

            const { error } = await supabase.from('students').update(payload).eq('college_id', userId).eq('student_id', id);
            if (error) throw error;

            if (window.hideEditModal) window.hideEditModal();
            else document.getElementById('edit-student-modal').classList.add('hidden');
            
            showToast("Changes saved successfully!");
            await loadStudents();
        } catch (err) {
            console.error(err);
            showToast("Save failed!", "error");
        } finally {
            btnSaveEdit.innerHTML = btnText;
            btnSaveEdit.disabled = false;
        }
    });

    // --- EXPORT/IMPORT ---
    document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
        try {
            const { data, error } = await supabase.from('students').select('*').eq('college_id', userId).order('student_id', { ascending: true });
            if (error) throw error;
            if (!data || data.length === 0) return showToast("Nothing to export.", "error");

            const headers = ["student_id", "student_name", "grade", "academic_year"];
            let csv = headers.join(",") + "\n";
            data.forEach(row => {
                csv += headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(",") + "\n";
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_${new Date().toLocaleDateString()}.csv`;
            a.click();
            showToast("Export complete!");
        } catch (err) {
            showToast("Export failed!", "error");
        }
    });

    document.getElementById('import-csv-file')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const lines = event.target.result.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length < 2) throw new Error("File empty");

                const { data: lastStudent } = await supabase.from('students').select('student_id').eq('college_id', userId).like('student_id', 'std%').order('student_id', { ascending: false }).limit(1);
                let nextId = 1;
                if(lastStudent?.[0]?.student_id) nextId = parseInt(lastStudent[0].student_id.replace('std', '')) + 1;

                const headers = lines[0].toLowerCase().split(',');
                const nameIdx = headers.findIndex(h => h.includes('name'));
                const gradeIdx = headers.findIndex(h => h.includes('grade'));
                const yearIdx = headers.findIndex(h => h.includes('year'));

                const batch = [];
                for(let i=1; i<lines.length; i++) {
                    const row = lines[i].split(',').map(v => v.replace(/"/g, ''));
                    if(!row[nameIdx]) continue;
                    batch.push({
                        student_id: "std" + String(nextId++).padStart(3, '0'),
                        college_id: userId,
                        student_name: row[nameIdx],
                        grade: row[gradeIdx] || '',
                        academic_year: row[yearIdx] || window.WMSSettings?.get('academic_year')?.replace('-','/') || ''
                    });
                }

                if(batch.length > 0) {
                    const { error } = await supabase.from('students').insert(batch);
                    if(error) throw error;
                    showToast(`Imported ${batch.length} students!`);
                    await loadStudents();
                }
            } catch (err) {
                showToast("Import failed!", "error");
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    });

    // --- BULK LOGIC ---
    const selectAll = document.getElementById('selectAllStudents');
    const bulkBar = document.getElementById('bulk-action-bar');
    const bulkCount = document.getElementById('bulk-selected-count');

    function updateBulk() {
        const checked = document.querySelectorAll('.student-cb:checked');
        if (checked.length > 0) {
            bulkBar.classList.remove('hidden');
            bulkBar.classList.add('flex');
            bulkCount.textContent = checked.length;
        } else {
            bulkBar.classList.add('hidden');
            bulkBar.classList.remove('flex');
            if(selectAll) selectAll.checked = false;
        }
    }

    selectAll?.addEventListener('change', (e) => {
        document.querySelectorAll('.student-cb').forEach(cb => cb.checked = e.target.checked);
        updateBulk();
    });

    tbody?.addEventListener('change', (e) => {
        if (e.target.classList.contains('student-cb')) updateBulk();
    });

    searchInput?.addEventListener('input', loadStudents);
    filterStage?.addEventListener('change', loadStudents);

    sortBtn?.addEventListener('click', () => {
        sortAscending = !sortAscending;
        sortIcon.textContent = sortAscending ? 'arrow_upward' : 'arrow_downward';
        sortIcon.classList.remove('opacity-40');
        sortIcon.classList.add('text-primary');
        loadStudents();
    });

    async function applyBulk(action) {
        const targetYear = document.getElementById('target-academic-year').value;
        if (!targetYear && action !== 'graduate') return showToast("Select Target Year", "error");
        
        const ids = Array.from(document.querySelectorAll('.student-cb:checked')).map(cb => cb.value);
        if (!confirm(`Apply to ${ids.length} students?`)) return;

        try {
            const { data } = await supabase.from('students').select('*').in('student_id', ids);
            const updates = data.map(s => {
                let grade = s.grade;
                let status = s.status || 'Active';
                if (action === 'promote') {
                    const g = ["المرحلة الاولى", "المرحلة الثانية", "المرحلة الثالثة", "المرحلة الرابعة"];
                    const i = g.findIndex(x => s.grade?.includes(x));
                    if(i !== -1 && i < g.length-1) grade = s.grade.replace(g[i], g[i+1]);
                    else if(i === g.length-1) status = 'Graduated';
                }
                if (action === 'graduate') status = 'Graduated';
                return { ...s, grade, academic_year: targetYear || s.academic_year, status };
            });

            for(const up of updates) {
                await supabase.from('students').update({ grade: up.grade, academic_year: up.academic_year, status: up.status }).eq('student_id', up.student_id);
            }
            showToast("Bulk action completed!");
            updateBulk();
            await loadStudents();
        } catch (err) {
            showToast("Bulk failed!", "error");
        }
    }

    document.getElementById('btn-bulk-graduate')?.addEventListener('click', () => applyBulk('graduate'));

    // --- BACK TO TOP LOGIC ---
    const backToTopBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
            backToTopBtn.classList.add('opacity-100', 'pointer-events-auto');
        } else {
            backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
            backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto');
        }
    });

    backToTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- REAL-TIME SETTINGS SYNC ---
    window.addEventListener('wms-settings-update', (e) => {
        if (e.detail.k === 'academic_year') {
            if (studentAY) {
                studentAY.value = e.detail.v; // Now standardized to slash
            }
            loadStudents();
        }
    });
});


