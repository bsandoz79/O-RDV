module.exports = (res, data) =>
    res.send(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? Number(v) : v));
