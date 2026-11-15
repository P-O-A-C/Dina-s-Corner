/* Optional branch-specific Google Maps review link: ?location_id=<branch-id> */
(function(){
  'use strict';
  const link=document.getElementById('publicMenuReviewLink');
  if(!link||!window.sb)return;
  const params=new URLSearchParams(window.location.search);
  const locationId=(params.get('location_id')||params.get('branch_id')||'').trim();
  if(!locationId)return;
  const isHttpsUrl=value=>{try{return new URL(String(value||'')).protocol==='https:';}catch(_){return false;}};
  (async function(){
    try{
      const {data,error}=await window.sb.from('locations')
        .select('id,name,city,address,maps_url,is_active')
        .eq('id',locationId).eq('is_active',true).maybeSingle();
      if(error||!data)return;
      const label=[data.name,data.city,data.address].filter(Boolean).join(' ').toLowerCase();
      let destination='';
      if(/(القاهرة الجديدة|التجمع|new cairo|tagamoa|el tagamoa)/i.test(label)){
        destination='https://maps.app.goo.gl/nn2z339uciJDsrgf7';
      }else if(/(الاستاد|فرع الاستاد|الفرع الثاني|الفرع الثانى|stadium|شارع الحياة|نادي سيتي|نادى سيتي|city club)/i.test(label)){
        destination='https://maps.app.goo.gl/JcFqssjbdrKW5hKt5';
      }else if(/(الفرع الرئيسي|الفرع الرئيسى|الرئيسي|الرئيسى|main branch|على مبارك|علي مبارك|مسجد الرضوان|جيم النعماني)/i.test(label)){
        destination='https://maps.app.goo.gl/sDsHMSHC5w6CRFqM6';
      }else{
        destination=String(data.maps_url||'').trim();
      }
      if(!isHttpsUrl(destination)){
        const query=[data.name,data.address,data.city].filter(Boolean).join(' ');
        if(!query)return;
        destination='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
      }
      link.href=destination;
      link.hidden=false;
      link.setAttribute('aria-label','رأيك يهمنا - افتح موقع '+String(data.name||'الفرع')+' على Google Maps');
    }catch(_){link.hidden=true;}
  })();
})();
