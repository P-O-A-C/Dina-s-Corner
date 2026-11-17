(async function () {
  "use strict";

  const gate = document.getElementById("authGate");
  const sendToLogin = () => location.replace("../index.html");
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
    const card = document.createElement("div"); card.className = "auth-gate-card";
    const mark = document.createElement("span"); mark.className = "auth-gate-mark"; mark.textContent = "G";
    const brand = document.createElement("span"); brand.className = "auth-gate-brand"; brand.textContent = "GRAND DRY CLEAN";
    const text = document.createElement("p"); text.textContent = message; text.setAttribute("aria-live", "polite");
    card.append(mark, brand, text);
    if (withRetry) {
      const actions = document.createElement("div"); actions.className = "auth-gate-actions";
      const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "إعادة المحاولة";
      retry.addEventListener("click", () => location.reload());
      const login = document.createElement("a"); login.href = "../index.html"; login.textContent = "العودة إلى تسجيل POAC";
      actions.append(retry, login); card.append(actions);
    } else {
      const loader = document.createElement("span"); loader.className = "auth-loader"; loader.setAttribute("aria-hidden", "true"); card.append(loader);
    }
    gate.append(card);
  }

  async function loadProfile(client, user) {
    stage = "تحميل صلاحيات الحساب";
    renderGate("تم استعادة الجلسة. جارٍ تحميل صلاحيات حساب المغسلة…");
    let rpcError = null;
    try {
      const result = await withTimeout(client.rpc("get_my_profile"), 10000, "تحميل صلاحيات الحساب");
      if (result.error) rpcError = result.error;
      else {
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        if (row) return row;
      }
    } catch (error) { rpcError = error; }

    stage = "قراءة سجل الحساب";
    renderGate("الـRPC لم يُرجع ملف الحساب. جارٍ تجربة قراءة سجل الحساب مباشرة…");
    const direct = await withTimeout(
      client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      10000,
      "قراءة سجل الحساب"
    );
    if (direct.error) {
      const detail = rpcError?.message ? " (RPC: " + rpcError.message + ")" : "";
      throw new Error("تعذر قراءة سجل الحساب: " + direct.error.message + detail);
    }
    if (!direct.data) throw new Error("لم يتم العثور على سجل هذا الحساب في profiles.");
    return direct.data;
  }

  async function denyAccess(client, reasons) {
    // Show a useful state immediately. A slow signOut must never leave the loader on screen.
    renderGate("لم يتم فتح لوحة الإدارة. " + reasons.join("؛ ") + "。\nتأكد من حساب granddryclean@poac.com وأن دوره الداخلي gm (أو DryClean مؤقتًا).", true);
    try {
      await Promise.race([
        client.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 1200))
      ]);
    } catch (error) {
      console.warn("GRAND DRY CLEAN sign-out after denied access failed:", error);
    }
  }

  try {
    stage = "تحميل إعدادات Supabase";
    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      renderGate("تعذر تحميل مكتبة Supabase أو إعدادات الاتصال. تأكد من تحميل الشبكة وملفي assets/config.js ومكتبة Supabase.", true);
      return;
    }

    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    stage = "استعادة جلسة الدخول";
    renderGate("جارٍ استعادة جلسة الدخول…");
    const sessionResult = await withTimeout(client.auth.getSession(), 10000, "استعادة جلسة الدخول");
    if (sessionResult.error) throw sessionResult.error;
    const session = sessionResult.data?.session;
    if (!session?.user) { sendToLogin(); return; }

    stage = "تأكيد هوية الحساب";
    renderGate("جارٍ تأكيد هوية حساب المغسلة…");
    const authResult = await withTimeout(client.auth.getUser(), 10000, "تأكيد هوية الحساب");
    if (authResult.error) throw authResult.error;
    const user = authResult.data?.user || session.user;
    if (!user?.id) throw new Error("تعذر تحديد هوية المستخدم المسجل.");

    const profile = await loadProfile(client, user);
    stage = "مطابقة البريد والدور";
    renderGate("تم تحميل الحساب. جارٍ مطابقة البريد والدور…");

    const email = String(user.email || profile.email || "").trim().toLowerCase();
    const role = String(profile.role || "").trim().toLowerCase();
    const active = profile.is_active !== false;
    const reasons = [];
    if (email !== "granddryclean@poac.com") reasons.push("البريد المسجل ليس بريد حساب المغسلة");
    if (!(["gm", "dryclean"].includes(role))) reasons.push("الدور الحالي هو " + (role || "غير محدد"));
    if (!active) reasons.push("الحساب غير نشط");

    if (reasons.length) {
      await denyAccess(client, reasons);
      return;
    }

    document.body.classList.remove("auth-pending");
    if (gate) gate.hidden = true;

    document.getElementById("logoutBtn")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const button = document.getElementById("logoutBtn");
      if (button) { button.disabled = true; button.setAttribute("aria-disabled", "true"); }
      try {
        await Promise.race([
          client.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);
      } catch (error) { console.error("GRAND DRY CLEAN sign-out failed:", error); }
      location.replace("../index.html");
    });
  } catch (error) {
    console.error("GRAND DRY CLEAN access check failed at stage:", stage, error);
    const message = String(error?.message || "").startsWith("TIMEOUT:")
      ? "انتهت مهلة الاتصال أثناء " + stage + ". تحقق من الاتصال ثم أعد المحاولة."
      : "تعذر إكمال التحقق أثناء " + stage + ": " + (error?.message || "خطأ غير معروف");
    renderGate(message, true);
  }
})();
