// sys-wms-web/js/attendance.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if(!supabase) {
        console.error("Supabase not initialized.");
        return;
    }

    const attDateInput = document.getElementById('attendance-date');
    const attBarcodeInput = document.getElementById('attendance-barcode');
    const tbody = document.getElementById('attendance-tbody');
    let attendanceList = [];
    let workersList = [];

    // Load workers for lookup
    const { data: wData } = await supabase.from('workers').select('id, name');
    if (wData) workersList = wData;

    // Init Date (Local Timezone Safe)
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    attDateInput.value = today;

    loadAttendanceData();

    attDateInput.addEventListener('change', loadAttendanceData);

    attBarcodeInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = attBarcodeInput.value.trim();
            if(!code) return;
            await processAttendanceScan(code);
            attBarcodeInput.value = '';
            attBarcodeInput.focus(); // Keep scanning active continuously
        }
    });

    async function processAttendanceScan(code) {
        let workerId = parseInt(code.replace(/\D/g, ''));
        let workerSearch = code;
        
        let worker = workersList.find(w => w.id === workerId || w.name.toLowerCase().includes(workerSearch.toLowerCase()));
        
        if (!worker) {
            const { data } = await supabase.from('workers').select('*').or(`id.eq.${workerId},name.ilike.%${workerSearch}%`).limit(1);
            if (data && data.length > 0) worker = data[0];
        }

        if(!worker) {
            alert(`Worker not found: ${code}`);
            return;
        }

        const scanDate = attDateInput.value;
        const scanTime = new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});

        try {
            const { data: existing } = await supabase.from('attendance')
                .select('*')
                .eq('worker_id', worker.id)
                .eq('date', scanDate);
                
            if (existing && existing.length > 0) {
                const record = existing[0];
                if (!record.check_out) {
                    // Completing Shift (Check Out)
                    await supabase.from('attendance').update({ 
                        status: 'Completed', 
                        check_out: scanTime
                    }).eq('id', record.id);
                } else {
                    alert(`${worker.name} has already checked out for today!`);
                }
            } else {
                // Starting Shift (Check In)
                await supabase.from('attendance').insert([{
                    worker_id: worker.id,
                    worker_name: worker.name,
                    date: scanDate,
                    status: 'Active Shift',
                    check_in: scanTime,
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
        const scanDate = attDateInput.value;
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-text-muted-light">Loading...</td></tr>`;
        
        try {
            const { data, error } = await supabase.from('attendance').select('*').eq('date', scanDate).order('id', {ascending: false});
            if(error) throw error;
            attendanceList = data || [];
            renderAttendanceTable();
        } catch(err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error loading.</td></tr>`;
        }
    }

    function renderAttendanceTable() {
        if(attendanceList.length > 0) {
            tbody.innerHTML = '';
            attendanceList.forEach(att => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/50 transition-colors group";
                
                // Formatted Worker ID
                const formattedId = `W-${att.worker_id.toString().padStart(3, '0')}`;

                // Status Badge Logic
                let statusBadge = '';
                if(att.status === 'Active Shift' || att.status === 'Checked In') {
                    statusBadge = `
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span class="text-xs font-bold uppercase tracking-wide">Active</span>
                        </div>
                    `;
                } else {
                    statusBadge = `
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span class="text-xs font-bold uppercase tracking-wide">Completed</span>
                        </div>
                    `;
                }

                tr.innerHTML = `
                    <td class="px-6 py-4 text-sm font-bold text-slate-500">${formattedId}</td>
                    <td class="px-6 py-4 font-black text-sm text-slate-900">${att.worker_name}</td>
                    <td class="px-6 py-4 text-sm">${statusBadge}</td>
                    <td class="px-6 py-4 text-sm text-slate-700 font-bold">${att.check_in || '--:--'}</td>
                    <td class="px-6 py-4 text-sm text-slate-700 font-bold">${att.check_out || '--:--'}</td>
                    <td class="px-6 py-4 text-sm text-slate-500 font-bold">
                        <div class="flex items-center gap-1 opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <input type="number" 
                               value="${att.overtime || 0}" 
                               step="0.5" 
                               min="0"
                               onchange="updateOvertime(${att.id}, this.value)"
                               class="w-16 px-2 py-1.5 border border-slate-200 rounded text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface hover:bg-white transition-colors text-slate-700 font-bold shadow-sm">
                            <span class="text-xs text-slate-400 font-medium">h</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500 font-medium">${att.notes || '-'}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="deleteAttendance(${att.id})" class="p-1.5 text-slate-300 hover:text-error hover:bg-error/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete Log">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-16 text-center"><div class="flex flex-col items-center justify-center text-slate-300"><span class="material-symbols-outlined text-4xl mb-2">qr_code</span><p class="font-medium">No records logged for this date.</p></div></td></tr>`;
        }
        
        // Update record count if badge exists
        const countBadge = document.getElementById('log-count');
        if (countBadge) countBadge.textContent = attendanceList.length;
    }

    window.updateOvertime = async function(id, val) {
        let hrs = parseFloat(val) || 0;
        try {
            const { error } = await supabase.from('attendance').update({ overtime: hrs }).eq('id', id);
            if (error) throw error;
        } catch(err) {
            alert("Error updating overtime: " + err.message);
        }
    };

    window.deleteAttendance = async function(id) {
        if (confirm("Delete attendance record?")) {
            try {
                const { error } = await supabase.from('attendance').delete().eq('id', id);
                if (error) throw error;
                loadAttendanceData();
            } catch (err) {
                alert("Error deleting: " + err.message);
            }
        }
    };
});
