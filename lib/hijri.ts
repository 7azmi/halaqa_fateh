// Hijri date utilities for Arabic Quran center app

const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
] as const;

const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
] as const;

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  dayName: string;
}

// Convert Arabic-Indic numerals to Western numerals
function arabicToWestern(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), String(index));
  });
  return result;
}

// Convert Gregorian to Hijri using Intl API
export function toHijri(date: Date = new Date()): HijriDate {
  // Use English locale with Islamic calendar to get Western numerals
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  
  const parts = formatter.formatToParts(date);
  const dayStr = parts.find(p => p.type === 'day')?.value || '1';
  const monthStr = parts.find(p => p.type === 'month')?.value || '1';
  const yearStr = parts.find(p => p.type === 'year')?.value || '1446';
  
  const day = parseInt(arabicToWestern(dayStr), 10) || 1;
  const month = parseInt(arabicToWestern(monthStr), 10) || 1;
  const year = parseInt(arabicToWestern(yearStr), 10) || 1446;
  
  return {
    day,
    month,
    year,
    monthName: HIJRI_MONTHS[month - 1] || HIJRI_MONTHS[0],
    dayName: ARABIC_DAYS[date.getDay()]
  };
}

export function formatHijriDate(date: Date = new Date()): string {
  const hijri = toHijri(date);
  return `${hijri.day} ${hijri.monthName} ${hijri.year}`;
}

export function formatHijriShort(date: Date = new Date()): string {
  const hijri = toHijri(date);
  return `${hijri.day}/${hijri.month}/${hijri.year}`;
}

export function getCurrentHijriMonth(): { month: number; year: number; monthName: string } {
  const hijri = toHijri();
  return {
    month: hijri.month,
    year: hijri.year,
    monthName: hijri.monthName
  };
}

export function getHijriMonthName(month: number): string {
  return HIJRI_MONTHS[month - 1] || '';
}

export function getDaysInHijriMonth(month: number, year: number): number {
  // Hijri months alternate between 29 and 30 days
  // Odd months have 30 days, even months have 29 days
  // The 12th month (Dhul Hijjah) has 30 days in leap years
  if (month === 12) {
    // Leap year calculation for Hijri calendar
    const cycle = year % 30;
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    return leapYears.includes(cycle) ? 30 : 29;
  }
  return month % 2 === 1 ? 30 : 29;
}

export { HIJRI_MONTHS, ARABIC_DAYS };
