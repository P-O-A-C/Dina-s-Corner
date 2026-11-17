// Public customer ordering page for GRAND DRY CLEAN.
// No management access, no database writes, and no prices until the business approves them.
const WHATSAPP_NUMBER = "201005854115";
const PRODUCTS = [
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
    address?`العنوان / المنطقة: ${address}`:"",
    notes?`ملاحظات: ${notes}`:"",
    "",
    "برجاء تأكيد السعر والتفاصيل."
  ].filter(Boolean).join("\n");
  const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.location.href=url;
});

renderCategories();
renderAll();
