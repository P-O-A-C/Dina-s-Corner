/* Canonical owner-supplied Dina's Corner branch map links.
   Do not generate Google Maps text searches: only open verified place links. */
(function (global) {
  'use strict';
  const BRANCH_MAPS = Object.freeze({
    tantaMain: 'https://maps.app.goo.gl/qVgwAo2xUAvsjDDt7',
    tantaClub: 'https://maps.app.goo.gl/e3K3bkv4ryo5RJK49',
    tantaMafaza: 'https://www.google.com/maps/search/?api=1&query=Mafaza%20El%20Sabeel%2C%2018%20Hasan%20Hasseb%20St%2C%20Tanta&query_place_id=ChIJnYC7VwDJ9xQRQxUKUzrK914',
    newCairo: 'https://maps.app.goo.gl/3hrU7SKAWi6KXrnF6'
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

    // New Cairo first so a combined city/address field cannot be mistaken for Tanta.
    if (/(القاهره الجديده|فرع التجمع|التجمع|البنفسج|كارفور البنفسج|new cairo|tagamoa|el tagamoa|new tagamoa|first settlement)/i.test(label)) {
      return BRANCH_MAPS.newCairo;
    }
    if (/(فرع النادي|فرع النادى|النادي|النادى|club branch|the club|club|الاستاد|فرع الاستاد|الفرع الثاني|الفرع الثانى|شارع الحياة|شارع الحياه|نادي سيتي|نادى سيتي|city club|stadium|second branch|2nd branch|branch 2|tanta branch 2)/i.test(label)) {
      return BRANCH_MAPS.tantaClub;
    }
    if (/(مفازا|مفازا السبيل|ماركت مفازا|mafaza|mafaza el sabeel|mafaza elsabeel)/i.test(label)) {
      return BRANCH_MAPS.tantaMafaza;
    }
    if (/(الفرع الرئيسي|الفرع الرئيسى|فرع رئيسي|فرع طنطا الرئيسي|الرئيسي|الرئيسى|main branch|tanta main|first branch|على مبارك|علي مبارك|مسجد الرضوان|جيم النعماني|جيم النعمانى|radwan mosque|nomani gym|nomany gym)/i.test(label)) {
      return BRANCH_MAPS.tantaMain;
    }
    return '';
  }

  function isExactMapsUrl(value) {
    const supplied = String(value || '').trim();
    if (!supplied) return false;
    try {
      const parsed = new URL(supplied);
      if (parsed.protocol !== 'https:') return false;
      const host = parsed.hostname.toLowerCase();
      if (host === 'maps.app.goo.gl') return true;
      if (host === 'goo.gl' && parsed.pathname.startsWith('/maps')) return true;
      if (host === 'google.com' || host === 'www.google.com' || host === 'maps.google.com') {
        if (!parsed.pathname.toLowerCase().startsWith('/maps')) return false;
        // Reject generic text searches; allow search URLs only with an exact Google Place ID.
        if (/^\/maps\/search(?:\/|$)/i.test(parsed.pathname)) {
          return parsed.searchParams.has('query_place_id');
        }
        return parsed.pathname.toLowerCase().includes('/maps/place') ||
          parsed.searchParams.has('cid') || parsed.searchParams.has('query_place_id') ||
          parsed.searchParams.has('destination_place_id');
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  function resolve(location) {
    const known = knownUrl(location);
    if (known) return known;
    const supplied = String(location && location.maps_url || '').trim();
    return isExactMapsUrl(supplied) ? supplied : '';
  }

  global.DinaBranchMaps = Object.freeze({ links: BRANCH_MAPS, knownUrl, resolve, isExactMapsUrl });
})(window);
