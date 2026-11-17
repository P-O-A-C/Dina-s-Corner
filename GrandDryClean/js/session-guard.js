(async function () {
  const gate = document.getElementById("authGate");
  const sendToLogin = () => location.replace("login.html");
  let stage = "بدء التحقق";

  function showGate(message, withRetry = false) {
    if (!gate) return;
    gate.textContent = "";
    const text = document.createElement("p");
    text.textContent = message;
    text.style.whiteSpace = "pre-line";
    gate.appendChild(text);

    if (withRetry) {
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "إعادة المحاولة";
      retry.style.cssText = "border:0;border-radius:8px;padding:10px 18px;background:#17394d;color:#fff;font:inherit;cursor:pointer";
      retry.addEventListener("click", () => location.reload());
      const login = document.createElement("a");
      login.href = "login.html";
      login.textContent = "العودة لتسجيل الدخول";
      login.style.cssText = "border:1px solid #17394d;border-radius:8px;padding:10px 18px;color:#17394d;text-decoration:none";
      actions.append(retry, login);
      gate.appendChild(actions);
    }
  }

  function withTimeout(promise, milliseconds, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("TIMEOUT:" + label)), milliseconds);
      Promise.resolve(promise).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }

  try {
    stage = "تحميل إعدادات Supabase";
    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      showGate("تعذر تحميل إعدادات الدخول. افتح صفحة تسجيل دخول المغسلة وتأكد من تحميل ملفات المشروع.", true);
      return;
    }

    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    stage = "استعادة جلسة الدخول";
    showGate("جارٍ استعادة جلسة الدخول...");
    const { data: sessionData, error: sessionError } = await withTimeout(client.auth.getSession(), 12000, "استعادة جلسة الدخول");
    if (sessionError) throw sessionError;
    const session = sessionData?.session;
    if (!session?.user) { sendToLogin(); return; }

    // The freshly authenticated session already contains the verified Auth user.
    // Reuse it here rather than issuing a second auth.getUser() request on page load.
    const user = session.user;

    stage = "تحميل صلاحيات الحساب من profiles";
    showGate("تم استعادة الجلسة. جارٍ تحميل صلاحيات حساب المغسلة...");
    const profileResult = await withTimeout(client.rpc("get_my_profile"), 15000, "تحميل صلاحيات الحساب");
    if (profileResult.error) throw profileResult.error;
    const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;

    stage = "مطابقة الحساب مع مشروع GRAND DRY CLEAN";
    const app = user.app_metadata || {};
    const markers = [
      profile?.project_key, profile?.project_slug, profile?.project_name,
      profile?.tenant_slug, profile?.tenant_name, profile?.business_slug,
      profile?.business_name, profile?.company_slug, profile?.company_name,
      app.poac_project, app.project_key, app.project_slug,
      app.tenant_slug, app.business_slug, app.company_slug
    ].filter(v => v !== null && v !== undefined && String(v).trim())
      .map(v => String(v).toLowerCase().replace(/[^a-z0-9]+/g, ""));

    const belongsToDryClean = markers.some(v =>
      v.includes("granddryclean") || v.includes("dryclean") || v === "laundry"
    );

    if (!profile || String(profile.role || "").toLowerCase() !== "gm" || profile.is_active === false || !belongsToDryClean) {
      await client.auth.signOut();
      sendToLogin();
      return;
    }

    document.body.classList.remove("auth-pending");
    if (gate) gate.hidden = true;
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      await client.auth.signOut();
      sendToLogin();
    });
  } catch (error) {
    console.error("GRAND DRY CLEAN access check failed at stage:", stage, error);
    const isTimeout = String(error?.message || "").startsWith("TIMEOUT:");
    const reason = isTimeout
      ? "الاتصال بـ Supabase استغرق وقتًا أطول من المتوقع. تأكد من الاتصال بالإنترنت ثم أعد المحاولة."
      : "تعذر التحقق من صلاحية الحساب. راجع إعدادات Supabase أو صلاحية get_my_profile.";
    showGate(reason + "\n\nمرحلة التحقق: " + stage, true);
  }
})();
