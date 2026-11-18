// GRAND DRY CLEAN management workspace. Demo-only data; no database writes are made here.
const initialProducts = [
  {id:"p1",name:"قميص",category:"غسيل وكي",price:"",description:"غسيل وكي للقميص",active:true,icon:"👔",image:""},
  {id:"p2",name:"بنطلون",category:"غسيل وكي",price:"",description:"غسيل وكي للبنطلون",active:true,icon:"👖",image:""},
  {id:"p3",name:"بدلة",category:"تنظيف جاف",price:"",description:"تنظيف جاف للبدلة",active:true,icon:"🧥",image:""},
  {id:"p4",name:"فستان",category:"تنظيف جاف",price:"",description:"تنظيف وعناية بالفستان",active:true,icon:"👗",image:""},
  {id:"p5",name:"بطانية",category:"مفروشات",price:"",description:"تنظيف البطاطين",active:true,icon:"🛏️",image:""},
  {id:"p6",name:"ستارة",category:"مفروشات",price:"",description:"تنظيف الستائر",active:true,icon:"🪟",image:""}
];
let products = initialProducts.map(p=>({...p}));
let categories = ["غسيل وكي","تنظيف جاف","مفروشات"];
let branches = readStored("gdc_demo_branches_v2", []);
let popularIds = new Set(readStored("gdc_demo_popular_v2", []));
let currentImage = "";
const $ = id => document.getElementById(id);
const safe = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => v!=="" && Number.isFinite(Number(v)) ? `${Number(v).toLocaleString("ar-EG")} ج.م` : "لم يحدد";
function readStored(key, fallback){try{const value=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(value)?value:fallback}catch{return fallback}}
function writeStored(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("GDC demo storage unavailable:",error);return false}}
function toast(message){const el=$("toast");if(!el)return;el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
const validViews = ["overview","products","categories","branches","popular","profile"];
function showView(id, updateUrl=true){
  const selected=validViews.includes(id)?id:"overview";
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===selected));
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.view===selected));
  if(selected==="products")renderProducts();
  if(selected==="categories")renderCategories();
  if(selected==="branches")renderBranches();
  if(selected==="popular")renderPopular();
  if(updateUrl){const url=new URL(window.location.href);url.searchParams.set("view",selected);history.replaceState(null,"",url)}
  window.scrollTo(0,0);
  $("sidebar")?.classList.remove("open");
}
document.querySelectorAll("[data-view]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showView(a.dataset.view)}));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
if($("menuToggle")&&$("sidebar"))$("menuToggle").onclick=()=>$("sidebar").classList.toggle("open");
if($("todayLabel"))$("todayLabel").textContent=new Intl.DateTimeFormat("ar-EG",{dateStyle:"long"}).format(new Date());

function updateMetrics(){
  if($("metricProducts"))$("metricProducts").textContent=products.length;
  if($("metricCategories"))$("metricCategories").textContent=categories.length;
  if($("metricPriced"))$("metricPriced").textContent=products.filter(p=>p.price!==""&&Number(p.price)>0).length;
}
function productRow(p){
  const visual=p.image?`<img src="${p.image}" alt="">`:safe(p.icon||"♧");
  return `<tr><td><div class="product-cell"><span class="product-thumb">${visual}</span><b>${safe(p.name)}</b></div></td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td><span class="status ${p.active?"":"off"}">${p.active?"متاح":"مخفي"}</span></td><td><div class="row-actions"><button data-edit="${safe(p.id)}">تعديل</button><button class="delete" data-delete="${safe(p.id)}">حذف</button></div></td></tr>`;
}
function bindRowActions(){
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openProductModal(b.dataset.edit));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.delete);if(p&&confirm(`حذف الصنف "${p.name}" من المعاينة؟`)){products=products.filter(x=>x.id!==p.id);popularIds.delete(p.id);writeStored("gdc_demo_popular_v2",[...popularIds]);renderAll();toast("تم حذف الصنف من المعاينة")}})
}
function renderProducts(){
  if(!$("productRows"))return;
  const query=$("productSearch").value.trim().toLowerCase(), cat=$("categoryFilter").value;
  const list=products.filter(p=>(!cat||p.category===cat)&&(!query||p.name.toLowerCase().includes(query)));
  $("productRows").innerHTML=list.length?list.map(productRow).join(""):'<tr><td colspan="5">لا توجد أصناف مطابقة.</td></tr>';
  bindRowActions();
}
function renderOverview(){if($("overviewRows"))$("overviewRows").innerHTML=products.slice(0,6).map(p=>`<tr><td>${safe(p.name)}</td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td><span class="status ${p.active?"":"off"}">${p.active?"متاح":"مخفي"}</span></td></tr>`).join("")}
function refreshCategoryOptions(){
  if($("categoryFilter"))$("categoryFilter").innerHTML='<option value="">كل الأقسام</option>'+categories.map(c=>`<option>${safe(c)}</option>`).join("");
  if($("pCategory"))$("pCategory").innerHTML=categories.map(c=>`<option>${safe(c)}</option>`).join("");
}
function renderCategories(){
  if(!$("categoryCards"))return;
  $("categoryCards").innerHTML=categories.map(c=>`<article class="category-card"><div><b>${safe(c)}</b><small>${products.filter(p=>p.category===c).length} صنف</small></div><button data-remove-category="${safe(c)}">حذف القسم</button></article>`).join("");
  document.querySelectorAll("[data-remove-category]").forEach(b=>b.onclick=()=>{
    const name=b.dataset.removeCategory;
    if(products.some(p=>p.category===name)){toast("انقل الأصناف إلى قسم آخر قبل حذف هذا القسم");return}
    categories=categories.filter(c=>c!==name);renderAll();toast("تم حذف القسم من المعاينة");
  });
}
function validMapUrl(value){try{const url=new URL(String(value||""));return url.protocol==="https:"||url.protocol==="http:"?url.href:""}catch{return ""}}
function renderBranches(){
  if(!$("branchCards"))return;
  const count=$("branchCount");if(count)count.textContent=`${branches.length} فرع`;
  if(!branches.length){$("branchCards").innerHTML='<div class="empty-state">لم تتم إضافة فروع بعد.<br>استخدم النموذج أعلاه لإضافة أول فرع.</div>';return}
  $("branchCards").innerHTML=branches.map(branch=>`<article class="branch-card"><h3>${safe(branch.name)}</h3><p>${safe(branch.address)}</p><div class="branch-meta">${branch.phone?`<p dir="ltr">${safe(branch.phone)}</p>`:""}${validMapUrl(branch.map)?`<a href="${safe(validMapUrl(branch.map))}" target="_blank" rel="noopener noreferrer">فتح الموقع على الخريطة ↗</a>`:""}</div><button type="button" data-delete-branch="${safe(branch.id)}">حذف الفرع</button></article>`).join("");
  document.querySelectorAll("[data-delete-branch]").forEach(button=>button.addEventListener("click",()=>{if(!confirm("هل تريد حذف هذا الفرع من المعاينة؟"))return;branches=branches.filter(x=>x.id!==button.dataset.deleteBranch);writeStored("gdc_demo_branches_v2",branches);renderBranches();toast("تم حذف الفرع من المعاينة")}));
}
function renderPopular(){
  if(!$("popularCards"))return;
  const selected=[...popularIds].filter(id=>products.some(p=>p.id===id));
  if($("popularCount"))$("popularCount").textContent=`${selected.length} صنف محدد`;
  $("popularCards").innerHTML=products.map(p=>{const on=popularIds.has(p.id),visual=p.image?`<img src="${p.image}" alt="">`:safe(p.icon||"♧");return `<article class="popular-card"><span class="product-thumb">${visual}</span><div class="popular-info"><b>${safe(p.name)}</b><small>${safe(p.category)} · ${money(p.price)}</small></div><button type="button" class="${on?"is-selected":""}" data-toggle-popular="${safe(p.id)}">${on?"محدد ✓":"إضافة للقائمة"}</button></article>`}).join("");
  document.querySelectorAll("[data-toggle-popular]").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.togglePopular;if(popularIds.has(id))popularIds.delete(id);else popularIds.add(id);writeStored("gdc_demo_popular_v2",[...popularIds]);renderPopular();toast("تم تحديث قائمة الأكثر طلبًا محليًا")}));
}
function renderAll(){refreshCategoryOptions();renderProducts();renderOverview();renderCategories();renderBranches();renderPopular();updateMetrics()}
function openProductModal(id=""){
  $("productForm").reset();currentImage="";$("imagePreview").textContent="معاينة الصورة";$("editingId").value=id;
  const p=products.find(x=>x.id===id);$("productModalTitle").textContent=p?"تعديل الصنف":"إضافة صنف جديد";
  if(p){$("pName").value=p.name;$("pCategory").value=p.category;$("pPrice").value=p.price;$("pDescription").value=p.description;$("pActive").checked=p.active;currentImage=p.image||"";if(currentImage)$("imagePreview").innerHTML=`<img src="${currentImage}" alt="معاينة">`;}
  $("modalShade").classList.add("show");
}
function closeProductModal(){$("modalShade").classList.remove("show")}
if($("newProductBtn"))$("newProductBtn").onclick=()=>openProductModal();
if($("modalClose"))$("modalClose").onclick=closeProductModal;
if($("cancelProduct"))$("cancelProduct").onclick=closeProductModal;
if($("modalShade"))$("modalShade").addEventListener("click",e=>{if(e.target===$("modalShade"))closeProductModal()});
if($("pImage"))$("pImage").addEventListener("change",e=>{const file=e.target.files[0];if(!file)return;if(!file.type.startsWith("image/")){toast("اختر ملف صورة صالحًا");return}const reader=new FileReader();reader.onload=()=>{currentImage=reader.result;$("imagePreview").innerHTML=`<img src="${currentImage}" alt="معاينة الصورة">`};reader.readAsDataURL(file)});
if($("productForm"))$("productForm").addEventListener("submit",e=>{e.preventDefault();const id=$("editingId").value||`p${Date.now()}`;const item={id,name:$("pName").value.trim(),category:$("pCategory").value,price:$("pPrice").value,description:$("pDescription").value.trim(),active:$("pActive").checked,icon:"♧",image:currentImage};const index=products.findIndex(p=>p.id===id);if(index>=0)products[index]=item;else products.push(item);closeProductModal();renderAll();toast("تم تحديث المعاينة — لم يتم الحفظ على الخادم")});
if($("productSearch"))$("productSearch").addEventListener("input",renderProducts);
if($("categoryFilter"))$("categoryFilter").addEventListener("change",renderProducts);
if($("newCategoryBtn"))$("newCategoryBtn").onclick=()=>{$("categoryForm").reset();$("categoryShade").classList.add("show")};
if($("categoryClose"))$("categoryClose").onclick=$("cancelCategory").onclick=()=>$("categoryShade").classList.remove("show");
if($("categoryShade"))$("categoryShade").addEventListener("click",e=>{if(e.target===$("categoryShade"))$("categoryShade").classList.remove("show")});
if($("categoryForm"))$("categoryForm").addEventListener("submit",e=>{e.preventDefault();const name=$("newCategoryName").value.trim();if(!name)return;if(categories.includes(name)){toast("هذا القسم موجود بالفعل");return}categories.push(name);$("categoryShade").classList.remove("show");renderAll();toast("تمت إضافة القسم للمعاينة")});
if($("profileForm"))$("profileForm").addEventListener("submit",e=>{e.preventDefault();$("profileMessage").textContent="تم حفظ التعديلات للمعاينة الحالية فقط. لم يتم إرسالها إلى قاعدة البيانات.";toast("حُفظت المعاينة")});
if($("branchForm"))$("branchForm").addEventListener("submit",e=>{e.preventDefault();const name=$("branchName").value.trim(),address=$("branchAddress").value.trim(),phone=$("branchPhone").value.trim(),map=$("branchMap").value.trim();if(!name||!address)return;if(map&&!/^https?:\/\//i.test(map)){toast("أدخل رابط موقع صحيحًا يبدأ بـ https://");return}branches.push({id:`b${Date.now()}`,name,address,phone,map});writeStored("gdc_demo_branches_v2",branches);e.target.reset();renderBranches();toast("تمت إضافة الفرع محليًا")});

renderAll();
const requestedView=new URLSearchParams(window.location.search).get("view");
showView(validViews.includes(requestedView)?requestedView:"overview",false);
