(async function () {
  const gate = document.getElementById("authGate");
  const sendToLogin = () => location.replace("login.html");
  try {
    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      if (gate) gate.textContent = "تعذر تحميل إعدادات الدخول. افتح صفحة تسجيل دخول المغسلة.";
      return;
    }
    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData?.session) { sendToLogin(); return; }
    const [profileResult, userResult] = await Promise.all([client.rpc("get_my_profile"), client.auth.getUser()]);
    if (profileResult.error || userResult.error) throw profileResult.error || userResult.error;
    const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
    const app = userResult.data?.user?.app_metadata || {};
    const markers = [
      profile?.project_key, profile?.project_slug, profile?.project_name,
      profile?.tenant_slug, profile?.tenant_name, profile?.business_slug,
      profile?.business_name, profile?.company_slug, profile?.company_name,
      app.poac_project, app.project_key, app.project_slug, app.tenant_slug, app.business_slug, app.company_slug
    ].filter(v => v !== null && v !== undefined && String(v).trim())
      .map(v => String(v).toLowerCase().replace(/[^a-z0-9]+/g, ""));
    const belongsToDryClean = markers.some(v => v.includes("granddryclean") || v.includes("dryclean") || v === "laundry");
    if (!profile || profile.role !== "gm" || profile.is_active === false || !belongsToDryClean) {
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
    console.error("GRAND DRY CLEAN access check failed:", error);
    if (gate) gate.textContent = "تعذر التحقق من صلاحية حساب المغسلة. راجع علامة المشروع في Supabase.";
  }
})();