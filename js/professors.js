// sys-wms-web/js/professors.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const userId = user.id;

    // DOM Elements
    const profForm = document.getElementById('professor-form');
    const profTableBody = document.getElementById('professors-tbody');
    const kpiTotalProfessors = document.getElementById('kpi-total-professors');
    const searchInput = document.getElementById('search-professors');
    const filterStage = document.getElementById('filter-stage');
    const selectAllCbs = document.getElementById('selectAllProfessors');
    const bulkBar = document.getElementById('bulk-action-bar');
    const bulkCount = document.getElementById('bulk-selected-count');
    const btnBulkDelete = document.getElementById('btn-bulk-delete');

    // Onboarding Elements
    const photoInput = document.getElementById('prof-photo-input');
    const photoPreview = document.getElementById('photo-preview-img');
    const photoPlaceholder = document.getElementById('photo-placeholder-icon');
    let currentPhotoBase64 = null;

    // Edit Modal Elements
    const editProfId = document.getElementById('edit-prof-id');
    const editProfName = document.getElementById('edit-prof-name');
    const editProfSubject = document.getElementById('edit-prof-subject');
    const editProfStage = document.getElementById('edit-prof-stage');
    const editPhotoInput = document.getElementById('edit-photo-input');
    const editPhotoPreview = document.getElementById('edit-photo-preview');
    let editPhotoBase64 = null;

    // State
    let professorsList = [];
    let currentSort = { column: 'prof_id', ascending: false };

    // --- Toast Notification ---
    function showToast(msg, icon = 'check_circle', color = '#10b981') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        const toastIcon = document.getElementById('toast-icon');
        if (!toast || !toastMsg || !toastIcon) return;
        toastMsg.textContent = msg;
        toastIcon.textContent = icon;
        toastIcon.style.color = color;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- ID Copy Utility ---
    window.copyId = function(id, el) {
        navigator.clipboard.writeText(id).then(() => {
            const originalHTML = el.innerHTML;
            const icon = el.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = 'check';
            showToast("Copied Professor ID: " + id);
            setTimeout(() => {
                if (icon) icon.textContent = 'content_copy';
            }, 2000);
        });
    };

    // --- Photo Handling ---
    async function scaleImage(base64, size = 256) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = base64;
        });
    }

    photoInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (re) => {
                currentPhotoBase64 = await scaleImage(re.target.result);
                photoPreview.src = currentPhotoBase64;
                photoPreview.classList.remove('hidden');
                photoPlaceholder.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    editPhotoInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (re) => {
                editPhotoBase64 = await scaleImage(re.target.result);
                editPhotoPreview.src = editPhotoBase64;
                editPhotoPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Load Data ---
    async function loadProfessors() {
        try {
            const { data, error } = await supabase
                .from('professors')
                .select('*')
                .eq('college_id', userId)
                .order(currentSort.column, { ascending: currentSort.ascending });

            if (error) throw error;
            professorsList = data || [];
            updateKPIs();
            renderTable();
        } catch (err) {
            console.error("Error loading Professors:", err);
            profTableBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-red-500 font-bold">Failed to load database.</td></tr>`;
        }
    }

    function updateKPIs() {
        if (kpiTotalProfessors) kpiTotalProfessors.textContent = professorsList.length;
    }

    function renderTable() {
        const query = searchInput?.value.toLowerCase() || '';
        const stageValue = filterStage?.value || 'all';

        const filtered = professorsList.filter(p => {
            const matchesSearch = (p.prof_name || '').toLowerCase().includes(query) || (p.subject || '').toLowerCase().includes(query) || (p.prof_id || '').toLowerCase().includes(query);
            const matchesStage = stageValue === 'all' || p.teaching_stage === stageValue;
            return matchesSearch && matchesStage;
        });

        profTableBody.innerHTML = '';
        if (filtered.length === 0) {
            profTableBody.innerHTML = `<tr><td colspan="6" class="p-16 text-center text-slate-400 font-medium italic">No professors found matching criteria.</td></tr>`;
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center">
                    <input type="checkbox" class="wms-checkbox mx-auto prof-cb" data-id="${p.prof_id}">
                </td>
                <td class="text-xs font-mono font-bold text-slate-400">
                    <div class="flex items-center gap-1.5 group/id cursor-pointer" onclick="copyId('${p.prof_id}', this)">
                        <span>${p.prof_id}</span>
                        <span class="material-symbols-outlined text-[14px] opacity-0 group-hover/id:opacity-100 transition-opacity text-primary">content_copy</span>
                    </div>
                </td>
                <td>
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                            <img src="${p.photo_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSI1MCUiIHk9IjU0JSIgZm9udC1mYW1pbHk9Ik1hdGVyaWFsIFN5bWJvbHMgT3V0bGluZWQiIHNpemU9IjIwIiBmaWxsPSIjY2JkNWUxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5wZXJzb248L3RleHQ+PC9zdmc+'}" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <p class="font-bold text-slate-800 text-sm">${p.prof_name}</p>
                            <p class="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <span class="material-symbols-outlined text-[12px]">verified</span> Active Staff
                            </p>
                        </div>
                    </div>
                </td>
                <td><span class="text-xs font-bold text-slate-600">${p.subject || 'N/A'}</span></td>
                <td>
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                        ${p.teaching_stage || 'General'}
                    </span>
                </td>
                <td class="text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="openEditModal('${p.prof_id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all" title="Edit">
                            <span class="material-symbols-outlined text-[18px]">edit_note</span>
                        </button>
                        <button onclick="deleteProf('${p.prof_id}')" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            `;
            profTableBody.appendChild(tr);
        });

        // Re-attach event listeners for checkboxes
        document.querySelectorAll('.prof-cb').forEach(cb => {
            cb.addEventListener('change', updateBulk);
        });
    }

    // --- Bulk Action System ---
    function updateBulk() {
        const checked = document.querySelectorAll('.prof-cb:checked');
        if (checked.length > 0) {
            bulkBar.classList.remove('hidden');
            bulkBar.classList.add('flex');
            bulkCount.textContent = checked.length;
        } else {
            bulkBar.classList.add('hidden');
            bulkBar.classList.remove('flex');
            if (selectAllCbs) selectAllCbs.checked = false;
        }
    }

    selectAllCbs?.addEventListener('change', (e) => {
        document.querySelectorAll('.prof-cb').forEach(cb => cb.checked = e.target.checked);
        updateBulk();
    });

    btnBulkDelete?.addEventListener('click', async () => {
        const selectedIds = Array.from(document.querySelectorAll('.prof-cb:checked')).map(cb => cb.dataset.id);
        if (selectedIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} professor(s)?`)) return;

        try {
            const { error } = await supabase.from('professors').delete().in('prof_id', selectedIds).eq('college_id', userId);
            if (error) throw error;
            showToast(`Successfully deleted ${selectedIds.length} professors`, 'delete', '#ef4444');
            loadProfessors();
            updateBulk();
        } catch (err) {
            alert(err.message);
        }
    });

    // --- CRUD Actions ---
    window.deleteProf = async function(id) {
        if (!confirm("Remove this professor?")) return;
        try {
            const { error } = await supabase.from('professors').delete().eq('prof_id', id).eq('college_id', userId);
            if (error) throw error;
            showToast("Professor removed successfully");
            loadProfessors();
        } catch (err) { alert(err.message); }
    };

    profForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prof-name-input').value.trim();
        const subject = document.getElementById('prof-subject-input').value.trim();
        const stage = document.getElementById('prof-stage-input').value;

        if (!name || !subject || !stage) {
            showToast("Please fill all required fields", "warning", "#f49000");
            return;
        }

        const btnSave = document.getElementById('btn-save-professor');
        const originalContent = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> Working...`;

        try {
            const payload = {
                prof_id: "PRF-" + Date.now(),
                college_id: userId,
                prof_name: name,
                subject: subject,
                teaching_stage: stage,
                photo_url: currentPhotoBase64,
                status: 'Active'
            };

            const { error } = await supabase.from('professors').insert([payload]);
            if (error) throw error;

            showToast("Professor registered successfully!");
            profForm.reset();
            currentPhotoBase64 = null;
            photoPreview.classList.add('hidden');
            photoPlaceholder.classList.remove('hidden');
            loadProfessors();
        } catch (err) {
            alert(err.message);
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalContent;
        }
    });

    // --- Search & Filter ---
    searchInput?.addEventListener('input', renderTable);
    filterStage?.addEventListener('change', renderTable);

    // --- Edit Modal ---
    window.openEditModal = async function(id) {
        const prof = professorsList.find(p => p.prof_id === id);
        if (!prof) return;

        editProfId.value = prof.prof_id;
        editProfName.value = prof.prof_name || '';
        editProfSubject.value = prof.subject || '';
        editProfStage.value = prof.teaching_stage || '';
        
        editPhotoBase64 = prof.photo_url;
        if (editPhotoBase64) {
            editPhotoPreview.src = editPhotoBase64;
            editPhotoPreview.classList.remove('hidden');
        } else {
            editPhotoPreview.classList.add('hidden');
        }

        if (window.showEditModal) window.showEditModal();
    };

    document.getElementById('btn-save-edit')?.addEventListener('click', async () => {
        const id = editProfId.value;
        const name = editProfName.value.trim();
        const subject = editProfSubject.value.trim();
        const stage = editProfStage.value;

        if (!name || !subject || !stage) {
            showToast("Required fields missing", "warning", "#f49000");
            return;
        }

        try {
            const updateData = {
                prof_name: name,
                subject: subject,
                teaching_stage: stage,
                photo_url: editPhotoBase64
            };

            const { error } = await supabase.from('professors').update(updateData).eq('prof_id', id).eq('college_id', userId);
            if (error) throw error;

            showToast("Changes saved successfully");
            if (window.hideEditModal) window.hideEditModal();
            loadProfessors();
        } catch (err) {
            alert(err.message);
        }
    });

    // --- CSV Handling ---
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        if (professorsList.length === 0) return;
        let csvContent = "data:text/csv;charset=utf-8,Prof ID,Name,Subject,Teaching Stage,Status\n";
        professorsList.forEach(p => {
            csvContent += `"${p.prof_id}","${p.prof_name}","${p.subject}","${p.teaching_stage}","${p.status}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `professors_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('import-csv-file')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(event) {
            const csv = event.target.result;
            const lines = csv.split('\n');
            const newProfs = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length >= 2) {
                    newProfs.push({
                        prof_id: cols[0].replace(/"/g, '') || "PRF-" + Date.now() + i,
                        college_id: userId,
                        prof_name: cols[1].replace(/"/g, '') || 'Imported Prof',
                        subject: (cols[2] || '').replace(/"/g, ''),
                        teaching_stage: (cols[3] || '').replace(/"/g, ''),
                        status: 'Active'
                    });
                }
            }
            if (newProfs.length > 0) {
                const { error } = await supabase.from('professors').insert(newProfs);
                if (error) alert("Import partial failure: " + error.message);
                else {
                    showToast(`Imported ${newProfs.length} professors successfully`);
                    loadProfessors();
                }
            }
        };
        reader.readAsText(file);
    });

    // --- Initial Load ---
    loadProfessors();
});
