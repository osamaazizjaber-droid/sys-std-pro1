// sys-wms-web/js/reports.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if(!supabase) return;

    const btnRunReport = document.getElementById('btnRunReport');
    const btnPrintReport = document.getElementById('btnPrintReport');
    const repStartDate = document.getElementById('report-start-date');
    const repEndDate = document.getElementById('report-end-date');
    const tbody = document.getElementById('reports-tbody');
    const matrixHead = document.getElementById('matrix-head');
    const matrixTbody = document.getElementById('matrix-tbody');
    
    // Init dates to current month (up to today - properly formatted to Local Timezone)
    const dateNow = new Date();
    const todayStr = `${dateNow.getFullYear()}-${String(dateNow.getMonth()+1).padStart(2,'0')}-${String(dateNow.getDate()).padStart(2,'0')}`;
    const firstDay = `${dateNow.getFullYear()}-${String(dateNow.getMonth()+1).padStart(2,'0')}-01`;
    repStartDate.value = firstDay;
    repEndDate.value = todayStr;

    let workersList = [];
    const { data: wData } = await supabase.from('workers').select('*').order('id');
    if (wData) workersList = wData;

    btnRunReport.addEventListener('click', generateReport);
    
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
        // UI Feedback
        const lang = window.WMSSettings ? window.WMSSettings.get('lang') : 'en';
        const tTo = lang === 'ar' ? 'إلى' : 'to';
        const tIqd = lang === 'ar' ? 'د.ع' : 'IQD';
        const tHrs = lang === 'ar' ? 'ساعة' : 'hrs';
        
        const dateString = `<bdi>${sDate}</bdi> ${tTo} <bdi>${eDate}</bdi>`;

        document.getElementById('date-range-display').innerHTML = dateString;
        const kpiDateRangeEl = document.getElementById('kpi-date-range');
        if(kpiDateRangeEl) kpiDateRangeEl.innerHTML = dateString;
        const printPeriodEl = document.getElementById('print-period-display');
        if(printPeriodEl) printPeriodEl.innerHTML = dateString;
        
        tbody.innerHTML = `<tr><td colspan="11" class="p-12 text-center"><span class="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">sync</span><br>Parsing Database...</td></tr>`;
        matrixTbody.innerHTML = '';

        try {
            // Fetch relevant slice
            const { data: attData } = await supabase.from('attendance')
                .select('*').gte('date', sDate).lte('date', eDate);
            
            const { data: advData } = await supabase.from('cash_advance')
                .select('*').gte('date', sDate).lte('date', eDate);
            
            let sumGross = 0;
            let sumNet = 0;
            let sumAdvs = 0;
            let sumOt = 0;

            tbody.innerHTML = '';

            // 1. Build Salary Report
            workersList.forEach(w => {
                const wAtt = (attData || []).filter(a => a.worker_id === w.id);
                const wAdv = (advData || []).filter(a => a.worker_id === w.id);
                
                // Days Present criteria (covers legacy "Present" + new "Active Shift" & "Completed")
                const daysPresent = wAtt.filter(a => !!a.status && a.status !== 'Absent').length;
                
                // Compute Overtime mathematically
                const totalOtHours = wAtt.reduce((sum, a) => sum + parseFloat(a.overtime || 0), 0);
                
                // Financials Math (Standard Base 8 Hr shift implied)
                const dailyRate = parseFloat(w.salary || 0);
                const hourlyRate = dailyRate / 8.0;
                
                const regPay = daysPresent * dailyRate;
                const otPay = totalOtHours * hourlyRate * 1.0; // Overtime pays standard straight-time rate (1x)
                const grossPay = regPay + otPay;
                
                const advancesSum = wAdv.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
                const netPay = grossPay - advancesSum;

                if (daysPresent > 0 || advancesSum > 0 || totalOtHours > 0) {
                    sumGross += grossPay;
                    sumNet += netPay;
                    sumAdvs += advancesSum;
                    sumOt += totalOtHours;
                    
                    const tr = document.createElement('tr');
                    tr.className = "hover:bg-slate-50 transition-colors";
                    tr.innerHTML = `
                        <td class="p-4 text-xs font-mono text-slate-400">#W${w.id.toString().padStart(4, '0')}</td>
                        <td class="p-4 font-bold text-sm text-slate-900">${w.name}</td>
                        <td class="p-4 text-xs text-slate-600">${w.position || '-'}</td>
                        <td class="p-4 text-xs font-bold text-slate-700">${dailyRate.toLocaleString()} ${tIqd}</td>
                        <td class="p-4 text-xs font-black text-primary">${daysPresent}</td>
                        <td class="p-4 text-xs font-bold text-slate-700">${totalOtHours.toFixed(1)} ${tHrs}</td>
                        <td class="p-4 text-xs text-end font-medium text-slate-600">${regPay.toLocaleString()}</td>
                        <td class="p-4 text-xs text-end font-bold text-emerald-600">+${otPay.toLocaleString()}</td>
                        <td class="p-4 text-xs text-end font-black text-slate-800">${grossPay.toLocaleString()}</td>
                        <td class="p-4 text-xs text-end font-medium text-error">${advancesSum > 0 ? '-' + advancesSum.toLocaleString() : '-'}</td>
                        <td class="p-4 text-sm text-end font-black text-on-surface">${netPay.toLocaleString()} ${tIqd}</td>
                    `;
                    tbody.appendChild(tr);
                }
            });

            if(tbody.innerHTML === '') {
                tbody.innerHTML = `<tr><td colspan="11" class="p-12 text-center text-slate-400 font-bold tracking-widest">NO DATA FOR INTERVAL</td></tr>`;
            }

            // Update Top level KPI Blocks
            document.getElementById('kpi-gross-pay').textContent = `${sumGross.toLocaleString()} ${tIqd}`;
            document.getElementById('kpi-net-pay').textContent = `${sumNet.toLocaleString()} ${tIqd}`;
            document.getElementById('kpi-ot-hrs').textContent = `${sumOt.toFixed(1)} ${tHrs}`;
            document.getElementById('kpi-advances').textContent = `${sumAdvs.toLocaleString()} ${tIqd}`;


            // 2. Build Matrix Layout
            const datesList = getDatesInRange(sDate, eDate);
            
            const tWorkerName = window.WMS_I18N[lang]['worker-name'] || 'Worker Name';
            const tTotalLbl = window.WMS_I18N[lang]['total'] || 'Total';
            
            // Build Matrix Head
            let headHtml = `<th class="p-4 text-[10px] font-black uppercase text-slate-800 tracking-tighter text-start sticky start-0 bg-slate-100 z-10 w-48 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">${tWorkerName}</th>`;
            datesList.forEach(d => {
                const dayStr = d.split('-')[2]; // Extract DD
                headHtml += `<th class="p-2 text-[10px] font-bold text-slate-400 w-10 min-w-[40px] border-s border-slate-200">${dayStr}</th>`;
            });
            headHtml += `<th class="p-4 text-[10px] font-black uppercase text-slate-800 tracking-tighter border-s border-slate-200">${tTotalLbl}</th>`;
            matrixHead.innerHTML = headHtml;

            // Build Matrix Body
            matrixTbody.innerHTML = '';
            workersList.forEach(w => {
                const wAtt = (attData || []).filter(a => a.worker_id === w.id);
                // Skip rendering rows with absolutely no attendance context
                if(wAtt.length === 0) return;

                const tr = document.createElement('tr');
                tr.className = "group hover:bg-slate-50 transition-colors";
                
                let rowHtml = `<td class="p-4 text-sm font-bold text-slate-800 text-start sticky start-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-e border-slate-100">${w.name}</td>`;
                
                let rowTotal = 0;
                datesList.forEach(d => {
                    const record = wAtt.find(a => a.date === d);
                    let cellContent = '<span class="material-symbols-outlined text-error text-lg" style="font-variation-settings: \\\'FILL\\\' 1;">cancel</span>'; // Default red absent
                    
                    if(record && record.status !== 'Absent') {
                        cellContent = '<span class="material-symbols-outlined text-emerald-500 text-lg" style="font-variation-settings: \\\'FILL\\\' 1;">check_circle</span>';
                        rowTotal++;
                    }
                    rowHtml += `<td class="p-2 text-xs border-s border-slate-100">${cellContent}</td>`;
                });
                
                rowHtml += `<td class="p-4 text-xs font-black text-primary border-s border-slate-200">${rowTotal}/${datesList.length}</td>`;
                tr.innerHTML = rowHtml;
                matrixTbody.appendChild(tr);
            });

            if(matrixTbody.innerHTML === '') {
                matrixTbody.innerHTML = `<tr><td colspan="${datesList.length + 2}" class="p-12 text-center text-slate-400 font-bold tracking-widest">NO MATRIX DATA FOR INTERVAL</td></tr>`;
            }



        } catch (err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="11" class="p-12 text-center text-error font-bold">Error compiling metrics stream. View console.</td></tr>`;
        }
    }

    // Connect print hook
    btnPrintReport.addEventListener('click', () => {
        window.print();
    });

    // Auto-compute baseline view on load completion
    generateReport();
});
