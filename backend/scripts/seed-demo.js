// Insère un jeu de données de démonstration (salons, clients, RDV, avis, favoris).
//
//   node scripts/seed-demo.js            → insère (refuse si des données démo existent déjà)
//   node scripts/seed-demo.js --reset    → supprime les comptes @demo.ordv.fr puis réinsère
//   node scripts/seed-demo.js --clean    → supprime uniquement les données démo
//
// Base ciblée : DATABASE_URL. Images : DEMO_ASSETS_URL (défaut https://o-rdv.vercel.app/demo).
// Heures : DEMO_TIME_MODE=naive (défaut) stocke l'heure de Paris telle quelle, comme le fait
// createAppointment sur un serveur en UTC ; DEMO_TIME_MODE=utc stocke l'instant UTC réel.
// Les suppressions en cascade retirent salons, services, RDV, avis, likes et favoris liés.

require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');
const D = require('./demo-data');

const TIME_MODE = process.env.DEMO_TIME_MODE === 'utc' ? 'utc' : 'naive';
const ASSETS = (process.env.DEMO_ASSETS_URL || 'https://o-rdv.vercel.app/demo').replace(/\/$/, '');
const args = process.argv.slice(2);

// Générateur pseudo-aléatoire déterministe : même jeu de données à chaque exécution
let seed = 20261001;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = arr => arr[Math.floor(rand() * arr.length)];
const chance = p => rand() < p;
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const email = (first, last) => `${slugify(first)}.${slugify(last)}@${D.DEMO_DOMAIN}`;

// ── Dates en heure de Paris ──────────────────────────────────────────────────
const parisFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
function parisParts(date) {
  const p = Object.fromEntries(parisFmt.formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute };
}
// "YYYY-MM-DD" + minutes depuis minuit (heure de Paris) → instant UTC
function parisDate(ymd, minutes) {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  if (TIME_MODE === 'naive') return new Date(guess);
  const p = parisParts(new Date(guess));
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
  return new Date(guess - (asUtc - guess));
}
function ymdOffset(days) {
  const t = parisParts(new Date());
  const dt = new Date(Date.UTC(t.y, t.m - 1, t.d + days));
  return dt.toISOString().slice(0, 10);
}
const dayName = ymd => new Date(ymd + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const timeOnly = hm => { const d = new Date(0); const [h, m] = hm.split(':').map(Number); d.setUTCHours(h, m, 0, 0); return d; };
const daysAgo = n => new Date(Date.now() - n * 86400000);
// Exécute fn sur chaque élément par lots parallèles (beaucoup plus rapide sur une base distante)
async function inBatches(items, fn, size = 25) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  return out;
}

async function clean() {
  const { count } = await prisma.user.deleteMany({ where: { email: { endsWith: `@${D.DEMO_DOMAIN}` } } });
  console.log(`🧹 ${count} comptes démo supprimés (et leurs données liées)`);
}

async function seedAll() {
  const existing = await prisma.user.count({ where: { email: { endsWith: `@${D.DEMO_DOMAIN}` } } });
  if (existing) throw new Error(`${existing} comptes @${D.DEMO_DOMAIN} existent déjà — relancez avec --reset`);

  const hash = await bcrypt.hash(D.DEMO_PASSWORD, 10);
  const categories = Object.fromEntries((await prisma.category.findMany()).map(c => [c.name, c.id]));

  // ── Clients ────────────────────────────────────────────────────────────────
  const clients = [];
  for (const [i, [first, last]] of D.CLIENTS.entries()) {
    const isDemo = i === 0;
    clients.push(await prisma.user.create({ data: {
      first_name: first, last_name: last, role: 'user', password: hash,
      email: isDemo ? `demo.client@${D.DEMO_DOMAIN}` : email(first, last),
      phone: `06${String(12345600 + i * 7319).slice(0, 8)}`,
      profile_picture: (isDemo || i % 3 !== 2) ? `${ASSETS}/avatars/client-${i + 1}.jpg` : null,
      created_at: i >= 22 ? new Date() : daysAgo(20 + Math.floor(rand() * 150)),
    } }));
  }

  // ── Salons ─────────────────────────────────────────────────────────────────
  const shops = [];
  for (const [i, p] of D.PROVIDERS.entries()) {
    const isDemo = i === 0;
    const created = p.isNew ? new Date() : daysAgo(90 + Math.floor(rand() * 200));
    const owner = await prisma.user.create({ data: {
      first_name: p.owner[0], last_name: p.owner[1], role: 'pro', password: hash,
      email: isDemo ? `demo.pro@${D.DEMO_DOMAIN}` : `pro.${p.slug}@${D.DEMO_DOMAIN}`,
      phone: p.phone, profile_picture: `${ASSETS}/avatars/pro-${p.slug}.jpg`, created_at: created,
    } });
    const provider = await prisma.provider.create({ data: {
      user_id: owner.id, category_id: categories[p.category] ?? null, name: p.name,
      address: p.address, zip_code: p.zip, city: p.city, description: p.description, phone: p.phone,
      image_url: `${ASSETS}/salons/${p.slug}-1.jpg`, latitude: p.lat, longitude: p.lng,
      is_certified: p.certified, is_visible: true, access_info: p.access, payment_info: p.payment, created_at: created,
    } });
    await prisma.providerPhoto.createMany({ data: [1, 2, 3].map(n => ({
      provider_id: provider.id, photo_url: `${ASSETS}/salons/${p.slug}-${n}.jpg`, is_main: n === 1, display_order: n - 1,
    })) });
    const hours = D.HOURS[p.hours];
    await prisma.businessHour.createMany({ data: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => ({
      provider_id: provider.id, day_of_week: day, is_closed: !hours[day],
      open_time: timeOnly(hours[day]?.[0] || '09:00'), close_time: timeOnly(hours[day]?.[1] || '18:00'),
    })) });
    const services = [];
    for (const [j, [label, price, duration, group]] of D.SERVICES[p.category].entries()) {
      const s = await prisma.service.create({ data: {
        provider_id: provider.id, label, price, duration, image_url: `${ASSETS}/services/${slugify(p.category)}-${j + 1}.jpg`,
      } });
      try { await prisma.$executeRaw`UPDATE services SET group_name = ${group} WHERE id = ${s.id}`; } catch { /* colonne absente */ }
      services.push(s);
    }
    shops.push({ ...p, provider, owner, services, hours, isDemo });
  }

  // ── Rendez-vous : 60 jours passés + 14 jours à venir, sans chevauchement ───
  const appts = [];
  const demoClient = clients[0];
  for (const shop of shops) {
    for (let off = -60; off <= 14; off++) {
      if (off === 0) continue;
      const ymd = ymdOffset(off);
      const h = shop.hours[dayName(ymd)];
      if (!h) continue;
      const [open, close] = [toMin(h[0]), toMin(h[1])];
      // Le salon de démo garde des créneaux libres pour la démonstration en direct
      const target = off > 0 ? (shop.isDemo ? Math.floor(rand() * 2) : Math.floor(rand() * 3)) : 1 + Math.floor(rand() * 3);
      const busy = [];
      for (let k = 0; k < target * 3 && busy.length < target; k++) {
        const service = pick(shop.services);
        const start = open + 30 * Math.floor(rand() * ((close - open - service.duration) / 30 + 1));
        const end = start + service.duration;
        if (end > close || busy.some(([a, b]) => start < b && a < end)) continue;
        busy.push([start, end]);
        appts.push({ shop, service, ymd, start, off, client: pick(clients.slice(1)) });
      }
    }
  }
  // RDV du compte de démonstration (passés notés / à noter, et à venir)
  const demoShops = [shops[0], shops[8], shops[10]];
  const demoPlan = [[-21, 1, 14 * 60, 'completed'], [-10, 0, 10 * 60, 'completed'], [-4, 2, 16 * 60, 'to_review'], [3, 0, 11 * 60, 'confirmed'], [6, 2, 15 * 60, 'pending']];
  for (const [off, si, start, demoStatus] of demoPlan) {
    const shop = demoShops[si];
    let ymd = ymdOffset(off), d = off;
    while (!shop.hours[dayName(ymd)]) ymd = ymdOffset(off > 0 ? ++d : --d);
    const service = shop.services[1];
    const clash = appts.filter(a => a.shop === shop && a.ymd === ymd);
    clash.forEach(a => appts.splice(appts.indexOf(a), 1));
    appts.push({ shop, service, ymd, start, off: d, client: demoClient, demo: demoStatus });
  }

  const created = await inBatches(appts, async a => {
    let status, refusal = null, isRead = true;
    if (a.off < 0) {
      const r = rand();
      status = a.demo ? 'completed' : r < 0.85 ? 'completed' : r < 0.95 ? 'cancelled' : 'cancelled_by_pro';
      if (status === 'cancelled_by_pro') refusal = pick(D.REFUSAL_REASONS);
    } else {
      status = a.demo ? a.demo : chance(0.6) ? 'confirmed' : 'pending';
      if (status === 'pending') isRead = !chance(0.5);
    }
    const date = parisDate(a.ymd, a.start);
    const row = await prisma.appointment.create({ data: {
      client_id: a.client.id, provider_id: a.shop.provider.id, service_id: a.service.id,
      appointment_date: date, status, refusal_reason: refusal, is_read: isRead,
      created_at: new Date(Math.min(date.getTime() - 86400000 * (1 + Math.floor(rand() * 10)), Date.now())),
    } });
    return { ...a, row, status };
  });

  // ── Avis (≈ 65 % des RDV terminés) ─────────────────────────────────────────
  const toReview = created.filter(a => a.status === 'completed' && (a.demo ? a.demo !== 'to_review' : chance(0.65)));
  const reviews = await inBatches(toReview, async a => { // le RDV démo le plus récent reste « à noter »
    const r = a.shop.isDemo ? rand() * 0.75 : rand(); // le salon de démo est un peu mieux noté
    const rating = r < 0.5 ? 5 : r < 0.85 ? 4 : r < 0.95 ? 3 : 2;
    const sub = () => Math.max(1, Math.min(5, rating + (chance(0.3) ? (chance(0.5) ? 1 : -1) : 0)));
    return prisma.review.create({ data: {
      client_id: a.client.id, provider_id: a.shop.provider.id, appointment_id: a.row.id, rating,
      rating_accueil: sub(), rating_proprete: sub(), rating_ambiance: sub(), rating_qualite: sub(),
      comment: chance(0.85) ? pick(D.COMMENTS[rating]) : null,
      created_at: new Date(Math.min(a.row.appointment_date.getTime() + 86400000 * (1 + Math.floor(rand() * 3)), Date.now())),
    } });
  });

  // ── Likes et favoris ───────────────────────────────────────────────────────
  const likes = [];
  for (const rv of reviews) {
    const n = Math.floor(rand() * 4);
    const likers = new Set();
    while (likers.size < n) { const c = pick(clients); if (c.id !== rv.client_id) likers.add(c.id); }
    likers.forEach(user_id => likes.push({ review_id: rv.id, user_id }));
  }
  await prisma.reviewLike.createMany({ data: likes, skipDuplicates: true });

  const favs = [];
  for (const c of clients) {
    const n = c === demoClient ? 3 : Math.floor(rand() * 4);
    const set = new Set(c === demoClient ? [shops[0], shops[8], shops[10]].map(s => s.provider.id) : []);
    while (set.size < n) set.add(pick(shops).provider.id);
    set.forEach(provider_id => favs.push({ user_id: c.id, provider_id }));
  }
  await prisma.favorite.createMany({ data: favs, skipDuplicates: true });

  console.log(`✅ Démo insérée : ${clients.length} clients, ${shops.length} salons, ${created.length} RDV, ${reviews.length} avis, ${likes.length} likes, ${favs.length} favoris`);
  console.log(`   Heures stockées en mode « ${TIME_MODE} »`);
  console.log(`   Client démo : demo.client@${D.DEMO_DOMAIN} / ${D.DEMO_PASSWORD}`);
  console.log(`   Pro démo    : demo.pro@${D.DEMO_DOMAIN} / ${D.DEMO_PASSWORD} (${shops[0].name})`);
}

(async () => {
  try {
    if (args.includes('--clean') || args.includes('--reset')) await clean();
    if (!args.includes('--clean')) await seedAll();
  } catch (e) {
    console.error('❌', e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
