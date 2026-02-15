# حلقة القرآن — Quran center app

نظام إدارة حلقة تحفيظ القرآن الكريم: تسجيل الطلاب والمعلمين وتتبع التقدم اليومي.

## Features

- **Mobile-first, offline-first** — بيانات محلية ومزامنة مع Google Sheets عند الاتصال
- **Google Sheets** — قاعدة البيانات (بدون سيرفر). تسجيل الدخول بـ Google وإدخال معرف الجدول من الإعدادات
- **Soft delete** — المعلمون والطلاب يُحذفون حذفاً ناعماً

## Run locally

```bash
npm install
npm run dev
```

التطبيق على `http://localhost:3000`.

للاختبار مع Google OAuth عبر نفق آمن: `npm run dev:tunnel` (انظر [docs/ngrok-local-testing.md](docs/ngrok-local-testing.md)).

## Deploy to GitHub Pages

الريبو يتضمن workflow لنشر التطبيق كموقع ثابت على GitHub Pages.

1. **Settings → Pages** في الريبو، اختر **Source: GitHub Actions**.
2. ادفع إلى `main` — يتم البناء والنشر تلقائياً.

الموقع سيكون على: **https://\<username>.github.io/halaqa_fateh/**

تفاصيل أكثر: [docs/github-pages.md](docs/github-pages.md).

## Google Sheet template

للاستخدام مع التطبيق، أنشئ جدولاً من القالب في [docs/sheet-template.md](docs/sheet-template.md) وأدخل معرف الجدول في إعدادات التطبيق.
