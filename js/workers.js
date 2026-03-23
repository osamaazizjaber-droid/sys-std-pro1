document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase from global reference found in config.js
    const supabase = window.sbClient;
    if (!supabase) {
        console.error("Supabase client not found!");
        return;
    }

    const tbody = document.getElementById('workers-tbody');
    const kpiTotalWorkers = document.getElementById('kpi-total-workers');
    
    const photoInput = document.getElementById('worker-photo-input');
    const photoPreview = document.getElementById('worker-photo-preview');
    const photoIcon = document.getElementById('photo-placeholder-icon');
    
    const inputName = document.getElementById('worker-name');
    const inputPos = document.getElementById('worker-position');
    const inputSal = document.getElementById('worker-salary');
    const btnSubmit = document.getElementById('btn-submit-worker');

    let currentPhotoBase64 = "";

    // Load initial data
    await loadWorkers();

    // 1. Photo selection & scaling logic
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Resize image dynamically (faster storage)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 256;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to compressed jpeg base64
                currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                
                // Show in UI
                photoIcon.classList.add('hidden');
                photoPreview.src = currentPhotoBase64;
                photoPreview.classList.remove('hidden');
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });

    // 2. Submit Worker
    btnSubmit.addEventListener('click', async () => {
        const name = inputName.value.trim();
        const pos = inputPos.value;
        const sal = parseFloat(inputSal.value);

        if (!name || isNaN(sal)) {
            alert("Please provide a valid Name and numeric Salary!");
            return;
        }

        const btnText = btnSubmit.textContent;
        btnSubmit.textContent = "Saving...";
        btnSubmit.disabled = true;

        try {
            const payload = {
                name: name,
                position: pos,
                salary: sal,
                photo_url: currentPhotoBase64
            };

            const { data, error } = await supabase.from('workers').insert([payload]);
            if (error) throw error;

            alert("Worker profile submitted successfully!");
            
            // clear form
            inputName.value = '';
            inputPos.value = '';
            inputSal.value = '';
            currentPhotoBase64 = "";
            photoInput.value = "";
            photoPreview.classList.add('hidden');
            photoIcon.classList.remove('hidden');

            await loadWorkers(); // Reload
        } catch (err) {
            console.error(err);
            alert("Error adding worker: " + err.message);
        } finally {
            btnSubmit.textContent = btnText;
            btnSubmit.disabled = false;
        }
    });

    // 3. Fetch and Render Table Data
    async function loadWorkers() {
        try {
            const { data, error, count } = await supabase
                .from('workers')
                .select('*', { count: 'exact' })
                .order('id', { ascending: false });

            if (error) throw error;

            // Updated Stats KPI
            if (kpiTotalWorkers) kpiTotalWorkers.textContent = count || 0;

            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500">No workforce data available. Register a worker above.</td></tr>`;
                return;
            }

            data.forEach(w => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition-all group border-b border-transparent hover:border-slate-100 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_-5px_rgba(0,0,0,0.06)] relative z-0 hover:z-10";

                const formattedSal = w.salary ? parseFloat(w.salary).toLocaleString() : '0';
                const photoSrc = w.photo_url && w.photo_url.startsWith('data:image') 
                    ? w.photo_url 
                    : 'https://cdn-icons-png.flaticon.com/512/847/847969.png'; // default avatar placeholder

                tr.innerHTML = `
                    <td class="px-6 py-4 text-slate-500 font-mono text-sm">W-${w.id || '---'}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-lg bg-slate-200 bg-cover bg-center border border-slate-100 shadow-sm" style="background-image: url('${photoSrc}');"></div>
                            <span class="text-slate-900 font-bold group-hover:text-primary transition-colors">${w.name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-slate-600 text-sm">${w.position || 'Unassigned'}</td>
                    <td class="px-6 py-4 text-slate-900 font-mono text-right text-sm">${formattedSal}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button class="p-2 text-slate-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all edit-btn" data-id="${w.id}">
                                <span class="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all delete-btn" data-id="${w.id}">
                                <span class="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Attach delete events
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm("Remove this worker profile?")) {
                        await deleteWorker(id);
                    }
                });
            });

            // Attach edit events
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    await window.openEditModal(id);
                });
            });

        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-4">Failed to load data</td></tr>`;
        }
    }

    // Delete Logic
    async function deleteWorker(id) {
        try {
            const { error } = await supabase.from('workers').delete().eq('id', id);
            if (error) throw error;
            await loadWorkers();
        } catch(error) {
            console.error(error);
            alert("Error deleting worker: " + error.message);
        }
    }

    // --- EDIT MODAL LOGIC ---
    const editModal = document.getElementById('edit-worker-modal');
    const editPhotoInput = document.getElementById('edit-photo-input');
    const editPhotoPreview = document.getElementById('edit-photo-preview');
    const editInputId = document.getElementById('edit-worker-id');
    const editInputName = document.getElementById('edit-worker-name');
    const editInputPos = document.getElementById('edit-worker-position');
    const editInputSal = document.getElementById('edit-worker-salary');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const btnSaveEdit = document.getElementById('btn-save-edit');

    let editPhotoBase64 = "";

    function closeEditModal() {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeEditModal);
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeEditModal);

    window.openEditModal = async function(id) {
        try {
            const { data, error } = await supabase.from('workers').select('*').eq('id', id).single();
            if (error) throw error;

            editInputId.value = data.id;
            editInputName.value = data.name || '';
            editInputPos.value = data.position || '';
            editInputSal.value = data.salary || '';
            
            if (data.photo_url) {
                editPhotoPreview.src = data.photo_url;
                editPhotoBase64 = data.photo_url;
            } else {
                editPhotoPreview.src = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
                editPhotoBase64 = "";
            }

            editModal.classList.remove('hidden');
            editModal.classList.add('flex');
        } catch (err) {
            console.error("Error opening edit modal:", err);
            alert("Failed to load worker data!");
        }
    }

    if (editPhotoInput) {
        editPhotoInput.addEventListener('change', function(e) {
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
                    editPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    editPhotoPreview.src = editPhotoBase64;
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        });
    }

    if (btnSaveEdit) {
        btnSaveEdit.addEventListener('click', async () => {
            const id = editInputId.value;
            const name = editInputName.value.trim();
            const pos = editInputPos.value;
            const sal = parseFloat(editInputSal.value);

            if (!name || isNaN(sal)) {
                alert("Please provide a valid Name and numeric Salary!");
                return;
            }

            const btnText = btnSaveEdit.textContent;
            btnSaveEdit.textContent = "Saving...";
            btnSaveEdit.disabled = true;

            try {
                const payload = {
                    name: name,
                    position: pos,
                    salary: sal,
                    photo_url: editPhotoBase64
                };

                const { data, error } = await supabase.from('workers').update(payload).eq('id', id);
                if (error) throw error;

                closeEditModal();
                await loadWorkers(); // Refresh table
            } catch (err) {
                console.error("Error updating worker:", err);
                alert("Error updating worker: " + err.message);
            } finally {
                btnSaveEdit.textContent = btnText;
                btnSaveEdit.disabled = false;
            }
        });
    }

    // --- CSV EXPORT LOGIC ---
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', async () => {
            try {
                const { data, error } = await supabase.from('workers').select('*').order('id', { ascending: true });
                if (error) throw error;
                if (!data || data.length === 0) return alert("No data to export.");

                const headers = ["id", "name", "position", "salary", "reg_date", "status"];
                const csvRows = [headers.join(",")];
                
                data.forEach(row => {
                    const values = headers.map(header => {
                        let val = row[header] === null ? "" : String(row[header]);
                        // Escape quotes and wrap in quotes if contains comma
                        val = val.replace(/"/g, '""');
                        if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
                        return val;
                    });
                    csvRows.push(values.join(","));
                });

                const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', `workers_export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (err) {
                console.error("Export error:", err);
                alert("Export failed: " + err.message);
            }
        });
    }

    // --- CSV IMPORT LOGIC ---
    const importCsvFileInput = document.getElementById('import-csv-file');
    if (importCsvFileInput) {
        importCsvFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    const text = event.target.result;
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    if (lines.length < 2) return alert("CSV file seems empty or invalid.");

                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    const nameIdx = headers.indexOf('name');
                    const posIdx = headers.indexOf('position');
                    const salIdx = headers.indexOf('salary');
                    
                    if (nameIdx === -1 || salIdx === -1) {
                        return alert("Invalid CSV Headers. Expecting at least 'name' and 'salary'.");
                    }

                    const newWorkers = [];
                    for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',');
                        const name = cols[nameIdx]?.trim();
                        if (!name) continue;
                        
                        const salaryStr = cols[salIdx]?.trim().replace(/[^0-9.-]+/g,"");
                        const sal = parseFloat(salaryStr) || 0;
                        const pos = posIdx !== -1 ? cols[posIdx]?.trim() : '';

                        newWorkers.push({ name, position: pos, salary: sal });
                    }

                    if (newWorkers.length === 0) return alert("No valid workers found to import.");

                    if (confirm(`Found ${newWorkers.length} workers to import. Proceed?`)) {
                        const { error } = await supabase.from('workers').insert(newWorkers);
                        if (error) throw error;
                        alert("Successfully imported " + newWorkers.length + " workers!");
                        await loadWorkers();
                    }
                } catch (err) {
                    console.error("Import error:", err);
                    alert("Import failed: " + err.message);
                } finally {
                    importCsvFileInput.value = ''; // Reset input so it can be re-fired
                }
            };
            reader.readAsText(file);
        });
    }
});
