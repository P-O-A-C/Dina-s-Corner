(async function () {
  "use strict";

  // Prevent a second copy of this guard from starting another auth flow.
  if (window.__GRAND_DRY_CLEAN_GUARD_RUNNING) return;
  window.__GRAND_DRY_CLEAN_GUARD_RUNNING = true;

  const gate = document.getElementById("authGate");
  const centralLogin = "../index.html";
  const EXPECTED_EMAIL = "granddryclean@poac.com";
  const TIMEOUT_MS = 12000;

  function withTimeout(promise, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("انتهت مهلة " + label)), TIMEOUT_MS);
      Promise.resolve(promise).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }

  function renderGate(message, showActions = false) {
    if (!gate) return;
    gate.hidden = false;
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

    if (showActions) {
      const actions = document.createElement("div");
      actions.className = "auth-gate-actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "إعادة المحاولة";
      retry.addEventListener("click", () => location.reload());
      const login = document.createElement("a");
      login.href = centralLogin;
      login.textContent = "العودة إلى تسجيل POAC";
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

  function revealDashboard() {
    // Remove the hiding class first, then hide the gate.
    document.body.classList.remove("auth-pending");
    if (gate) gate.hidden = true;
    document.documentElement.dataset.grandDryCleanAuthorized = "true";
    window.dispatchEvent(new CustomEvent("granddryclean:authorized"));
  }

  function showFailure(message) {
    console.error("GRAND DRY CLEAN access check:", message);
    renderGate(message, true);
  }

  try {
    renderGate("جارٍ التحقق من حساب GRAND DRY CLEAN. قد يستغرق الاتصال بقاعدة البيانات بضع ثوانٍ…");

    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("إعدادات Supabase أو مكتبة الاتصال غير محمّلة.");
    }

    // This page has one auth client. Do not create a second client or call getUser()
    // after getSession(); the profile RPC is the authoritative role check.
    const client = window.__POAC_GRAND_DRY_CLEAN_CLIENT__ || window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
    window.__POAC_GRAND_DRY_CLEAN_CLIENT__ = client;

    const sessionResult = await withTimeout(client.auth.getSession(), "استعادة جلسة الدخول");
    if (sessionResult.error) throw sessionResult.error;
    const user = sessionResult.data?.session?.user;
    if (!user?.id) {
      location.replace(centralLogin);
      return;
    }

    const profileResult = await withTimeout(client.rpc("get_my_profile"), "تحميل ملف الحساب");
    if (profileResult.error) throw profileResult.error;
    const profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
    if (!profile) throw new Error("Supabase لم يُرجع سجل الحساب من profiles.");

    const authEmail = String(user.email || "").trim().toLowerCase();
    const profileEmail = String(profile.email || "").trim().toLowerCase();
    const email = authEmail || profileEmail;
    const role = String(profile.role || "").trim().toLowerCase();
    const isActive = profile.is_active === true || String(profile.is_active).toLowerCase() === "true";

    if (profile.id && profile.id !== user.id) throw new Error("معرّف ملف الحساب لا يطابق جلسة الدخول.");
    if (email !== EXPECTED_EMAIL || (profileEmail && profileEmail !== EXPECTED_EMAIL)) {
      throw new Error("هذا الحساب ليس حساب GRAND DRY CLEAN المخصص.");
    }
    if (role !== "gm" && role !== "dryclean") {
      throw new Error("الدور الحالي غير مصرح به لإدارة المغسلة: " + (role || "غير محدد"));
    }
    if (!isActive) throw new Error("حساب GRAND DRY CLEAN غير نشط في profiles.");

    revealDashboard();

    const logout = document.getElementById("logoutBtn");
    if (logout && !logout.dataset.logoutBound) {
      logout.dataset.logoutBound = "true";
      logout.addEventListener("click", async event => {
        event.preventDefault();
        logout.disabled = true;
        try {
          await Promise.race([
            client.auth.signOut(),
            new Promise(resolve => setTimeout(resolve, 1200))
          ]);
        } catch (error) {
          console.warn("GRAND DRY CLEAN sign-out:", error);
        }
        location.replace(centralLogin);
      });
    }
  } catch (error) {
    showFailure("تعذر فتح لوحة المغسلة: " + (error?.message || "خطأ غير معروف") + ". أعد المحاولة أو ارجع إلى تسجيل POAC.");
  } finally {
    window.__GRAND_DRY_CLEAN_GUARD_RUNNING = false;
  }
})();
