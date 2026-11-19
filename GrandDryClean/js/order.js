(() => {
  "use strict";

  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const status = document.getElementById("catalogStatus");
  if (!grid || !tabs) return;

  const fallbackProducts = [
    { id: "service-wash", name: "غسيل وكي", category: "غسيل وكي", description: "عناية يومية بالملابس مع الغسيل والكي.", image: "assets/gdc-service-washing.jpg" },
    { id: "service-dry", name: "تنظيف جاف", category: "تنظيف جاف", description: "تنظيف متخصص للبدل والقطع الحساسة.", image: "assets/gdc-service-dryclean.jpg" },
    { id: "service-home", name: "مفروشات", category: "مفروشات", description: "تنظيف المفروشات والبطاطين والستائر.", image: "assets/gdc-service-furnishings.jpg" }
  ];

  let products = fallbackProducts;
  let activeCategory = "الكل";

  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function getCategories() {
    return ["الكل", ...new Set(products.map(product => product.category).filter(Boolean))];
  }

  function renderCategories() {
    tabs.innerHTML = getCategories().map(category => `
      <button class="category-tab ${category === activeCategory ? "active" : ""}"
        type="button" data-category="${safe(category)}"
        aria-pressed="${category === activeCategory}">${safe(category)}</button>
    `).join("");

    tabs.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        renderCategories();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    const visible = activeCategory === "الكل"
      ? products
      : products.filter(product => product.category === activeCategory);

    if (!visible.length) {
      grid.innerHTML = '<div class="catalog-empty">لا توجد خدمات متاحة في هذا القسم حاليًا.</div>';
      return;
    }

    grid.innerHTML = visible.map(product => {
      const image = String(product.image || "").trim();
      const imageMarkup = image
        ? `<img class="service-image" src="${safe(image)}" alt="${safe(product.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">`
        : "";
      return `
        <article class="service-card">
          <div class="service-image-wrap">
            ${imageMarkup}
            <div class="service-image-empty" ${image ? "hidden" : ""} aria-hidden="true"></div>
          </div>
          <div class="service-info">
            <h2>${safe(product.name)}</h2>
            <p>${safe(product.description || "")}</p>
          </div>
        </article>
      `;
    }).join("");
  }

  function render() {
    renderCategories();
    renderProducts();
  }

  render();
  status.textContent = "";

  async function loadManagedCatalog() {
    const config = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
      status.textContent = "تعذر الاتصال بالخدمات المحدثة؛ يتم عرض الخدمات المتاحة محليًا.";
      return;
    }

    try {
      const client = window.__GDC_PUBLIC_CATALOG_CLIENT__ || window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
      window.__GDC_PUBLIC_CATALOG_CLIENT__ = client;

      const [categoryResult, itemResult] = await Promise.all([
        client.from("gdc_service_categories")
          .select("name,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        client.from("gdc_service_items")
          .select("id,name,category_name,description,image_url,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      ]);

      if (categoryResult.error) throw categoryResult.error;
      if (itemResult.error) throw itemResult.error;

      const allowedCategories = new Set((categoryResult.data || []).map(row => row.name));
      const managedProducts = (itemResult.data || [])
        .filter(row => allowedCategories.has(row.category_name))
        .map(row => ({
          id: String(row.id),
          name: row.name || "",
          category: row.category_name || "",
          description: row.description || "",
          image: row.image_url || ""
        }));

      products = managedProducts;
      activeCategory = "الكل";
      render();
      status.textContent = products.length ? "" : "لا توجد خدمات منشورة حاليًا.";
    } catch (error) {
      console.error("GRAND DRY CLEAN services could not be loaded:", error);
      status.textContent = "تعذر تحميل الخدمات المحدثة حاليًا؛ يتم عرض الخدمات المتاحة محليًا.";
    }
  }

  loadManagedCatalog();
})();
