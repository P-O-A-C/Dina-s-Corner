(async function () {
  "use strict";

  const gate = document.getElementById("authGate");
  const centralLogin = "../index.html";
  const PROFILE_TIMEOUT = 9000;

  function withTimeout(promise, milliseconds, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("انتهت مهلة " + label)), milliseconds);
      Promise.resolve(promise).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }

  function renderGate(message, actions = false) {
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

    if (actions) {
      const row = document.createElement("div");
      row.className = "auth-gate-actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "إعادة المحاولة";
      retry.addEventListener("click", () => location.reload());
      const login = document.createElement("a");
      login.href = centralLogin;
      login.textContent = "العودة إلى تسجيل POAC";
      row.append(retry, login);
      card.append(row);
    } else {
      const loader = document.createElement("span");
      loader.className = "auth-loader";
      loader.setAttribute("aria-hidden", "true");
      card.append(loader);
    }
    gate.append(card);
  }

  function showError(message) {
    renderGate(message, true);
  }

  async function readProfile(client, userId) {
    let rpcProblem = "";
    try {
      const rpc = await withTimeout(client.rpc("get_my_profile"), PROFILE_TIMEOUT, "تحميل صلاحيات الحساب");
      if (!rpc.error) {
        const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
        if (row) return row;
        rpcProblem = "دالة get_my_profile لم تُرجع سجلًا للحساب";
      } else {
        rpcProblem = rpc.error.message || "تعذر تشغيل get_my_profile";
      }
    } catch (error) {
      rpcProblem = error?.message || "تعذر تحميل صلاحيات الحساب";
    }

    try {
      const direct = await withTimeout(
        client.from("profiles").select("id,email,role,is_active").eq("id", userId).maybeSingle(),
        PROFILE_TIMEOUT,
        "قراءة ملف الحساب"
      );
      if (direct.error) throw direct.error;
      if (!direct.data) throw new Error("لا يوجد سجل مطابق للمستخدم في جدول profiles");
      return direct.data;
    } catch (error) {
      throw new Error("تعذر تحميل ملف الحساب. RPC: " + rpcProblem + " | profiles: " + (error?.message || "خطأ غير معروف"));
    }
  }

  async function rejectAccount(client, message) {
    showError(message);
    // Sign out in the background; do not block the visible error or navigation.
    client.auth.signOut().catch(error => console.warn("Sign-out after denied GRAND DRY CLEAN access failed:", error));
  }

  try {
    renderGate("جارٍ التحقق من حساب GRAND DRY CLEAN. قد يستغرق الاتصال بقاعدة البيانات بضع ثوانٍ…");

    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      showError("إعدادات Supabase أو مكتبة الاتصال غير محمّلة. راجع assets/config.js واتصال الإنترنت.");
      return;
    }

    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const sessionResult = await withTimeout(client.auth.getSession(), PROFILE_TIMEOUT, "استعادة جلسة الدخول");
    if (sessionResult.error) throw sessionResult.error;
    const user = sessionResult.data?.session?.user;
    if (!user?.id) {
      location.replace(centralLogin);
      return;
    }

    const profile = await readProfile(client, user.id);
    const email = String(user.email || profile.email || "").trim().toLowerCase();
    const role = String(profile.role || "").trim().toLowerCase();
    const active = profile.is_active !== false && String(profile.is_active).toLowerCase() !== "false";

    const problems = [];
    if (email !== "granddryclean@poac.com") problems.push("البريد المسجل ليس granddryclean@poac.com");
    if (role !== "gm" && role !== "dryclean") problems.push("الدور المسجل هو " + (role || "غير محدد") + " بدل gm");
    if (!active) problems.push("الحساب غير نشط في profiles");

    if (problems.length) {
      await rejectAccount(client, "لم يتم فتح لوحة المغسلة: " + problems.join("؛ ") + ". راجع بيانات الحساب في Supabase ثم أعد المحاولة.");
      return;
    }

    // Authorized: reveal the existing dashboard without changing its design.
    document.body.classList.remove("auth-pending");
    if (gate) gate.hidden = true;

    const logout = document.getElementById("logoutBtn");
    logout?.addEventListener("click", async event => {
      event.preventDefault();
      logout.setAttribute("aria-disabled", "true");
      logout.disabled = true;
      try {
        await Promise.race([
          client.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
      } catch (error) {
        console.warn("GRAND DRY CLEAN sign-out did not finish:", error);
      }
      location.replace(centralLogin);
    }, { once: true });
  } catch (error) {
    console.error("GRAND DRY CLEAN authorization check failed:", error);
    showError("تعذر إكمال التحقق: " + (error?.message || "خطأ غير معروف") + ". تحقق من الاتصال وإعدادات الحساب ثم اضغط إعادة المحاولة.");
  }
})();
