(() => {
  "use strict";

  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const status = document.getElementById("catalogStatus");
  if (!grid || !tabs) return;

  const normalize = value => String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[()\[\]{}]/g, " ")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // The admin has one Wash & Iron category. Normalize spelling aliases to it
  // so the customer page does not create a duplicate, artificial tab.
  function categoryLabel(value) {
    const raw = String(value || "").trim();
    const key = normalize(raw).replace(/\s/g, "");
    if (["غسيلوكي", "غسيلوكوي", "غسيلومكواة", "غسيلومكوه"].includes(key)) return "غسيل وكوي";
    return raw;
  }

  const imageFiles = {
    "قميص": "shirt.jpg",
    "تيشيرت": "tshirt.jpg", "تي شيرت": "tshirt.jpg", "تيشرت": "tshirt.jpg",
    "بلوزة": "blouse.jpg", "بلوفر": "pullover.jpg",
    "بنطلون جينز": "trousers-jeans.jpg", "بنطلون جبردين": "trousers-gabardine.jpg", "بنطلون عادي": "trousers-gabardine.jpg", "بنطلون": "trousers-gabardine.jpg",
    "فستان كاجوال": "casual-dress.jpg", "جيبة": "skirt.jpg", "عباية حريمي": "womens-abaya.jpg", "جلابية": "galabeya.jpg",
    "سويت شيرت": "hoodie.jpg", "هودي": "hoodie.jpg", "بيجامة قطعتين": "pajama-2-piece.jpg", "بيجامة 2 قطعة": "pajama-2-piece.jpg",
    "ترينج رياضي قطعتين": "tracksuit-2-piece.jpg", "ترينج رياضي 2 قطعة": "tracksuit-2-piece.jpg",
    "بدلة 2 قطعة": "suit-2-piece.jpg", "بدلة قطعتين": "suit-2-piece.jpg", "بدلة 3 قطع": "suit-3-piece.jpg",
    "جاكيت بدلة": "suit-jacket.jpg", "جاكيت جلد": "leather-jacket.jpg", "جاكيت": "jacket.jpg",
    "كرافتة": "tie.jpg", "شال": "shawl.jpg", "طرحة": "shawl.jpg", "بالطو جوخ": "coat-wool.jpg", "جاكيت جوخ": "coat-wool.jpg", "بالطو طويل": "coat-long.jpg",
    "فستان سواريه": "evening-dress.jpg", "فستان زفاف": "wedding-dress.jpg", "جوارب": "socks.jpg", "شورت جبردين": "shorts-gabardine.jpg",
    "مريلة": "apron.jpg", "تونيك": "tunic.jpg", "تي بولو": "polo-shirt.jpg", "سجاد": "carpet.jpg", "فوطة": "towel.jpg",
    "بطانيه فرد": "furnishings/01_blanket_single.png", "بطانية فرد": "furnishings/01_blanket_single.png",
    "بطانية فردين": "furnishings/02_blanket_double.png", "بطانية (فردين)": "furnishings/02_blanket_double.png",
    "لحاف فايبر كبير": "furnishings/03_fiber_duvet_large.png", "لحاف فايبر (كبير)": "furnishings/03_fiber_duvet_large.png",
    "لحاف فايبر صغير": "furnishings/04_fiber_duvet_small.png", "لحاف فايبر (صغير)": "furnishings/04_fiber_duvet_small.png",
    "كوفرتة": "furnishings/05_quilt_coverlet.png", "مفرش سرير": "furnishings/06_bedspread.png",
    "مخدة كبيرة": "furnishings/07_pillow_large.png", "خددية صغيرة": "furnishings/08_pillow_small.png", "خدادية صغيرة": "furnishings/08_pillow_small.png",
    "متر السجاد العادي": "carpet.jpg", "متر السجاد العادى": "carpet.jpg", "متر السجاد شاج او فرو": "carpet.jpg", "متر السجاد شاج أو فرو": "carpet.jpg"
  };
  const normalizedImages = new Map(Object.entries(imageFiles).map(([name, file]) => [normalize(name), file]));
  function localProductImage(product) {
    const file = normalizedImages.get(normalize(product.name));
    return file ? `assets/products/${file}` : "";
  }

  const fallbackProducts = [
    { id: "service-wash", name: "غسيل وكوي", category: "غسيل وكوي", description: "عناية يومية بالملابس مع الغسيل والكي.", image: "assets/gdc-service-washing.jpg" },
    { id: "service-dry", name: "تنظيف جاف", category: "تنظيف جاف", description: "تنظيف متخصص للبدل والقطع الحساسة.", image: "assets/gdc-service-dryclean.jpg" },
    { id: "service-home", name: "مفروشات", category: "مفروشات", description: "تنظيف المفروشات والبطاطين والستائر.", image: "assets/gdc-service-furnishings.jpg" }
  ];

  let products = fallbackProducts;
  let serviceCategories = fallbackProducts.map(item => item.category);
  let activeCategory = "الكل";

  const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function getCategories() {
    const unique = [...new Set(serviceCategories.map(categoryLabel).filter(Boolean))];
    return ["الكل", ...unique];
  }

  function formatEGP(value) {
    return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value))} ج.م`;
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
      : products.filter(product => categoryLabel(product.category) === activeCategory);

    if (!visible.length) {
      grid.innerHTML = '<div class="catalog-empty">لا توجد أصناف متاحة في هذا القسم حاليًا.</div>';
      return;
    }

    grid.innerHTML = visible.map(product => {
      const localImage = localProductImage(product);
      const storedImage = String(product.image || "").trim();
      // Prefer the versioned local file for known products. If it fails,
      // fall back to the stored Supabase URL when one exists.
      const image = localImage || storedImage;
      const backup = localImage && storedImage && localImage !== storedImage ? storedImage : "";
      const imageMarkup = image
        ? `<img class="service-image" src="${safe(image)}" ${backup ? `data-fallback="${safe(backup)}"` : ""} alt="${safe(product.name)}" loading="lazy" onerror="if(this.dataset.fallback && !this.dataset.fallbackTried){this.dataset.fallbackTried='1';this.src=this.dataset.fallback;}else{this.hidden=true;this.nextElementSibling.hidden=false;}">`
        : "";
      const priceValue = product.price;
      const hasPrice = priceValue !== null && priceValue !== undefined && priceValue !== "";
      const detailsMarkup = hasPrice
        ? `<strong class="service-price">${formatEGP(priceValue)}</strong>`
        : (product.description ? `<p>${safe(product.description)}</p>` : "");
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

      serviceCategories = (categoryResult.data || []).map(row => categoryLabel(row.name)).filter(Boolean);
      const allowedCategories = new Set(serviceCategories);
      products = (itemResult.data || [])
        .filter(row => allowedCategories.has(categoryLabel(row.category_name)))
        .map(row => ({
          id: String(row.id),
          name: row.name || "",
          category: categoryLabel(row.category_name || ""),
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
