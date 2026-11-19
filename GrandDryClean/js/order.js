// Public customer ordering page for GRAND DRY CLEAN.
// No management access, no database writes, and no prices until the business approves them.
const WHATSAPP_NUMBER = "201005854115";
let PRODUCTS = [
  {id:"shirt",name:"قميص",category:"غسيل وكي",description:"غسيل وكي للقمصان",icon:"👔",art:"art-daily"},
  {id:"trousers",name:"بنطلون",category:"غسيل وكي",description:"غسيل وكي للبناطيل",icon:"👖",art:"art-daily"},
  {id:"tshirt",name:"تيشيرت",category:"غسيل وكي",description:"عناية بالملابس اليومية",icon:"👕",art:"art-daily"},
  {id:"suit",name:"بدلة",category:"تنظيف جاف",description:"تنظيف جاف للبدل والقطع الرسمية",icon:"🧥",art:"art-dry"},
  {id:"dress",name:"فستان",category:"تنظيف جاف",description:"تنظيف وعناية بالفساتين",icon:"👗",art:"art-dry"},
  {id:"jacket",name:"جاكيت",category:"تنظيف جاف",description:"تنظيف الجواكت والملابس الخارجية",icon:"🧥",art:"art-dry"},
  {id:"blanket",name:"بطانية",category:"مفروشات",description:"تنظيف البطاطين والمفروشات",icon:"🛏️",art:"art-home"},
  {id:"curtain",name:"ستارة",category:"مفروشات",description:"تنظيف الستائر",icon:"🪟",art:"art-home"},
  {id:"cover",name:"مفرش سرير",category:"مفروشات",description:"تنظيف مفارش الأسرة",icon:"🧺",art:"art-home"}
];
let activeCategory = "الكل";
const cart = new Map();
const $ = id => document.getElementById(id);
const totalQty = () => [...cart.values()].reduce((sum,item)=>sum+item.qty,0);
const safe = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function renderCategories(){
  const categories = ["الكل",...new Set(PRODUCTS.map(p=>p.category))];
  $("categoryTabs").innerHTML = categories.map(category=>
    `<button class="category-tab ${category===activeCategory?"active":""}" type="button" data-category="${safe(category)}" aria-pressed="${category===activeCategory}">${safe(category)}</button>`
  ).join("");
  $("categoryTabs").querySelectorAll("[data-category]").forEach(button=>button.addEventListener("click",()=>{
    activeCategory = button.dataset.category;
    renderCategories();
    renderProducts();
  }));
}
function renderProducts(){
  const visible = activeCategory === "الكل" ? PRODUCTS : PRODUCTS.filter(p=>p.category===activeCategory);
  $("productsGrid").innerHTML = visible.map(product=>{
    const qty = cart.get(product.id)?.qty || 0;
    return `<article class="service-card">
      <div class="service-art ${product.art}"><span>${product.icon}</span></div>
      <div class="service-info"><h3>${safe(product.name)}</h3><p>${safe(product.description)}</p>
        <div class="service-bottom"><span class="price-hint">السعر عند التأكيد</span>
          <button class="add-button ${qty?"added":""}" type="button" data-add="${product.id}" aria-label="إضافة ${safe(product.name)} للطلب">${qty?`مضاف · ${qty}`:"أضف للطلب +"}</button>
        </div>
      </div>
    </article>`;
  }).join("");
  $("productsGrid").querySelectorAll("[data-add]").forEach(button=>button.addEventListener("click",()=>addItem(button.dataset.add)));
}
function addItem(id){
  const product = PRODUCTS.find(p=>p.id===id);
  if(!product)return;
  const current = cart.get(id);
  cart.set(id,{...product,qty:(current?.qty||0)+1});
  renderAll();
}
function changeQty(id,delta){
  const item = cart.get(id);
  if(!item)return;
  item.qty += delta;
  if(item.qty<=0)cart.delete(id);
  else cart.set(id,item);
  renderAll();
}
function quantityControls(id,qty){
  return `<div class="${id.startsWith("mini-")?"mini-qty":"qty-control"}"><button type="button" data-qty="${id.replace(/^mini-/,"")}" data-delta="-1" aria-label="تقليل الكمية">−</button><b>${qty}</b><button type="button" data-qty="${id.replace(/^mini-/,"")}" data-delta="1" aria-label="زيادة الكمية">+</button></div>`;
}
function renderItems(){
  const items = [...cart.values()];
  const total = totalQty();
  $("mobileCount").textContent = total;
  $("desktopCount").textContent = total;
  $("drawerCount").textContent = `${total} قطعة`;
  $("desktopTotal").textContent = `${total} قطعة`;
  if(!items.length){
    $("desktopItems").innerHTML = '<div class="summary-empty"><span>＋</span><b>لسه ما اخترتش حاجة</b><small>اختار القطع وهتظهر هنا</small></div>';
    $("drawerItems").innerHTML = '<p class="empty-drawer">لم تضف أي قطع بعد.</p>';
  }else{
    $("desktopItems").innerHTML = items.map(item=>`<div class="summary-line"><div><strong>${safe(item.name)}</strong><small>${safe(item.category)}</small></div>${quantityControls("mini-"+item.id,item.qty)}</div>`).join("");
    $("drawerItems").innerHTML = items.map(item=>`<div class="drawer-line"><div><strong>${safe(item.name)}</strong><small>${safe(item.category)} · السعر عند التأكيد</small></div>${quantityControls(item.id,item.qty)}</div>`).join("");
  }
  document.querySelectorAll("[data-qty]").forEach(button=>button.addEventListener("click",()=>changeQty(button.dataset.qty,Number(button.dataset.delta))));
}
function renderAll(){renderItems();renderProducts();}
function openDrawer(){
  if(!cart.size){
    $("productsGrid").scrollIntoView({behavior:"smooth",block:"center"});
    $("categoryTabs").focus?.();
    return;
  }
  document.body.classList.add("drawer-open");
  $("orderDrawer").setAttribute("aria-hidden","false");
  $("customerName").focus({preventScroll:true});
}
function closeDrawer(){
  document.body.classList.remove("drawer-open");
  $("orderDrawer").setAttribute("aria-hidden","true");
}
$("desktopContinue").addEventListener("click",openDrawer);
$("mobileContinue").addEventListener("click",openDrawer);
$("closeDrawer").addEventListener("click",closeDrawer);
$("drawerBackdrop").addEventListener("click",closeDrawer);
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeDrawer();});

$("orderForm").addEventListener("submit",event=>{
  event.preventDefault();
  if(!cart.size){alert("اختار قطعة واحدة على الأقل قبل إرسال الطلب.");closeDrawer();return;}
  const name=$("customerName").value.trim();
  const phone=$("customerPhone").value.trim();
  const address=$("customerAddress").value.trim();
  const latitude=$("customerLat").value.trim();
  const longitude=$("customerLng").value.trim();
  const notes=$("customerNotes").value.trim();
  if(!name||!phone){alert("اكتب الاسم ورقم الموبايل لإكمال الطلب.");return;}
  const items=[...cart.values()].map(item=>`- ${item.name} × ${item.qty} (${item.category})`).join("\n");
  const message=[
    "طلب جديد - GRAND DRY CLEAN",
    "",
    "القطع المطلوبة:",
    items,
    "",
    `الاسم: ${name}`,
    `رقم الموبايل: ${phone}`,
    address?`العنوان: ${address}`:"",
    latitude && longitude?`موقع Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`:"",
    notes?`ملاحظات: ${notes}`:"",
    "",
    "برجاء تأكيد السعر والتفاصيل."
  ].filter(Boolean).join("\n");
  const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.location.href=url;
});

renderCategories();
renderAll();

// Load the active GRAND DRY CLEAN catalogue from its dedicated Supabase tables.
// A local starter catalogue remains visible if the public network is unavailable.
(async function loadManagedCatalog() {
  const config = window.POA_CONFIG || {};
  if (!window.supabase?.createClient || !config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) return;
  try {
    const catalogClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const [categoryResult, itemResult] = await Promise.all([
      catalogClient.from("gdc_service_categories").select("name,is_active,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
      catalogClient.from("gdc_service_items").select("id,name,category_name,description,icon,image_url,price,is_active,sort_order").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true })
    ]);
    if (categoryResult.error) throw categoryResult.error;
    if (itemResult.error) throw itemResult.error;
    const allowedCategories = new Set((categoryResult.data || []).map(row => row.name));
    PRODUCTS = (itemResult.data || []).filter(row => allowedCategories.has(row.category_name)).map(row => ({
      id: String(row.id),
      name: row.name || "",
      category: row.category_name || "",
      description: row.description || "",
      icon: row.icon || "♧",
      art: /جاف|dry/i.test(row.category_name || "") ? "art-dry" : /مفروش|home/i.test(row.category_name || "") ? "art-home" : "art-daily",
      image: row.image_url || "",
      price: row.price
    }));
    renderCategories();
    renderAll();
  } catch (error) {
    console.warn("GRAND DRY CLEAN public catalogue could not be loaded; the starter catalogue remains visible:", error?.message || error);
  }
})();

// Location picker: map pin selection, reverse-geocoded address, and Google Maps link.
(()=>{
  const modal=document.getElementById("locationModal"); if(!modal||!window.L)return;
  let map,marker,picked=null;
  const label=document.getElementById("locationLabel"), addressInput=document.getElementById("customerAddress"), latInput=document.getElementById("customerLat"), lngInput=document.getElementById("customerLng"), googleLink=document.getElementById("googleMapsLink"), pickedText=document.getElementById("pickedLocationText"), confirmBtn=document.getElementById("confirmLocation");
  const setPicked=async(lat,lng)=>{picked={lat,lng};marker.setLatLng([lat,lng]);confirmBtn.disabled=false;pickedText.textContent=`${lat.toFixed(6)}, ${lng.toFixed(6)} — جاري تحديد العنوان...`;document.getElementById("searchOnGoogle").href=`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,{headers:{"Accept-Language":"ar"}});const j=await r.json();picked.address=j.display_name||`${lat}, ${lng}`;pickedText.textContent=picked.address;}catch{picked.address=`${lat}, ${lng}`;pickedText.textContent=picked.address;}};
  const open=()=>{modal.classList.add("open");modal.setAttribute("aria-hidden","false");if(!map){map=L.map("locationMap").setView([30.7865,31.0000],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);marker=L.marker(map.getCenter(),{draggable:true}).addTo(map);map.on("click",e=>setPicked(e.latlng.lat,e.latlng.lng));marker.on("dragend",e=>{const p=e.target.getLatLng();setPicked(p.lat,p.lng);});setPicked(map.getCenter().lat,map.getCenter().lng);}setTimeout(()=>map.invalidateSize(),120);};
  const close=()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true");};
  document.getElementById("openLocationPicker").addEventListener("click",open);document.getElementById("closeLocationPicker").addEventListener("click",close);document.getElementById("locationBackdrop").addEventListener("click",close);
  document.getElementById("useMyLocation").addEventListener("click",()=>{if(!navigator.geolocation){alert("المتصفح لا يدعم تحديد الموقع.");return;}navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;map.setView([latitude,longitude],17);setPicked(latitude,longitude);},()=>alert("لم نتمكن من الوصول لموقعك. اسمح للموقع باستخدام GPS أو اختار المكان على الخريطة."),{enableHighAccuracy:true,timeout:12000});});
  confirmBtn.addEventListener("click",()=>{if(!picked)return;addressInput.value=picked.address||`${picked.lat}, ${picked.lng}`;latInput.value=picked.lat;lngInput.value=picked.lng;label.textContent=picked.address||`${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`;googleLink.href=`https://www.google.com/maps?q=${picked.lat},${picked.lng}`;googleLink.hidden=false;close();});
})();
