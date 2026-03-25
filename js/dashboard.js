// sys-wms-web/js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.sbClient;
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }

    const kpiTotalWorkers = document.getElementById('kpi-total-students');
    const kpiPresentToday = document.getElementById('kpi-present-today');
    const kpiAdvancesTotal = document.getElementById('kpi-advances-total');

    try {
        // Fetch Total Workers
        const { count: studentsCount, error: wError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });
        
        if (wError) throw wError;
        if (kpiTotalWorkers) kpiTotalWorkers.textContent = studentsCount || 0;

        // Fetch Present Today (Local Timezone Safe)
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const { count: presentCount, error: pError } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .in('status', ['Present', 'Active Shift', 'Completed']);
        
        if (pError) throw pError;
        if (kpiPresentToday) kpiPresentToday.textContent = presentCount || 0;

        // Fetch Total Payroll (Sum of daily salaries of all students)
        const kpiTotalPayroll = document.getElementById('kpi-total-professors');
         = await supabase.from('students').select('salary');
        let totalPayroll = 0;
        if(wData) {
            wData.forEach(w => {
                totalPayroll += (w.salary || 0);
            });
        }
        if(kpiTotalPayroll) 

    } catch (err) {
        console.error("Error loading dashboard metrics:", err);
        if (kpiTotalWorkers) kpiTotalWorkers.textContent = "Err";
        if (kpiPresentToday) kpiPresentToday.textContent = "Err";
        const kpiTotalPayrollErr = document.getElementById('kpi-total-professors');
        if (kpiTotalPayrollErr) kpiTotalPayrollErr.textContent = "Err";
    }
});
