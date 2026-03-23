// sys-wms-web/js/advances.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    const tbody = document.getElementById('advances-tbody');
    const workerSearchInput = document.getElementById('worker-search-input');
    const workerSearchResults = document.getElementById('worker-search-results');
    const hiddenWorkerId = document.getElementById('advance-worker-id');
    const amountInput = document.getElementById('advance-amount');
    const reasonInput = document.getElementById('advance-reason');
    const form = document.getElementById('advance-form');

    if (!supabase) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-error font-bold tracking-widest uppercase">Supabase Not Initialized</td></tr>`;
        return;
    }

    let searchTimeout = null;
    let advancesList = [];

    // Helper: Localization
    function getLang() { return window.WMSSettings ? window.WMSSettings.get('lang') : 'en'; }
    function t(key) {
        const lang = getLang();
        const dict = window.WMS_I18N || {};
        return (dict[lang] && dict[lang][key]) || key;
    }
    function applyLocalization() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const k = el.getAttribute('data-i18n');
            el.textContent = t(k);
        });
    }

    // --- Search Logic ---
    workerSearchInput?.addEventListener('input', (e) => {
        const term = e.target.value.trim();
        clearTimeout(searchTimeout);
        if (!term) {
            workerSearchResults.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            // Search by Name or ID
            let query = supabase.from('workers').select('id, name');
            
            const isNumerical = /^\d+$/.test(term);
            if (isNumerical) {
                query = query.or(`id.eq.${parseInt(term)},name.ilike.%${term}%`);
            } else {
                query = query.ilike('name', `%${term}%`);
            }

            const { data, error } = await query.limit(8);
            
            if (error) {
                console.error("Search error:", error);
                return;
            }

            if (data && data.length > 0) {
                workerSearchResults.innerHTML = data.map(w => `
                    <div class="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex items-center justify-between group/item" onclick="selectWorker(${w.id}, '${w.name.replace(/'/g, "\\'")}')">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-slate-900">${w.name}</span>
                            <span class="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: #W${w.id.toString().padStart(4, '0')}</span>
                        </div>
                        <span class="material-symbols-outlined text-slate-300 group-hover/item:text-primary transition-colors text-lg">check_circle</span>
                    </div>
                `).join('');
                workerSearchResults.classList.remove('hidden');
            } else {
                workerSearchResults.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-bold tracking-widest uppercase">No matches found</div>`;
                workerSearchResults.classList.remove('hidden');
            }
        }, 300);
    });

    // Handle Selection
    window.selectWorker = (id, name) => {
        hiddenWorkerId.value = id;
        workerSearchInput.value = name;
        workerSearchResults.classList.add('hidden');
        workerSearchInput.classList.add('border-primary/50', 'bg-primary/5');
    };

    // Close results on click outside
    document.addEventListener('click', (e) => {
        if (!workerSearchInput.contains(e.target) && !workerSearchResults.contains(e.target)) {
            workerSearchResults.classList.add('hidden');
        }
    });

    // --- Data Loading ---
    async function loadAdvancesData() {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-400 font-bold tracking-widest"><span class="material-symbols-outlined animate-spin text-3xl mb-2">sync</span><br>Fetching Records...</td></tr>`;
        
        try {
            const { data, error } = await supabase.from('cash_advance').select('*').order('id', {ascending: false});
            if (error) throw error;
            advancesList = data || [];
            renderAdvancesTable();
            applyLocalization();
        } catch (err) {
            console.error("Load Error:", err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-error font-bold uppercase tracking-widest">Database Sync Failed</td></tr>`;
        }
    }

    function renderAdvancesTable() {
        if (!tbody) return;
        if (advancesList.length > 0) {
            tbody.innerHTML = '';
            advancesList.forEach(adv => {
                const tr = document.createElement('tr');
                tr.className = "group hover:bg-slate-50/50 transition-colors border-b border-slate-50";
                
                const amount = parseFloat(adv.amount || 0);
                const date = adv.date ? new Date(adv.date).toLocaleDateString(getLang() === 'ar' ? 'ar-EG' : 'en-GB') : '-';

                tr.innerHTML = `
                    <td class="px-6 py-4 text-[10px] font-mono text-slate-400 text-start group-hover:text-primary transition-colors">#ADV${adv.id.toString().padStart(4, '0')}</td>
                    <td class="px-6 py-4 font-bold text-sm text-slate-900 text-start">${adv.worker_name}</td>
                    <td class="px-6 py-4 text-sm text-slate-500 font-medium text-start">${date}</td>
                    <td class="px-6 py-4 text-sm font-black text-emerald-600 text-start">${amount.toLocaleString()} <span class="text-[10px] font-bold text-slate-400">IQD</span></td>
                    <td class="px-6 py-4 text-xs text-slate-500 italic text-start">${adv.reason || '-'}</td>
                    <td class="px-6 py-4 text-end">
                        <button onclick="deleteAdvance(${adv.id})" class="p-2 text-slate-300 hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Delete">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-300 font-bold tracking-widest uppercase">No Records Found</td></tr>`;
        }
    }

    // --- Actions ---
    window.deleteAdvance = async (id) => {
        if (!confirm(t('delete-advance-confirm'))) return;
        try {
            await supabase.from('cash_advance').delete().eq('id', id);
            loadAdvancesData();
        } catch (err) { alert(err.message); }
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const wId = hiddenWorkerId.value;
        const amt = amountInput.value;
        const res = reasonInput.value;
        const wName = workerSearchInput.value;
        
        if (!wId) { 
            alert(t('select-worker'));
            workerSearchInput.focus();
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        const oldHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span>`;

        try {
            const { error } = await supabase.from('cash_advance').insert([{
                worker_id: wId,
                worker_name: wName,
                amount: amt,
                reason: res,
                date: new Date().toISOString().split('T')[0]
            }]);
            if (error) throw error;
            
            form.reset();
            hiddenWorkerId.value = '';
            workerSearchInput.classList.remove('border-primary/50', 'bg-primary/5');
            loadAdvancesData();
        } catch (err) {
            alert("Submission error: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = oldHtml;
        }
    });

    // Sync theme/lang
    window.WMSSettings?.onUpdate?.(() => {
        applyLocalization();
        renderAdvancesTable();
    });

    // Init
    loadAdvancesData();
});
