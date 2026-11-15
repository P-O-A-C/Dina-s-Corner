(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const section=$('dcBestSellers'),track=$('dcBestSellersTrack');
  const lightbox=$('dcBestSellersLightbox'),lightboxImage=$('dcBestSellersLightboxImage'),lightboxName=$('dcBestSellersLightboxName');
  if(!section||!track)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  let items=[];
  function openPreview(item){
    if(!lightbox)return;
    lightboxImage.src=item.image_url;lightboxImage.alt=item.image_name||'Dina’s Corner best seller';
    lightboxName.textContent=item.image_name||'';lightbox.hidden=false;document.body.style.overflow='hidden';
    $('dcBestSellersLightboxClose')?.focus();
  }
  function closePreview(){if(!lightbox)return;lightbox.hidden=true;lightboxImage.removeAttribute('src');document.body.style.overflow='';}
  function updateArrows(){
    const prev=$('dcBestSellersPrev'),next=$('dcBestSellersNext');
    if(!prev||!next)return;
    const max=Math.max(0,track.scrollWidth-track.clientWidth);
    prev.disabled=track.scrollLeft<=3;next.disabled=track.scrollLeft>=max-3;
  }
  function render(){
    const visible=items.filter(item=>item&&item.image_url);
    if(!visible.length){section.hidden=true;return;}
    track.innerHTML=visible.map((item,index)=>'<button class="dc-best-sellers__card" type="button" data-best-index="'+index+'" aria-label="View '+esc(item.image_name||('Best seller '+(index+1)))+' photo"><img src="'+esc(item.image_url)+'" alt="'+esc(item.image_name||'Dina’s Corner best seller')+'" loading="'+(index<2?'eager':'lazy')+'" decoding="async"><strong>'+esc(item.image_name||'Customer favourite')+'</strong></button>').join('');
    track.querySelectorAll('[data-best-index]').forEach(button=>button.addEventListener('click',()=>{
      const item=visible[Number(button.dataset.bestIndex)];if(item)openPreview(item);
    }));
    track.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{
      const card=image.closest('.dc-best-sellers__card');if(card)card.remove();
      if(!track.querySelector('.dc-best-sellers__card'))section.hidden=true;else updateArrows();
    },{once:true}));
    section.hidden=false;requestAnimationFrame(updateArrows);
  }
  async function load(){
    try{
      const client=window.sb;
      if(!client||typeof client.from!=='function')throw new Error('Supabase client unavailable');
      const {data,error}=await client.from('home_featured_products')
        .select('id,image_url,image_name,sort_order')
        .eq('is_active',true).order('sort_order',{ascending:true}).limit(24);
      if(error)throw error;
      items=Array.isArray(data)?data:[];render();
    }catch(error){
      section.hidden=true;
      console.warn('Welcome Best Sellers could not be loaded. Check the public read policy for home_featured_products.',error);
    }
  }
  $('dcBestSellersPrev')?.addEventListener('click',()=>track.scrollBy({left:-Math.max(220,track.clientWidth*.78),behavior:'smooth'}));
  $('dcBestSellersNext')?.addEventListener('click',()=>track.scrollBy({left:Math.max(220,track.clientWidth*.78),behavior:'smooth'}));
  track.addEventListener('scroll',()=>window.requestAnimationFrame(updateArrows),{passive:true});
  $('dcBestSellersLightboxClose')?.addEventListener('click',closePreview);
  lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closePreview();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&lightbox&&!lightbox.hidden)closePreview();});
  window.addEventListener('resize',updateArrows,{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else void load();
})();
