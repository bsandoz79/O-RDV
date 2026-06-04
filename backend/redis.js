const Redis = require('ioredis');

let client = null;

function getRedis() {
    if (client) return client;

    const url = process.env.REDIS_URL;
    if (!url) {
        console.warn('⚠️  REDIS_URL non défini — cache désactivé');
        return null;
    }

    client = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: false,
    });

    client.on('connect',  () => console.log('✅ Redis connecté'));
    client.on('error',    (e) => console.warn('⚠️  Redis erreur :', e.message));
    client.on('close',    () => { client = null; });

    return client;
}

// Lecture avec fallback silencieux
async function cacheGet(key) {
    try {
        const r = getRedis();
        if (!r) return null;
        return await r.get(key);
    } catch { return null; }
}

// Écriture avec TTL (secondes)
async function cacheSet(key, value, ttl = 300) {
    try {
        const r = getRedis();
        if (!r) return;
        await r.setex(key, ttl, value);
    } catch {}
}

// Suppression par pattern (invalidation)
async function cacheDel(pattern) {
    try {
        const r = getRedis();
        if (!r) return;
        const keys = await r.keys(pattern);
        if (keys.length) await r.del(keys);
    } catch {}
}

module.exports = { getRedis, cacheGet, cacheSet, cacheDel };
