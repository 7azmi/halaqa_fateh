export interface Teacher {
  id: string;
  name: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  age?: number;
  current_surah?: string;
  teacher_id?: string;
  teacher?: Teacher;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyProgress {
  id: string;
  student_id: string;
  student?: Student;
  hijri_date: string;
  hijri_month: string; // e.g., "جماد الثاني 1447"
  day_number: number; // 1-30
  pages_memorized: number;
  pages_reviewed: number;
  attendance_only?: boolean; // true if student attended but no memorization
  notes?: string;
  created_at: string;
}

export interface ActivityType {
  id: string;
  name: string;
  is_deleted?: boolean;
  created_at: string;
}

export interface BudgetTransaction {
  id: string;
  type: 'deposit' | 'expense' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  report_id?: string;
  created_at: string;
}

export interface FinancialReport {
  id: string;
  activity_type: string;
  hijri_date: string;
  participant_count: number;
  total_cost: number;
  budget_before: number;
  budget_after: number;
  notes?: string;
  created_at: string;
}

export interface ExpenseItem {
  id: string;
  report_id: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface ReportPhoto {
  id: string;
  report_id: string;
  photo_url: string;
  created_at: string;
}

export interface Budget {
  id: string;
  current_balance: number;
  updated_at: string;
}

// Quran Surahs for dropdown
export const QURAN_SURAHS = [
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
  'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
  'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
  'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
  'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
  'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة',
  'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج',
  'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس',
  'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
  'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات',
  'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر',
  'المسد', 'الإخلاص', 'الفلق', 'الناس'
] as const;

export const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'حاضر', color: 'bg-green-100 text-green-800' },
  { value: 'absent', label: 'غائب', color: 'bg-red-100 text-red-800' },
  { value: 'late', label: 'متأخر', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'excused', label: 'معذور', color: 'bg-blue-100 text-blue-800' },
] as const;

export const DEFAULT_ACTIVITY_TYPES = [
  { name: 'رياضة وصبوح', description: 'نشاط رياضي مع وجبة إفطار' },
  { name: 'رحلة', description: 'رحلة ترفيهية' },
  { name: 'مسابقة', description: 'مسابقة قرآنية' },
  { name: 'حفل تكريم', description: 'حفل تكريم الطلاب المتميزين' },
  { name: 'أخرى', description: 'نشاط آخر' },
] as const;
