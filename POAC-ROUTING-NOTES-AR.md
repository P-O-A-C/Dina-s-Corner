# تنظيم الدخول والروابط في POAC

## صفحة الدخول الموحدة
- `index.html` هي صفحة تسجيل الدخول العامة.
- تستخدم صفحة الدخول اتصال Supabase الحالي و`get_my_profile()`.
- حساب `role = admin` ينتقل إلى `POAC-Admin/index.html`.
- حساب Dina GM ينتقل إلى `Dina'sCorner/welcome.html`.
- حساب GRAND DRY CLEAN GM ينتقل إلى `GrandDryClean/dashboard.html`.

## تحديد مشروع حساب GM
لأن الحسابين قد يحملان نفس `role = gm`، يجب تحديد المشروع عبر قيمة موثوقة:
- حقل في بيانات الملف الشخصي مثل `project_key` أو `tenant_id` أو `tenant_slug`، أو
- قيمة Supabase Auth `app_metadata.poac_project`.

القيمة المطلوبة للمغسلة: `grand-dry-clean`.
القيمة المطلوبة لدينا: `dina-corner`.

يمكن وضع `poac_project` في `app_metadata` من لوحة إدارة آمنة أو Edge Function باستخدام صلاحية خادم فقط. لا تضع `service_role` في ملفات JavaScript ولا تسمح للعميل بتعديل app_metadata.

إذا لم توجد علامة مشروع للحساب الحالي ذي الدور `gm`، فالتوجيه الافتراضي القديم يفتح Dina's Corner للحفاظ على حساب دينا الحالي. لا يُنشئ هذا التغيير حسابات أو صلاحيات جديدة في Supabase.

## روابط العملاء
- Dina's Corner: `Dina'sCorner/welcome.html` (الصفحة تحوّل إلى صفحة الترحيب الأصلية في جذر المشروع، دون نقل ملفاتها أو تغيير مسارات الأصول).
- GRAND DRY CLEAN: `GrandDryClean/index.html`.
- لوحة GM للمغسلة: `GrandDryClean/dashboard.html`.

## الحماية
التوجيه يحدد الصفحة فقط، ولا يُعد بديلًا عن الحماية. يجب أن تتحقق كل صفحة إدارة من الجلسة والدور والمشروع، وأن تحمي بيانات المشروع بسياسات RLS في Supabase.
