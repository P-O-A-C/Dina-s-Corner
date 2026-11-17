# POAC — صفحات الدخول والروابط

## صفحات تسجيل دخول الإدارة
- POAC Admin: `/poac/` — الملف الجذري `index.html` ويقبل حساب `admin` فقط.
- Dina's Corner GM: `/poac/Dina'sCorner/login.html` — صفحة دخول مستقلة بهوية دينا.
- GRAND DRY CLEAN GM: `/poac/GrandDryClean/login.html` — صفحة دخول مستقلة بهوية المغسلة.

## صفحات العملاء — بدون تسجيل دخول
- Dina's Corner: `/poac/welcome.html`، والمسار البديل `/poac/Dina'sCorner/welcome.html`.
- GRAND DRY CLEAN: `/poac/GrandDryClean/index.html`.

## فصل المشاريع في Supabase
يمكن أن يكون حسابا المشروعين بدور `gm` نفسه، ولذلك يلزم ربط الحساب بالمشروع:
- GRAND DRY CLEAN: `app_metadata.poac_project = "grand-dry-clean"`.
- يُفضّل Dina's Corner: `app_metadata.poac_project = "dina-corner"`.
يتم تعيين هذه البيانات من جهة موثوقة باستخدام Supabase Auth Admin API أو Edge Function مؤمنة. لا تضع `service_role` في ملفات المتصفح.
حساب Dina القديم غير الموسوم يبقى مقبولًا من صفحة Dina حفاظًا على التوافق. صفحة GRAND DRY CLEAN تتطلب العلامة صراحة.

## ملاحظة
صفحات GRAND DRY CLEAN الإدارية تتحقق من الجلسة والدور وعلامة المشروع قبل إظهار المحتوى. بيانات لوحة المغسلة ما زالت تجريبية ولا تُحفظ في Supabase.
