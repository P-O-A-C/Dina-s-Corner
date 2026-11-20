تعديل قسم مكواة فقط ليصبح قسمًا عاديًا

الملفات المرفقة فقط هي الملفات التي تحتاج استبدالًا:
- GrandDryClean/gm.html
- GrandDryClean/js/gm.js
- GrandDryClean/order.html
- GrandDryClean/js/order.js
- GrandDryClean/css/order.css
- sw.js
- GDC-RESTORE-IRONING-AS-NORMAL-CATEGORY.sql

طريقة التطبيق:
1) افتح Supabase SQL Editor وشغّل ملف GDC-RESTORE-IRONING-AS-NORMAL-CATEGORY.sql مرة واحدة.
   يقوم الملف بإرجاع اسم القسم السابق إلى gdc_service_categories ونسخ الأصناف الـ24 وأسعارها وصورها إلى gdc_service_items.
   لا يحذف أي صف من جدول gdc_ironing_prices القديم؛ يظل موجودًا كنسخة احتياطية.
2) ارفع الملفات البرمجية إلى GitHub في نفس المسارات الموضحة أعلاه.
3) حدّث الصفحة بعد اكتمال نشر GitHub Pages؛ إصدار Service Worker تم تغييره لتحديث الكاش.

بعد التحديث:
- مكواة فقط يظهر كقسم عادي في لوحة الإدارة وقائمة تصفية الأصناف.
- يمكن تعديل الاسم بالطريقة نفسها المستخدمة لباقي الأقسام.
- أصناف الكي وأسعارها وصورها تظهر في شبكة الأصناف العادية بصفحة العملاء، دون مستطيل IRONING ONLY.
- تبويب غسيل ومكواة يظل موجودًا.
- مثل بقية الأقسام، لا يتم حذف القسم إذا كانت هناك أصناف مرتبطة به؛ انقل الأصناف أو احذفها أولًا.
