/**
 * SYS STD Pro — Global Settings Engine v8.3
 * Features: Restored Full Translation Dictionary + Global Font Force + Singleton Guard
 * FIXED: Exposed FONT_URLS and applyT to global scope for settings.html compatibility
 */
if (!window.WMS_SETTINGS_LOADED) {
  window.WMS_SETTINGS_LOADED = true;

  (function () {
    const ROOT = document.documentElement;
    const DEFAULTS = { theme: 'forge', dark: 'false', lang: 'en', font: 'Inter', academic_year: '2025/2026', font_scale: '100' };

    // Normalizes "2024-2025" to "2024/2025" for system consistency
    function normalizeAY(val) {
      if (!val) return val;
      return val.replace('-', '/');
    }

    window.WMS_I18N = {
      en: {
        'scanner-setup-title': 'Mobile Scanner Setup',
        'scanner-setup-desc': 'Use this secure College Code to link smartphone to live attendance scanner.',
        'open-scanner': 'Open Scanner App',
        'college-code': 'College Code',
        'company-code': 'College Code',
        'settings-desc': 'Customize the appearance and language of SYS STD Pro.',
        'language-section': 'Language',
        'lang-en': 'English',
        'lang-en-desc': 'Left-to-right layout',
        'lang-ar': 'العربية',
        'lang-ar-desc': 'Right-to-left layout',
        'font-section': 'Font',
        'appearance-section': 'Appearance',
        'mode-light': 'Light',
        'mode-light-desc': 'Clean and bright',
        'mode-dark': 'Dark',
        'mode-dark-desc': 'Easy on the eyes',
        'mode-auto': 'Auto',
        'mode-auto-desc': 'Follow system',
        'theme-section': 'Color Theme',
        'footer-text': 'SYS STD Pro © 2026 — All preferences saved automatically.',
        'latin': 'Latin',
        'arabic-latin': 'Arabic + Latin',
        'settings-title': 'Settings',
        'language-label': 'Language',
        'font-label': 'System Font',
        'dark-label': 'System Theme',
        'open-settings': 'Open Full Settings',
        'logout': 'Log Out',
        'absent': 'Absent',
        'accent-color': 'Accent Color',
        'actions': 'Actions',
        'active-roster': 'Active Students',
        'add-worker': 'Add Student',
        'advances': 'Professors',
        'professors': 'Professors',
        'advances-tab-title': 'Professor Management',
        'attendance': 'Attendance',
        'attendance-matrix': 'Academic Attendance Matrix',
        'attendance-sub': 'Manage Attendance',
        'attendance-title': 'Attendance Management',
        'auth-welcome': 'Welcome',
        'card-font': 'Card Font',
        'card-settings': 'Card Settings',
        'dashboard': 'Dashboard',
        'date': 'Date',
        'days': 'Days',
        'end-date': 'End Date',
        'export-csv': 'Export CSV',
        'export-pdf': 'Export PDF',
        'full-name': 'Full Name',
        'idcard-title': 'ID Cards',
        'idcards': 'ID Cards',
        'import-csv': 'Import CSV',
        'loading-db': 'Loading...',
        'notes': 'Notes',
        'present': 'Present',
        'present-today': 'Present Today',
        'preview-mode': 'Preview Mode',
        'print-report-title': 'Print Report',
        'quick-actions': 'Quick Actions',
        'records': 'Records',
        'reporting-period': 'Reporting Period',
        'reports': 'Reports',
        'reports-sub': 'View Reports',
        'reports-title': 'System Reports',
        'run-report': 'Compute Analytics',
        'search-workers': 'Search Students',
        'select-all': 'Select All',
        'settings': 'Settings',
        'start-date': 'Start Date',
        'status': 'Status',
        'submit': 'Submit',
        'todays-log': "Today's Log",
        'total-students': 'Total Students',
        'professors-tab-title': 'Professors Management',
        'teaching-stage': 'Grade / Stage',
        'add-professor': 'Add Professor',
        'professors-list': 'Professors Directory',
        'grade': 'Grade',
        'add-student': 'Add Student',
        'students-list': 'Students Directory',
        'at-risk-only': 'At-Risk (Low Attendance)',
        'ungrouped': 'Ungrouped (Flat List)',
        'group-by-grade': 'Group by Academic Stage',
        'worker-id': 'Student ID',
        'student-id': 'Student ID',
        'worker-name': 'Student Name',
        'student-name': 'Student Name',
        'students': 'Students',
        'workers-mgmt': 'Student Management',
        'no-students': 'No Students Registered',
        'all-subjects': 'All Subjects',
        'all-profs': 'All Professors',
        'total': 'Total',
        'time-logged': 'Time Logged',
        'prof-subject': 'Prof & Subject',
        'all-grades': 'All Grades',
        'no-records': 'No records logged.',
        'loading-entries': 'Loading entries...',
        'error-loading': 'Error loading.',
        'loading-professors': 'Loading Professors...',
        'student-list': 'Student List',
        'search-students': 'Search by name or ID...',
        'total-professors': 'Total Professors',
        'active-professors': 'Active Staff',
        'students-mgmt': 'Student Management',
        'total-days': 'Active Days',
        'total-attendances': 'Total Attendances',
        'avg-rate': 'Cumulative Attendance Rate',
        'avg-rate-desc': 'Overall average across period',
        'attendance-trends': 'Attendance Trends',
        'on-leave': 'On Leave',
        'student-record': 'Term Report Card',
        'absence-history': 'Absence & Leave History',
        'subject': 'Subject',
        'prof-name': 'Professor',
        'assignments': 'Assignments',
        'assign-prof': 'Assign Professor',
        'assign-subject': 'Subject Name',
        'assign-stage': 'Stage / Grade',
        'create-assignment': 'Create',
        'loading-assignments': 'Loading...',
        'academic-year': 'Academic Year',
        'print-schedule': 'Print Schedule',
        'schedule-matrix-pdf': 'Academic Course Schedule Matrix',
        'generated-on': 'Generated: {d}',
        'select-days': 'Select Days for Matrix',
        'photo': 'Photo',
        'prof-title-label': 'Full Name & Title',
        'prof-specialization': 'Specialization / Subject',
        'all-stages-general': 'All Stages (General)',
        'select-stage': 'Select Stage / Grade...',
        'prof-name-placeholder': 'e.g. Dr. Ahmed Hassan',
        'prof-subject-placeholder': 'e.g. Computer Science',
        'report-type': 'Report Type',
        'daily-matrix': 'Daily Matrix',
        'weekly-audit': 'Weekly Audit',
        'monthly-summary': 'Monthly Summary',
        'parameters': 'Parameters',
        'ref-date': 'Reference Date',
        'official-registry': 'Official Registry',
        'university-anbar': 'University of Anbar',
        'college-science': 'College of Science',
        'weekly-attendance-audit': 'Weekly Attendance Audit',
        'monthly-attendance-summary': 'Monthly Attendance Summary',
        'compliance': 'Compliance %',
        'generate-matrix': 'Generate Matrix',
        'week-of': 'Week of {d}',
        'total-present': 'Total Present',
        'total-absent': 'Total Absent',
        'total-leave': 'Total Leave',
        'compiling-matrices': 'Compiling Matrices...',
        'retrieving-records': 'Retrieving Academic Records...',
        'no-students': 'No Students Registered',
        'no-history': 'No history found.',
        'records-found': 'Records Found',
        'present-short': 'P',
        'absent-short': 'A',
        'leave-short': 'L',
        'all-grades': 'All Stages',
        'sun': 'Sunday',
        'mon': 'Monday',
        'tue': 'Tuesday',
        'wed': 'Wednesday',
        'thu': 'Thursday',
        'assignments-desc': 'Define subjects, assign professors, and map out the weekly matrix.',
        'stage-distribution': 'Stage / Grade Distribution',
        'student-count-desc': 'Total Active Enrollment per Grade',
        'live-status': 'System Operational',
        'total-students': 'Total Students',
        'remove-assignment': 'Remove Assignment',
        'error-loading-assignments': 'Error loading assignments.',
        'select-prof': 'Select Professor...',
        'bulk-selected': '{n} Selected',
        'action-label': 'Action:',
        'target-year-label': 'Target Year',
        'promote': 'Promote',
        'fail': 'Fail',
        'graduate': 'Graduate',
        'filter-stage': 'Filter Stage',
        'all-stages': 'All Academic Stages',
        'low-risk': 'Low Risk',
        'med-risk': 'Medium Risk',
        'high-risk': 'High Risk',
        'stage': 'Stage',
        'records-found': 'Records Found',
        'no-history': 'Perfect Attendance!',
        'modal-footer': 'Report generated by SYS STD Pro (Master-Canvas Export)',
        'matrix-sub': 'Comprehensive graphical analysis of attendance records',
        'pdf-pages-label': 'Detailed Report Annex',
        'operational-audit': 'Operational Audit for',
        'safety-audit': 'Academic Safety Audit',
        'matrix-annex-title': 'Attendance Detail Annex',
        'cumulative-rate': 'Cumulative Attendance Rate',
        'present-short': 'PR',
        'leave-short': 'LV',
        'absent-short': 'ABS',
        'compiling-matrices': 'Compiling Matrices...',
        'present-students': 'Present Students',
        'absent-students': 'Absent Students',
        'prof-sig': 'Course Instructor / Professor',
        'hod-sig': 'Head of Department',
        'reg-sig': 'Authorized Registrar',
        'lecturer': 'Lecturer',
        'generated-at': 'Generated At',
        'daily-attendance-report': 'Daily Attendance Report',
        'no-record-short': 'No Record',
        'day': 'Day',
        'serial-short': 'Ser.',
        'onboarding-title': 'New Student Onboarding',
        'directory-title': 'Student Directory',
        'bulk-title': 'Bulk Action System',
        'all-stages-overview': 'All Stages Overview',
        'enroll-student': 'Enroll Student',
        'direct-graduate': 'Direct Graduation',
        'retain': 'Retain (Failed)',
        'operation-success': 'Operation successful',
        'active-staff': 'Active Staff',
        'search-professors': 'Search by name or specialization...',
        'prof-id': 'Prof ID',
        'typography-section': 'Typography & Scaling',
        'font-size-label': 'Text Size (Global Scale)',
        'font-scaling-desc': 'Adjust the overall text size of the entire application.'
      },
      ar: {
        'scanner-setup-title': 'إعداد ماسح الهاتف المحمول',
        'scanner-setup-desc': 'استخدم رمز الكلية الآمن لربط الهواتف الذكية بماسح الحضور المباشر.',
        'open-scanner': 'فتح تطبيق الماسح',
        'college-code': 'رمز الكلية',
        'company-code': 'رمز الكلية',
        'settings-desc': 'تخصيص المظهر ولغة نظام SYS STD Pro.',
        'language-section': 'اللغة',
        'lang-en': 'English',
        'lang-en-desc': 'التخطيط من اليسار لليمين',
        'lang-ar': 'العربية',
        'lang-ar-desc': 'التخطيط من اليمين لليسار',
        'font-section': 'الخط',
        'appearance-section': 'المظهر',
        'mode-light': 'فاتح',
        'mode-light-desc': 'نظيف ومشرق',
        'mode-dark': 'داكن',
        'mode-dark-desc': 'مريح للعين',
        'mode-auto': 'تلقائي',
        'mode-auto-desc': 'حسب النظام',
        'theme-section': 'لون الواجهة',
        'footer-text': 'SYS STD Pro © 2026 — يتم حفظ جميع الإعدادات تلقائياً.',
        'latin': 'لاتيني',
        'arabic-latin': 'عربي + لاتيني',
        'settings-title': 'الإعدادات',
        'language-label': 'لغة النظام',
        'font-label': 'خط النظام',
        'dark-label': 'مظهر النظام',
        'open-settings': 'فتح لوحة الإعدادات الشاملة',
        'logout': 'تسجيل الخروج',
        'absent': 'غائب',
        'accent-color': 'لون التمييز',
        'actions': 'إجراءات',
        'active-roster': 'الطلاب النشطون',
        'add-worker': 'إضافة طالب',
        'advances': 'الأساتذة',
        'professors': 'الأساتذة',
        'advances-tab-title': 'إدارة الكادر التدريسي',
        'attendance': 'الحضور المباشر',
        'attendance-matrix': 'مصفوفة سجل الحضور الأكاديمي',
        'attendance-sub': 'إدارة الحضور',
        'attendance-title': 'إدارة الحضور',
        'auth-welcome': 'مرحباً بك',
        'card-font': 'خط البطاقة',
        'card-settings': 'إعدادات البطاقة',
        'dashboard': 'لوحة التحكم',
        'date': 'التاريخ',
        'days': 'أيام',
        'end-date': 'تاريخ الانتهاء',
        'export-csv': 'تصدير CSV',
        'export-pdf': 'تصدير PDF',
        'full-name': 'الاسم الكامل',
        'idcard-title': 'بطاقات الهوية',
        'idcards': 'بطاقات الهوية',
        'import-csv': 'استيراد CSV',
        'loading-db': 'جاري التحميل...',
        'notes': 'ملاحظات',
        'present': 'حاضر',
        'present-today': 'الحاضرون اليوم',
        'preview-mode': 'وضع المعاينة',
        'print-report-title': 'طباعة التقرير الشامل',
        'quick-actions': 'إجراءات سريعة',
        'records': 'السجلات',
        'reporting-period': 'فترة التقرير',
        'reports': 'التقارير',
        'reports-sub': 'عرض التقارير',
        'reports-title': 'تقارير النظام الأكاديمية',
        'run-report': 'معالجة البيانات',
        'search-workers': 'البحث عن الطلاب',
        'select-all': 'تحديد الكل',
        'settings': 'الإعدادات',
        'start-date': 'تاريخ البدء',
        'status': 'الحالة',
        'submit': 'حفظ / إرسال',
        'todays-log': "سجل اليوم",
        'total-students': 'إجمالي الطلاب',
        'professors-tab-title': 'إدارة الأساتذة',
        'teaching-stage': 'المرحلة الدراسية',
        'add-professor': 'إضافة أستاذ',
        'professors-list': 'دليل الأساتذة',
        'grade': 'المرحلة',
        'add-student': 'إضافة طالب',
        'students-list': 'دليل الطلاب',
        'at-risk-only': 'الطلاب المهددين بالرسوب (انخفاض الحضور)',
        'ungrouped': 'قائمة مسطحة (غير مجمعة)',
        'group-by-grade': 'تجميع حسب المرحلة الدراسية',
        'worker-id': 'معرف الطالب',
        'student-id': 'معرف الطالب',
        'worker-name': 'اسم الطالب',
        'student-name': 'اسم الطالب',
        'students': 'الطلاب',
        'workers-mgmt': 'إدارة شؤون الطلاب',
        'no-students': 'لا يوجد طلاب مسجلون',
        'all-subjects': 'جميع المواد الدراسية',
        'all-profs': 'جميع الأساتذة',
        'total': 'المجموع',
        'time-logged': 'وقت التسجيل',
        'prof-subject': 'الأستاذ والمادة',
        'all-grades': 'كل المراحل',
        'no-records': 'لا توجد سجلات مسجلة.',
        'loading-entries': 'جاري تحميل السجلات...',
        'error-loading': 'فشل تحميل البيانات.',
        'loading-professors': 'جاري تحميل الأساتذة...',
        'student-list': 'قائمة الطلاب والغيابات',
        'search-students': 'البحث بالاسم أو المعرف...',
        'total-professors': 'إجمالي الأساتذة',
        'active-professors': 'الكادر التدريسي النشط',
        'students-mgmt': 'إدارة شؤون الطلاب',
        'total-days': 'عدد أيام النشاط',
        'total-attendances': 'إجمالي الحضور',
        'avg-rate': 'نسبة الحضور التراكمية',
        'avg-rate-desc': 'المتوسط التراكمي خلال الفترة',
        'attendance-trends': 'تحليل اتجاهات الحضور',
        'on-leave': 'في إجازة رسمية',
        'student-record': 'السجل الأكاديمي الشامل',
        'absence-history': 'سجل الغيابات والإجازات التفصيلي',
        'subject': 'المادة الدراسية',
        'prof-name': 'الأستاذ المحاضر',
        'assignments': 'توزيع المواد',
        'assign-prof': 'تعيين أستاذ للمادة',
        'assign-subject': 'اسم المادة',
        'assign-stage': 'المرحلة الدراسية',
        'create-assignment': 'إنشاء التوزيع',
        'loading-assignments': 'جاري تحميل توزيع المواد...',
        'academic-year': 'العام الدراسي',
        'print-schedule': 'طباعة الجدول',
        'select-days': 'اختر أيام المحاضرات للمصفوفة',
        'sun': 'الأحد',
        'mon': 'الاثنين',
        'tue': 'الثلاثاء',
        'wed': 'الأربعاء',
        'thu': 'الخميس',
        'assignments-desc': 'حدد المواد الدراسية، وعين الأساتذة، ووزع الجدول الأسبوعي.',
        'num-subjects': '{n} مواد دراسية',
        'remove-assignment': 'حذف من الجدول',
        'error-loading-assignments': 'فشل تحميل جدول التوزيع.',
        'select-prof': 'اختر المحاضر...',
        'bulk-selected': 'تم تحديد {n} طالب',
        'action-label': 'الإجراء المطلوب:',
        'target-year-label': 'السنة المستهدفة',
        'promote': 'ترقية للمرحلة التالية',
        'fail': 'رسوب في المرحلة',
        'graduate': 'تخرج نهائي',
        'filter-stage': 'تصفية حسب المرحلة',
        'all-stages': 'كل المراحل الدراسية',
        'low-risk': 'مخاطر منخفضة',
        'med-risk': 'مخاطر متوسطة',
        'high-risk': 'مخاطر عالية',
        'stage': 'المرحلة',
        'records-found': 'سجل تم العثور عليه',
        'no-history': 'حضور مثالي! لا توجد غيابات مسجلة.',
        'modal-footer': 'تم إنشاء التقرير بواسطة نظام (Master-Canvas PDF Tool)',
        'matrix-sub': 'تمثيل بياني واحصائي شامل لسجلات الحضور',
        'pdf-pages-label': 'ملحق التقرير التفصيلي (Annex)',
        'operational-audit': 'التدقيق الأكاديمي لـ',
        'safety-audit': 'تدقيق السلامة الأكاديمية الشامل',
        'matrix-annex-title': 'ملحق تفاصيل سجل الحضور (Annex)',
        'cumulative-rate': 'نسبة الحضور التراكمية',
        'present-short': 'حاضر',
        'leave-short': 'إجازة',
        'absent-short': 'غياب',
        'compiling-matrices': 'جاري تجميع البيانات...',
        'present-students': 'الطلاب الحاضرين',
        'absent-students': 'الطلاب الغائبين',
        'prof-sig': 'توقيع الأستاذ المحاضر',
        'hod-sig': 'توقيع رئيس القسم',
        'reg-sig': 'توقيع مخول التسجيل',
        'daily-attendance-report': 'تقرير الحضور اليومي',
        'no-record-short': 'تعذر تسجيل الحضور',
        'day': 'اليوم',
        'serial-short': 'ت',
        'lecturer': 'الأستاذ المحاضر',
        'schedule-matrix-pdf': 'جدول المحاضرات الأكاديمي',
        'generated-on': 'تم الإنشاء في: {d}',
        'photo': 'الصورة الشخصية',
        'prof-title-label': 'الاسم الكامل واللقب العلمي',
        'prof-specialization': 'الاختصاص / المادة الدراسية',
        'all-stages-general': 'جميع المراحل (عام)',
        'select-stage': 'اختر المرحلة الدراسية...',
        'prof-name-placeholder': 'مثال: د. أحمد حسن',
        'prof-subject-placeholder': 'مثال: علوم الحاسبات',
        'report-type': 'نوع التقرير',
        'daily-matrix': 'الحضور اليومي',
        'weekly-audit': 'الحضور الأسبوعي',
        'monthly-summary': 'الحضور الشهري',
        'parameters': 'المعطيات والمعايير',
        'ref-date': 'التاريخ المرجعي',
        'official-registry': 'السجل الرسمي المعتمد',
        'university-anbar': 'جامعة تكريت',
        'college-science': 'كلية علوم الحاسبات والمعلوماتية',
        'weekly-attendance-audit': 'تدقيق الحضور الأسبوعي الشامل',
        'monthly-attendance-summary': 'خلاصة الحضور الشهرية الأكاديمية',
        'compliance': 'نسبة الالتزام الأكاديمي',
        'generate-matrix': 'توليد المصفوفة الإحصائية',
        'week-of': 'أسبوع {d}',
        'total-present': 'إجمالي الحضور',
        'total-absent': 'إجمالي الغياب',
        'stage-distribution': 'توزيع الطلاب حسب المرحلة',
        'student-count-desc': 'إجمالي المسجلين في كل مستوى دراسي',
        'live-status': 'حالة النظام: يعمل بشكل طبيعي',
        'total-leave': 'إجمالي الإجازات',
        'generated-at': 'تاريخ الاستخراج',
        'all-professors': 'جميع الأساتذة المحاضرين',
        'retrieving-records': 'جاري استرداد السجلات الأكاديمية...',
        'no-students': 'لا يوجد طلاب مسجلين',
        'no-history': 'لم يتم العثور على سجلات غياب.',
        'records-found': 'سجلات تم العثور عليها',
        'all-grades': 'جميع المراحل',
        'onboarding-title': 'تسجيل طالب جديد',
        'directory-title': 'دليل الطلاب',
        'bulk-title': 'نظام الإجراءات الجماعية',
        'all-stages-overview': 'نظرة عامة على جميع المراحل',
        'enroll-student': 'تسجيل الطالب',
        'direct-graduate': 'تخرج مباشر',
        'retain': 'رسوب (بقاء في المرحلة)',
        'operation-success': 'تمت العملية بنجاح',
        'active-staff': 'كادر تدريسي نشط',
        'search-professors': 'البحث بالاسم أو التخصص...',
        'prof-id': 'معرف الأستاذ',
        'typography-section': 'التنسيق والتحجيم',
        'font-size-label': 'حجم الخط (مقياس عام)',
        'font-scaling-desc': 'ضبط الحجم الإجمالي للنصوص في جميع أنحاء التطبيق.'
      }
    };

    const FONTS = [
      { name: 'Inter', ar: false }, { name: 'Roboto', ar: false }, { name: 'Poppins', ar: false },
      { name: 'Outfit', ar: false }, { name: 'DM Sans', ar: false }, { name: 'Cairo', ar: true },
      { name: 'Tajawal', ar: true }, { name: 'Noto Sans Arabic', ar: true },
      { name: 'Almarai', ar: true }, { name: 'IBM Plex Sans Arabic', ar: true },
    ];

    const FONT_URLS = {
      'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
      'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
      'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
      'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
      'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
      'Cairo': 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap',
      'Tajawal': 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
      'Noto Sans Arabic': 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap',
      'Almarai': 'https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap',
      'IBM Plex Sans Arabic': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap',
    };

    const THEMES = [
      { id: 'forge', color: '#f49000' }, { id: 'slate', color: '#3b82f6' },
      { id: 'emerald', color: '#10b981' }, { id: 'rose', color: '#e11d48' },
      { id: 'violet', color: '#7c3aed' },
    ];

    function get(k) { return localStorage.getItem('wms_' + k) || DEFAULTS[k]; }
    
    let _syncT = null;
    async function syncB() {
      if (!window.sbClient) return;
      const { data: { user } } = await window.sbClient.auth.getUser();
      if (!user) return;
      const s = {}; Object.keys(DEFAULTS).forEach(k => s[k] = get(k));
      await window.sbClient.from('colleges').update({ settings: s }).eq('id', user.id);
    }

    function set(k, v) {
      localStorage.setItem('wms_' + k, v); apply(k, v);
      if (window.WMSSettings && window.WMSSettings.rebuild) window.WMSSettings.rebuild();
      window.dispatchEvent(new CustomEvent('wms-settings-update', { detail: { k, v } }));
      if (_syncT) clearTimeout(_syncT); _syncT = setTimeout(syncB, 1500);
    }

    const _fonts = new Set();
    function loadF(n) { if (!_fonts.has(n) && FONT_URLS[n]) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONT_URLS[n]; document.head.appendChild(l); _fonts.add(n); } }

    function apply(k, v) {
      if (k === 'theme') ROOT.setAttribute('data-theme', v);
      if (k === 'dark') { ROOT.setAttribute('data-dark', v); ROOT.classList.toggle('dark', v === 'true'); }
      if (k === 'lang') {
        ROOT.setAttribute('lang', v);
        ROOT.setAttribute('dir', v === 'ar' ? 'rtl' : 'ltr');
        // Automatically switch to an Arabic-friendly font if currently on Inter
        if (v === 'ar' && get('font') === 'Inter') set('font', 'Cairo');
        if (document.body) applyT(v);
      }
      if (k === 'font_scale') {
        ROOT.style.fontSize = v + '%';
      }
      if (k === 'font') {
        loadF(v);
        // Robust fallback stack for Arabic on Windows/Web
        const fallbacks = ' -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Cairo", "Tajawal", sans-serif';
        ROOT.style.setProperty('--wms-font', v);
        let s = document.getElementById('wms-font-override');
        if (!s) { s = document.createElement('style'); s.id = 'wms-font-override'; document.head.appendChild(s); }
        s.textContent = `
          *:not(.material-symbols-outlined):not(.no-force-font) { 
            font-family: "${v}", ${fallbacks} !important; 
            text-rendering: optimizeLegibility !important;
            font-variant-ligatures: common-ligatures !important;
            letter-spacing: normal !important;
          }
          input, select, textarea, button { 
            font-family: "${v}", ${fallbacks} !important; 
          }
        `;
      }
    }

    function applyT(l) {
      const t = window.WMS_I18N[l] || window.WMS_I18N['en'];
      document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (t[k]) el.textContent = t[k]; });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const k = el.getAttribute('data-i18n-placeholder'); if (t[k]) el.setAttribute('placeholder', t[k]); });
    }

    function build() {
      const l = get('lang'), t = window.WMS_I18N[l] || window.WMS_I18N['en'], curT = get('theme'), curF = get('font'), isD = get('dark');
      const bg = isD === 'true' ? '#0f172a' : '#fff';
      const border = isD === 'true' ? '#1e293b' : '#e2e8f0';
      const textMain = isD === 'true' ? '#f1f5f9' : '#334155';
      const textMuted = isD === 'true' ? '#94a3b8' : '#64748b';
      const btnBg = isD === 'true' ? '#1e293b' : '#fff';
      const activeBg = isD === 'true' ? '#f4900020' : '#fff9f0';
      const activeBorder = '#f49000';

      const ths = THEMES.map(th => `<button onclick="WMSSettings.setT('${th.id}')" style="width:24px;height:24px;border-radius:50%;background:${th.color};border:2px solid ${th.id === curT ? '#fff' : 'transparent'};cursor:pointer;box-shadow:${th.id === curT ? '0 0 0 2px ' + th.color : 'none'};"></button>`).join('');
      const fts = FONTS.map(f => `<option value="${f.name}" ${f.name === curF ? 'selected' : ''} style="background:${bg}; color:${textMain};">${f.name}${f.ar ? ' ✦' : ''}</option>`).join('');

      return `
<div id="wms-dropdown" onclick="event.stopPropagation()" style="position:fixed; width:240px; background:${bg}; border:1px solid ${border}; border-radius:12px; padding:16px; box-shadow:0 10px 30px rgba(0,0,0,0.1); z-index:9999; font-family:var(--wms-font,'Inter',sans-serif); direction:${l === 'ar' ? 'rtl' : 'ltr'}; color:${textMain};">
  <p style="font-size:10px; font-weight:900; color:${textMuted}; margin:0 0 12px; text-transform:uppercase;">${t['settings-title']}</p>
  <div style="margin-bottom:12px;">
    <p style="font-size:10px; font-weight:800; color:${textMuted}; margin-bottom:6px;">${t['academic-year']}</p>
    <select onchange="WMSSettings.setAY(this.value)" style="width:100%; padding:6px; border-radius:6px; border:1px solid ${border}; background:${btnBg}; color:${textMain}; font-size:11px; font-family:inherit; outline:none; cursor:pointer;">
      ${(function () {
          let opts = '';
          const start = 2025;
          const end = 2040;
          const curAY = get('academic_year');
          for (let y = start; y < end; y++) {
            const val = `${y}/${y + 1}`;
            opts += `<option value="${val}" ${val === curAY ? 'selected' : ''} style="background:${bg}; color:${textMain};">${val}</option>`;
          }
          return opts;
        })()}
    </select>
  </div>
  <div style="margin-bottom:12px;">
    <p style="font-size:10px; font-weight:800; color:${textMuted}; margin-bottom:6px;">${t['language-label']}</p>
    <div style="display:flex; gap:4px;">
      <button onclick="WMSSettings.setL('en')" style="flex:1; padding:6px; border-radius:6px; border:1.5px solid ${l === 'en' ? activeBorder : border}; background:${l === 'en' ? activeBg : btnBg}; font-size:11px; font-weight:800; cursor:pointer; color:${textMain}; transition:all 0.2s;">EN</button>
      <button onclick="WMSSettings.setL('ar')" style="flex:1; padding:6px; border-radius:6px; border:1.5px solid ${l === 'ar' ? activeBorder : border}; background:${l === 'ar' ? activeBg : btnBg}; font-size:11px; font-weight:800; cursor:pointer; color:${textMain}; transition:all 0.2s;">AR</button>
    </div>
  </div>
  <div style="margin-bottom:12px;">
    <p style="font-size:10px; font-weight:800; color:${textMuted}; margin-bottom:6px;">${t['font-label']}</p>
    <select onchange="WMSSettings.setF(this.value)" style="width:100%; padding:6px; border-radius:6px; border:1px solid ${border}; background:${btnBg}; color:${textMain}; font-size:11px; font-family:inherit; outline:none; cursor:pointer;">${fts}</select>
  </div>
  <div style="margin-bottom:12px;">
    <p style="font-size:10px; font-weight:800; color:${textMuted}; margin-bottom:6px;">${t['dark-label']}</p>
    <div style="display:flex; gap:4px;">
      <button onclick="WMSSettings.setD('false')" style="flex:1; padding:6px; border-radius:6px; border:1.5px solid ${isD === 'false' ? activeBorder : border}; background:${isD === 'false' ? activeBg : btnBg}; font-size:11px; font-weight:800; cursor:pointer; color:${textMain}; transition:all 0.2s;">${t['mode-light'] || 'Light'}</button>
      <button onclick="WMSSettings.setD('true')" style="flex:1; padding:6px; border-radius:6px; border:1.5px solid ${isD === 'true' ? activeBorder : border}; background:${isD === 'true' ? activeBg : btnBg}; font-size:11px; font-weight:800; cursor:pointer; color:${textMain}; transition:all 0.2s;">${t['mode-dark'] || 'Dark'}</button>
    </div>
  </div>
  <div style="margin-bottom:12px;"><div style="display:flex; gap:8px; justify-content:center;">${ths}</div></div>
  <div style="padding-top:12px; border-top:1px solid ${border}; text-align:center; display:flex; justify-content:space-between; align-items:center;">
    <a href="settings.html" style="font-size:11px; font-weight:800; color:#f49000; text-decoration:none;">${t['open-settings']}</a>
    <button onclick="window.WMSLogout()" style="font-size:11px; font-weight:800; color:#ef4444; background:transparent; border:1px solid #ef4444; cursor:pointer; padding:6px 12px; border-radius:6px;">${t['logout'] || 'Log Out'}</button>
  </div>
</div>`;
    }

    window.WMSLogout = async function () {
      if (window.sbClient && window.sbClient.auth) { await window.sbClient.auth.signOut(); }
      window.location.href = 'auth.html';
    };

    window.WMSSettings = {
      get, set,
      setL(l) { set('lang', l); },
      setD(d) { set('dark', d); d === 'true' ? ROOT.classList.add('dark') : ROOT.classList.remove('dark'); },
      setT(t) { set('theme', t); },
      setF(f) { set('font', f); },
      setFS(fs) { set('font_scale', fs); },
      setAY(ay) { set('academic_year', ay); },
      applyT: applyT,
      applyTranslations: applyT,
      FONT_URLS: FONT_URLS,
      rebuild() {
        const dd = document.getElementById('wms-dropdown');
        if (dd) {
          const t = dd.style.top;
          const l = dd.style.left;
          dd.outerHTML = build();
          const newDd = document.getElementById('wms-dropdown');
          if (newDd && t && l) {
            newDd.style.top = t;
            newDd.style.left = l;
          }
        }
        const l = document.getElementById('hdr-lang-label');
        if (l) l.textContent = get('lang').toUpperCase();
        const d = document.getElementById('hdr-dark-icon');
        if (d) d.textContent = get('dark') === 'true' ? 'light_mode' : 'dark_mode';

        // Broadcast for page-specific sync if needed
        window.dispatchEvent(new CustomEvent('wms-ui-sync'));
      }
    };

    async function init() {
      ['theme', 'dark', 'lang', 'font', 'font_scale'].forEach(k => apply(k, get(k)));
      
      // Sync from Supabase if logged in
      if (window.sbClient) {
        const { data: { user } } = await window.sbClient.auth.getUser();
        if (user) {
          const { data } = await window.sbClient.from('colleges').select('settings').eq('id', user.id).single();
          if (data && data.settings) {
            Object.entries(data.settings).forEach(([k, v]) => {
              if (v && v !== localStorage.getItem('wms_' + k)) {
                localStorage.setItem('wms_' + k, v);
                apply(k, v);
              }
            });
            if (window.WMSSettings && window.WMSSettings.rebuild) window.WMSSettings.rebuild();
          }
        }
      }

      // Global Mobile Menu Support
      setTimeout(() => {
        const header = document.querySelector('header');
        if (!header) return;

        // 1. Check for burger button or create it
        let burger = document.getElementById('mobile-menu-btn');
        if (!burger) {
          const leftCluster = header.querySelector('.flex.items-center.gap-4');
          if (leftCluster) {
            const b = document.createElement('button');
            b.id = 'mobile-menu-btn';
            b.className = 'md:hidden text-slate-500 hover:text-primary p-2 transition-colors';
            b.innerHTML = '<span class="material-symbols-outlined text-[28px]">menu</span>';
            leftCluster.prepend(b);
            burger = b;
          }
        }

        if (burger) {
          burger.onclick = () => {
            const existing = document.getElementById('mobile-drawer');
            if (existing) { existing.remove(); return; }

            const drawer = document.createElement('div');
            drawer.id = 'mobile-drawer';
            drawer.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] transition-opacity no-print';
            const lang = get('lang');
            const isRtl = lang === 'ar';

            drawer.innerHTML = `
               <div class="absolute ${isRtl ? 'left-0' : 'right-0'} top-0 h-full w-[280px] bg-white shadow-2xl flex flex-col animate-slide-in">
                 <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h2 class="text-xl font-black text-primary tracking-tight">SYS STD Pro</h2>
                   <button id="close-drawer" class="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"><span class="material-symbols-outlined text-[24px]">close</span></button>
                 </div>
                 <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-1" id="drawer-links"></div>
                 <div class="p-6 border-t border-slate-100 bg-slate-50 text-center">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">&copy; 2026 SYS STD PRO</p>
                    <p class="text-[9px] text-slate-300 mt-1 font-medium">Academic Management Suite</p>
                 </div>
               </div>
               <style>
                 .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                 @keyframes slideIn { from { transform: translateX(${isRtl ? '-100%' : '100%'}); } to { transform: translateX(0); } }
               </style>
             `;

            let studentQuery = supabase.from('students').select('grade').eq('college_id', collegeId);
            if (get('academic_year')) studentQuery = studentQuery.eq('academic_year', get('academic_year'));
            const linksCont = drawer.querySelector('#drawer-links');
            const nav = header.querySelector('nav');
            if (nav) {
              nav.querySelectorAll('a, button[data-wms-settings-trigger]').forEach(link => {
                const clone = link.cloneNode(true);
                // Special styling for mobile drawer items
                clone.className = "flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-600 font-bold text-sm hover:bg-orange-50 hover:text-primary transition-all group/item";
                const i18n = clone.getAttribute('data-i18n');
                const iconMap = {
                  'dashboard': 'dashboard', 'students-mgmt': 'groups', 'professors': 'person_4',
                  'assignments': 'assignment', 'idcards': 'badge', 'attendance': 'event_available', 'reports': 'bar_chart', 'settings': 'settings'
                };
                const icon = iconMap[i18n] || 'grid_view';
                clone.innerHTML = `<span class="material-symbols-outlined text-[22px] text-slate-400 group-hover/item:text-primary transition-colors">${icon}</span> <span>${clone.textContent}</span>`;
                linksCont.appendChild(clone);
              });
            }

            document.body.appendChild(drawer);
            // Ensure translations applied to clone
            if (window.WMSSettings?.applyTranslations) window.WMSSettings.applyTranslations(lang);

            drawer.querySelector('#close-drawer').onclick = () => drawer.remove();
            drawer.onclick = (e) => { if (e.target === drawer) drawer.remove(); };
          };
        }
      }, 800);

      document.addEventListener('click', (e) => {
        const langBtn = e.target.closest('#hdr-lang-btn');
        if (langBtn) {
          e.preventDefault(); e.stopPropagation();
          const current = get('lang');
          const next = current === 'en' ? 'ar' : 'en';
          set('lang', next);
          return;
        }
        
        const darkBtn = e.target.closest('#hdr-dark-btn');
        if (darkBtn) {
          e.preventDefault(); e.stopPropagation();
          const cur = get('dark');
          set('dark', cur === 'true' ? 'false' : 'true');
          return;
        }

        const tr = e.target.closest('[data-wms-settings-trigger]');
        if (tr) {
          e.preventDefault(); e.stopPropagation();
          const ex = document.getElementById('wms-dropdown');
          if (ex) { ex.remove(); return; }
          document.querySelectorAll('#wms-dropdown').forEach(d => d.remove());
          const rect = tr.getBoundingClientRect();
          const html = build();
          document.body.insertAdjacentHTML('beforeend', html);
          const dd = document.getElementById('wms-dropdown');
          if (dd) {
            dd.style.position = 'fixed';
            dd.style.top = (rect.bottom + 8) + 'px';
            const leftPos = rect.right - 240;
            dd.style.left = Math.max(16, leftPos) + 'px';
          }
          return;
        }
        if (!e.target.closest('#wms-dropdown')) { document.querySelectorAll('#wms-dropdown').forEach(d => d.remove()); }
      });
      if (document.body) applyT(get('lang'));
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
  })();
}
