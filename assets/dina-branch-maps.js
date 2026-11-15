/* Canonical Dina's Corner branch maps. Keep owner-supplied links centralized. */
(function (global) {
  'use strict';
  const BRANCH_MAPS = Object.freeze({
    tantaMain: 'https://maps.app.goo.gl/sDsHMSHC5w6CRFqM6',
    tantaStadium: 'https://maps.app.goo.gl/JcFqssjbdrKW5hKt5',
    newCairo: 'https://maps.app.goo.gl/nn2z339uciJDsrgf7'
  });

  function normalize(value) {
    return String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/[\u200e\u200f]/g, ' ')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function knownUrl(location) {
    const name = normalize(location && location.name);
    const city = normalize(location && location.city);
    const address = normalize(location && location.address);
    const label = [name, city, address].filter(Boolean).join(' ');

    // Cairo is deliberately checked first to avoid any accidental Tanta match.
    if (/(القاهره الجديده|فرع التجمع|التجمع|البنفسج|كارفور البنفسج|new cairo|tagamoa|el tagamoa|new tagamoa|first settlement)/i.test(label)) {
      return BRANCH_MAPS.newCairo;
    }
    if (/(الاستاد|فرع الاستاد|الفرع الثاني|الفرع الثانى|شارع الحياة|شارع الحياه|نادي سيتي|نادى سيتي|city club|stadium|second branch|2nd branch|branch 2|tanta branch 2)/i.test(label)) {
      return BRANCH_MAPS.tantaStadium;
    }
    if (/(الفرع الرئيسي|الفرع الرئيسى|فرع رئيسي|فرع طنطا الرئيسي|الرئيسي|الرئيسى|main branch|tanta main|first branch|على مبارك|علي مبارك|مسجد الرضوان|جيم النعماني|جيم النعمانى|radwan mosque|nomani gym|nomany gym)/i.test(label)) {
      return BRANCH_MAPS.tantaMain;
    }
    return '';
  }

  function resolve(location) {
    const known = knownUrl(location);
    if (known) return known;
    const supplied = String(location && location.maps_url || '').trim();
    try {
      const parsed = new URL(supplied);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
    } catch (_) {}
    const query = [location && location.name, location && location.address, location && location.city]
      .filter(Boolean).join(' ');
    return query ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query) : '';
  }

  global.DinaBranchMaps = Object.freeze({ links: BRANCH_MAPS, knownUrl, resolve });
})(window);
