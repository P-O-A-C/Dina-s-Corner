(() => {
  "use strict";

  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const status = document.getElementById("catalogStatus");
  if (!grid || !tabs) return;

  const WASH_IRON_TAB = "غسيل ومكواة";
  const WASH_IRON_CATEGORY = "غسيل وكي";

  // Local image fallbacks for the furnishings products. The matching PNG files
  // are included in this patch, so the catalogue can display photos without
  // waiting for image_url updates to finish in Supabase.
  const furnishingsImages = {
    "بطانيه فرد": "assets/products/furnishings/01_blanket_single.png",
    "بطانية فرد": "assets/products/furnishings/01_blanket_single.png",
    "بطانية (فردين)": "assets/products/furnishings/02_blanket_double.png",
    "لحاف فايبر (كبير)": "assets/products/furnishings/03_fiber_duvet_large.png",
    "لحاف فايبر (صغير)": "assets/products/furnishings/04_fiber_duvet_small.png",
    "كوفرتة": "assets/products/furnishings/05_quilt_coverlet.png",
    "مفرش سرير": "assets/products/furnishings/06_bedspread.png",
    "مخدة كبيرة": "assets/products/furnishings/07_pillow_large.png",
    "خددية صغيرة": "assets/products/furnishings/08_pillow_small.png",
    "خدادية صغيرة": "assets/products/furnishings/08_pillow_small.png",
    "متر السجاد العادي": "assets/products/carpet.jpg",
    "متر السجاد العادى": "assets/products/carpet.jpg",
    "متر السجاد شاج أو فرو": "assets/products/carpet.jpg",
    "متر السجاد شاج او فرو": "assets/products/carpet.jpg"
  };

  function localProductImage(product) {
    if (String(product.category || "").trim() !== "مفروشات") return "";
    const name = String(product.name || "").replace(/\s+/g, " ").trim();
    return furnishingsImages[name] || "";
  }
  const fallbackProducts = [
    { id: "service-wash", name: "غسيل وكي", category: WASH_IRON_CATEGORY, description: "عناية يومية بالملابس مع الغسيل والكي.", image: "assets/gdc-service-washing.jpg", price: null },
    { id: "service-dry", name: "تنظيف جاف", category: "تنظيف جاف", description: "تنظيف متخصص للبدل والقطع الحساسة.", image: "assets/gdc-service-dryclean.jpg", price: null },
    { id: "service-home", name: "مفروشات", category: "مفروشات", description: "تنظيف المفروشات والبطاطين والستائر.", image: "assets/gdc-service-furnishings.jpg", price: null }
  ];

  let products = fallbackProducts;
  let serviceCategories = [WASH_IRON_CATEGORY, "تنظيف جاف", "مفروشات"];
  let activeCategory = "الكل";

  const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function formatEGP(value) {
    return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value))} ج.م`;
  }

  function getCategories() {
    const available = serviceCategories.filter(Boolean);
    const remaining = available.filter(category => category !== WASH_IRON_CATEGORY && category !== WASH_IRON_TAB);
    return ["الكل", WASH_IRON_TAB, ...remaining];
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
      : products.filter(product => activeCategory === WASH_IRON_TAB
        ? (product.category === WASH_IRON_CATEGORY || product.category === WASH_IRON_TAB)
        : product.category === activeCategory);

    if (!visible.length) {
      grid.innerHTML = '<div class="catalog-empty">لا توجد أصناف متاحة في هذا القسم حاليًا.</div>';
      return;
    }

    grid.innerHTML = visible.map(product => {
      const fallbackImage = localProductImage(product);
      const image = String(product.image || fallbackImage || "").trim();
      const fallbackAttribute = fallbackImage ? `data-fallback="${safe(fallbackImage)}"` : "";
      const imageMarkup = image
        ? `<img class="service-image" src="${safe(image)}" ${fallbackAttribute} alt="${safe(product.name)}" loading="lazy" onerror="if(this.dataset.fallback && !this.dataset.fallbackTried){this.dataset.fallbackTried='1';this.src=this.dataset.fallback;}else{this.hidden=true;this.nextElementSibling.hidden=false;}">`
        : "";
      const description = String(product.description || "").trim();
      const hasPrice = product.price !== null && product.price !== undefined && product.price !== "";
      const detailsMarkup = hasPrice
        ? `<strong class="service-price">${formatEGP(product.price)}</strong>`
        : (description ? `<p>${safe(description)}</p>` : "");
      return `
        <article class="service-card">
          <div class="service-image-wrap">
            ${imageMarkup}
            <div class="service-image-empty" ${image ? "hidden" : ""} aria-hidden="true"></div>
          </div>
          <div class="service-info">
            <h2>${safe(product.name)}</h2>
            ${detailsMarkup}
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
  if (status) status.textContent = "";

  async function loadManagedCatalog() {
    const config = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
      if (status) status.textContent = "تعذر الاتصال بالخدمات المحدثة؛ يتم عرض الخدمات المتاحة محليًا.";
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
          .select("id,name,category_name,description,price,image_url,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      ]);

      if (categoryResult.error) throw categoryResult.error;
      if (itemResult.error) throw itemResult.error;

      serviceCategories = (categoryResult.data || []).map(row => row.name).filter(Boolean);
      const allowedCategories = new Set(serviceCategories);
      products = (itemResult.data || [])
        .filter(row => allowedCategories.has(row.category_name))
        .map(row => ({
          id: String(row.id),
          name: row.name || "",
          category: row.category_name || "",
          description: row.description || "",
          price: row.price,
          image: row.image_url || ""
        }));

      if (!getCategories().includes(activeCategory)) activeCategory = "الكل";
      render();
      if (status) status.textContent = products.length ? "" : "لا توجد خدمات منشورة حاليًا.";
    } catch (error) {
      console.error("GRAND DRY CLEAN services could not be loaded:", error);
      if (status) status.textContent = "تعذر تحميل الخدمات المحدثة حاليًا؛ يتم عرض الخدمات المتاحة محليًا.";
    }
  }

  loadManagedCatalog();
})();
