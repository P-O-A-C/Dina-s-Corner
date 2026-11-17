(async function () {
  "use strict";

  const gate = document.getElementById("authGate");
  const sendToLogin = () => location.replace("login.html");
  let stage = "بدء التحقق";

  function withTimeout(promise, milliseconds, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("TIMEOUT:" + label)), milliseconds);
      Promise.resolve(promise).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }

  function renderGate(message, withRetry = false) {
    if (!gate) return;
    gate.replaceChildren();

    const card = document.createElement("div");
    card.className = "auth-gate-card";
    const mark = document.createElement("span");
    mark.className = "auth-gate-mark";
    mark.textContent = "G";
    const brand = document.createElement("span");
    brand.className = "auth-gate-brand";
    brand.textContent = "GRAND DRY CLEAN";
    const text = document.createElement("p");
    text.textContent = message;
    text.setAttribute("aria-live", "polite");
    card.append(mark, brand, text);

    if (withRetry) {
      const actions = document.createElement("div");
      actions.className = "auth-gate-actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "إعادة المحاولة";
      retry.addEventListener("click", () => location.reload());
      const login = document.createElement("a");
      login.href = "login.html";
      login.textContent = "العودة لتسجيل الدخول";
      actions.append(retry, login);
      card.append(actions);
    } else {
      const loader = document.createElement("span");
      loader.className = "auth-loader";
      loader.setAttribute("aria-hidden", "true");
      card.append(loader);
    }
    gate.append(card);
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  async function loadProfile(client, user) {
    stage = "تحميل صلاحيات الحساب";
    renderGate("تم استعادة الجلسة. جارٍ تحميل صلاحيات حساب المغسلة…");

    // First use the same profile RPC used by the central POAC login.
    let rpcError = null;
    try {
      const result = await withTimeout(
        client.rpc("get_my_profile"),
        15000,
        "تحميل صلاحيات الحساب"
      );
      if (result.error) rpcError = result.error;
      else {
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        if (row) return row;
      }
    } catch (error) {
      rpcError = error;
    }

    // Fallback: read only the signed-in user's own profile row. RLS must allow
    // a user to read their own profile; no service-role key is used here.
    stage = "التحقق من سجل الحساب في profiles";
    renderGate("جارٍ التحقق من سجل حساب المغسلة…");
    const direct = await withTimeout(
      client.from("profiles")
        .select("id,email,role,is_active")
        .eq("id", user.id)
        .maybeSingle(),
      12000,
      "قراءة سجل الحساب"
    );
    if (direct.error) {
      const detail = rpcError?.message ? " (" + rpcError.message + ")" : "";
      throw new Error("تعذر قراءة صلاحيات الحساب من profiles" + detail + ": " + direct.error.message);
    }
    if (!direct.data) throw new Error("لم يتم العثور على سجل الحساب في profiles.");
    return direct.data;
  }

  try {
    stage = "تحميل إعدادات Supabase";
    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      renderGate("تعذر تحميل إعدادات الاتصال. تأكد من نشر assets/config.js وملف Supabase.", true);
      return;
    }

    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    stage = "استعادة جلسة الدخول";
    renderGate("جارٍ استعادة جلسة الدخول…");
    const sessionResult = await withTimeout(client.auth.getSession(), 12000, "استعادة جلسة الدخول");
    if (sessionResult.error) throw sessionResult.error;
    const session = sessionResult.data?.session;
    if (!session?.user) {
      sendToLogin();
      return;
    }

    // Ask Supabase for the current Auth user so project app_metadata is not
    // taken only from a potentially old browser-cached session object.
    stage = "تأكيد هوية الحساب";
    renderGate("جارٍ تأكيد هوية حساب المغسلة…");
    const authResult = await withTimeout(client.auth.getUser(), 12000, "تأكيد هوية الحساب");
    if (authResult.error) throw authResult.error;
    const user = authResult.data?.user || session.user;
    if (!user?.id) throw new Error("تعذر تحديد هوية المستخدم المسجل.");

    const profile = await loadProfile(client, user);

    stage = "مطابقة الحساب مع مشروع GRAND DRY CLEAN";
    renderGate("تم تحميل الحساب. جارٍ مطابقة صلاحيات GRAND DRY CLEAN…");
    const app = user.app_metadata || {};
    const markers = [
      profile?.project_key, profile?.project_slug, profile?.project_name,
      profile?.tenant_slug, profile?.tenant_name, profile?.business_slug,
      profile?.business_name, profile?.company_slug, profile?.company_name,
      app.poac_project, app.project_key, app.project_slug,
      app.tenant_slug, app.business_slug, app.company_slug
    ].filter(value => value !== null && value !== undefined && String(value).trim())
      .map(normalize);

    const belongsToDryClean = markers.some(value =>
      value.includes("granddryclean") || value.includes("dryclean") || value === "laundry"
    );
    const isCorrectRole = String(profile?.role || "").toLowerCase() === "gm";
    const isActive = profile?.is_active !== false;

    if (!isCorrectRole || !isActive || !belongsToDryClean) {
      await client.auth.signOut();
      renderGate("هذا الحساب غير مخصص لإدارة GRAND DRY CLEAN. تأكد من دور gm وربط المشروع grand-dry-clean في Supabase.", true);
      return;
    }

    // Reveal the protected management interface only after every check succeeds.
    document.body.classList.remove("auth-pending");
    if (gate) gate.hidden = true;

    // Signing out from a business workspace always returns to the central POAC portal.
    // Keep sendToLogin() for expired sessions and failed authorization checks only.
    document.getElementById("logoutBtn")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const button = document.getElementById("logoutBtn");
      if (button) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      }
      try {
        const { error } = await client.auth.signOut();
        if (error) console.error("GRAND DRY CLEAN sign-out failed:", error);
      } catch (error) {
        console.error("GRAND DRY CLEAN sign-out failed:", error);
      } finally {
        location.replace("../index.html");
      }
    });
  } catch (error) {
    console.error("GRAND DRY CLEAN access check failed at stage:", stage, error);
    const isTimeout = String(error?.message || "").startsWith("TIMEOUT:");
    const message = isTimeout
      ? "الاتصال بـ Supabase استغرق وقتًا أطول من المتوقع. تحقق من الاتصال ثم أعد المحاولة."
      : "تعذر إكمال التحقق من الحساب. راجع اتصال Supabase وصلاحية قراءة سجل الحساب.";
    renderGate(message + "\nمرحلة التحقق: " + stage, true);
  }
})();
