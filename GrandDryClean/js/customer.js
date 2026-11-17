// Temporary customer catalogue. Prices are intentionally unset until approved.
// Orders are composed locally and sent by the customer through WhatsApp; no database is used.
const WHATSAPP_NUMBER = "201005854115";
const PRODUCTS = [
  {id:"shirt",name:"قميص",category:"غسيل وكي",description:"غسيل وكي للقمصان",icon:"👔",price:null},
  {id:"trousers",name:"بنطلون",category:"غسيل وكي",description:"غسيل وكي للبناطيل",icon:"👖",price:null},
  {id:"tshirt",name:"تيشيرت",category:"غسيل وكي",description:"عناية بالملابس اليومية",icon:"👕",price:null},
  {id:"suit",name:"بدلة",category:"تنظيف جاف",description:"تنظيف جاف للبدل والقطع الرسمية",icon:"🧥",price:null},
  {id:"dress",name:"فستان",category:"تنظيف جاف",description:"تنظيف وعناية بالفساتين",icon:"👗",price:null},
  {id:"jacket",name:"جاكيت",category:"تنظيف جاف",description:"تنظيف الجواكت والملابس الخارجية",icon:"🧥",price:null},
  {id:"blanket",name:"بطانية",category:"مفروشات",description:"تنظيف البطاطين والمفروشات",icon:"🛏️",price:null},
  {id:"curtain",name:"ستارة",category:"مفروشات",description:"تنظيف الستائر",icon:"🪟",price:null},
  {id:"cover",name:"مفرش سرير",category:"مفروشات",description:"تنظيف مفارش الأسرة",icon:"🧺",price:null}
];
let activeCategory = "الكل";
let cart = [];
const $ = id => document.getElementById(id);
const safe = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function renderCategories(){
  const cats=["الكل",...new Set(PRODUCTS.map(p=>p.category))];
  $("categoryTabs").innerHTML=cats.map(c=>`<button class="category-tab ${c===activeCategory?"active":""}" data-cat="${safe(c)}">${safe(c)}</button>`).join("");
  $("categoryTabs").querySelectorAll("[data-cat]").forEach(btn=>btn.addEventListener("click",()=>{activeCategory=btn.dataset.cat;renderCategories();renderProducts()}));
}
function renderProducts(){
  const shown=activeCategory==="الكل"?PRODUCTS:PRODUCTS.filter(p=>p.category===activeCategory);
  $("productGrid").innerHTML=shown.map(p=>`<article class="product-card">
    <div class="product-art">${safe(p.icon)}</div>
    <div class="product-detail"><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p>
    <div class="product-meta"><span class="product-price">${p.price===null?"السعر يحدد عند التأكيد":`${Number(p.price).toLocaleString("ar-EG")} ج.م`}</span>
    <button class="add-product" type="button" data-add="${safe(p.id)}">أضف للطلب +</button></div></div>
  </article>`).join("");
  $("productGrid").querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>addItem(btn.dataset.add)));
}
function addItem(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({...p,qty:1});renderCart();openDrawer();}
function changeQty(id,delta){const item=cart.find(x=>x.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);renderCart();}
function renderCart(){
  $("cartCount").textContent=cart.reduce((n,p)=>n+p.qty,0);
  $("drawerItems").innerHTML=cart.length?cart.map(p=>`<div class="cart-line">
    <div><strong>${safe(p.name)}</strong><small>${safe(p.category)} · السعر يحدد عند التأكيد</small></div>
    <div class="qty-tools"><button type="button" data-qty="${safe(p.id)}" data-delta="-1" aria-label="تقليل الكمية">−</button><b>${p.qty}</b><button type="button" data-qty="${safe(p.id)}" data-delta="1" aria-label="زيادة الكمية">+</button></div>
  </div>`).join(""):'<p class="empty-cart">لسه ما أضفتش أي قطع. اختار الخدمات اللي محتاجها.</p>';
  $("drawerTotal").textContent=cart.length?"السعر النهائي يتأكد عبر واتساب":"لا توجد أصناف";
  $("drawerItems").querySelectorAll("[data-qty]").forEach(btn=>btn.addEventListener("click",()=>changeQty(btn.dataset.qty,Number(btn.dataset.delta))));
}
function openDrawer(){document.body.classList.add("drawer-open");$("orderDrawer").setAttribute("aria-hidden","false")}
function closeDrawer(){document.body.classList.remove("drawer-open");$("orderDrawer").setAttribute("aria-hidden","true")}
$("floatingOrder").addEventListener("click",openDrawer);
$("openOrderFromBanner").addEventListener("click",openDrawer);
$("closeDrawer").addEventListener("click",closeDrawer);
$("drawerBackdrop").addEventListener("click",closeDrawer);
$("orderForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!cart.length){alert("أضف قطعة واحدة على الأقل قبل إرسال الطلب.");return;}
  const name=$("customerName").value.trim();
  const phone=$("customerPhone").value.trim();
  const notes=$("customerNotes").value.trim();
  const items=cart.map(p=>`• ${p.name} × ${p.qty}`).join("\n");
  const message=[
    "طلب جديد - GRAND DRY CLEAN",
    "",
    items,
    "",
    "الاسم: "+name,
    "رقم الهاتف: "+phone,
    notes?"العنوان / ملاحظات: "+notes:"",
    "",
    "يرجى تأكيد الأسعار والتفاصيل."
  ].filter(Boolean).join("\n");
  const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url,"_blank","noopener");
});
renderCategories();renderProducts();renderCart();
