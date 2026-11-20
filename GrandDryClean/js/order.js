(() => {
  "use strict";

  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const status = document.getElementById("catalogStatus");
  const ironingSection = document.getElementById("ironingPricesSection");
  const ironingGrid = document.getElementById("ironingPricesGrid");
  if (!grid || !tabs) return;

  const IRONING_CATEGORY = "مكواة فقط";
  const WASH_IRON_TAB = "غسيل ومكواة";
  const WASH_IRON_CATEGORY = "غسيل وكي";

  const fallbackProducts = [
    { id: "service-wash", name: "غسيل وكي", category: "غسيل وكي", description: "عناية يومية بالملابس مع الغسيل والكي.", image: "assets/gdc-service-washing.jpg" },
    { id: "service-dry", name: "تنظيف جاف", category: "تنظيف جاف", description: "تنظيف متخصص للبدل والقطع الحساسة.", image: "assets/gdc-service-dryclean.jpg" },
    { id: "service-home", name: "مفروشات", category: "مفروشات", description: "تنظيف المفروشات والبطاطين والستائر.", image: "assets/gdc-service-furnishings.jpg" }
  ];

  // Reuse the garment photographs already included in this project.
  const ironingImages = {
    "قميص": "shirt.jpg",
    "تيشيرت": "tshirt.jpg",
    "بلوزة": "blouse.jpg",
    "بنطلون جينز": "trousers-jeans.jpg",
    "بنطلون جبردين": "trousers-gabardine.jpg",
    "فستان كاجوال": "casual-dress.jpg",
    "جيبة": "skirt.jpg",
    "عباية حريمي": "womens-abaya.jpg",
    "جلابية": "galabeya.jpg",
    "سويت شيرت": "hoodie.jpg",
    "بلوفر": "pullover.jpg",
    "هودي": "hoodie.jpg",
    "بيجامة (قطعتين)": "pajama-2-piece.jpg",
    "ترينج رياضي (قطعتين)": "tracksuit-2-piece.jpg",
    "بدلة (قطعتين)": "suit-2-piece.jpg",
    "بدلة (3 قطع)": "suit-3-piece.jpg",
    "جاكيت بدلة": "suit-jacket.jpg",
    "جاكيت بامب": "jacket.jpg",
    "جاكيت جوخ": "coat-wool.jpg",
    "بالطو طويل": "coat-long.jpg",
    "فستان سواريه": "evening-dress.jpg",
    "فستان زفاف": "wedding-dress.jpg",
    "كرافتة": "tie.jpg",
    "شال": "shawl.jpg"
  };

  let products = fallbackProducts;
  let ironingPrices = [];
  let ironingPricesLoading = true;
  let ironingPricesError = false;
  let activeCategory = "الكل";

  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function getCategories() {
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
    const withoutWashIron = categories.filter(category => category !== WASH_IRON_CATEGORY && category !== WASH_IRON_TAB);
    return ["الكل", WASH_IRON_TAB, ...withoutWashIron, IRONING_CATEGORY];
  }

  function formatEGP(value) {
    return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value))} ج.م`;
  }

  function renderIroningPrices() {
    if (!ironingSection || !ironingGrid) return;

    const showIroning = activeCategory === IRONING_CATEGORY;
    ironingSection.hidden = !showIroning;
    if (!showIroning) return;

    if (ironingPricesLoading) {
      ironingGrid.innerHTML = '<div class="catalog-empty">جارٍ تحميل أصناف الكي…</div>';
      return;
    }

    if (ironingPricesError) {
      ironingGrid.innerHTML = '<div class="catalog-empty">تعذر تحميل أصناف الكي حاليًا. تأكد من إعداد جدول أسعار الكي في قاعدة البيانات.</div>';
      return;
    }

    if (!ironingPrices.length) {
      ironingGrid.innerHTML = '<div class="catalog-empty">لا توجد أصناف كي متاحة حاليًا.</div>';
      return;
    }

    ironingGrid.innerHTML = ironingPrices.map(row => {
      const itemName = String(row.item_name || "");
      const imageFile = ironingImages[itemName];
      const imageMarkup = imageFile
        ? `<img class="ironing-product-image" src="assets/products/${safe(imageFile)}" alt="${safe(itemName)}" loading="lazy">`
        : '<div class="ironing-product-image-empty" aria-hidden="true"></div>';
      const priceLabel = row.price === null || row.price === undefined
        ? safe(row.note || "السعر عند المعاينة")
        : formatEGP(row.price);

      return `
        <article class="ironing-product-card">
          <div class="ironing-product-image-wrap">${imageMarkup}</div>
          <div class="ironing-product-info">
            <h3>${safe(itemName)}</h3>
            <strong class="ironing-product-price">${priceLabel}</strong>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadIroningPrices(client) {
    ironingPricesLoading = true;
    ironingPricesError = false;
    renderIroningPrices();

    try {
      const { data, error } = await client.from("gdc_ironing_prices")
        .select("id,item_name,price,note,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      ironingPrices = Array.isArray(data) ? data : [];
      ironingPricesLoading = false;
      ironingPricesError = false;
    } catch (error) {
      console.warn("GRAND DRY CLEAN ironing prices could not be loaded:", error);
      ironingPrices = [];
      ironingPricesLoading = false;
      ironingPricesError = true;
    }

    renderIroningPrices();
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
    const showIroning = activeCategory === IRONING_CATEGORY;
    grid.hidden = showIroning;
    renderIroningPrices();
    if (showIroning) return;

    const visible = activeCategory === "الكل"
      ? products
      : products.filter(product => activeCategory === WASH_IRON_TAB
        ? (product.category === WASH_IRON_CATEGORY || product.category === WASH_IRON_TAB)
        : product.category === activeCategory);

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
      ironingPricesLoading = false;
      ironingPricesError = true;
      renderIroningPrices();
      return;
    }

    try {
      const client = window.__GDC_PUBLIC_CATALOG_CLIENT__ || window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
      window.__GDC_PUBLIC_CATALOG_CLIENT__ = client;
      loadIroningPrices(client);

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
      if (activeCategory !== IRONING_CATEGORY && !getCategories().includes(activeCategory)) {
        activeCategory = "الكل";
      }
      render();
      status.textContent = products.length ? "" : "لا توجد خدمات منشورة حاليًا.";
    } catch (error) {
      console.error("GRAND DRY CLEAN services could not be loaded:", error);
      status.textContent = "تعذر تحميل الخدمات المحدثة حاليًا؛ يتم عرض الخدمات المتاحة محليًا.";
    }
  }

  loadManagedCatalog();
})();
