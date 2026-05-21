const jwt = require('jsonwebtoken');

jest.mock('../prisma/client', () => ({
    user: { findUnique: jest.fn() },
}));

const prisma = require('../prisma/client');
const authMiddleware = require('../middlewares/auth');

const SECRET = 'test_secret';

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    jest.clearAllMocks();
});

test('renvoie 401 si aucun token', async () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('renvoie 401 si token invalide', async () => {
    const req = { headers: { authorization: 'Bearer token_bidon' } };
    const res = makeRes();
    const next = jest.fn();
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('passe au suivant et peuple req.auth si token valide', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ is_banned: false });
    const payload = { id: 42, role: 'user' };
    const token = jwt.sign(payload, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = jest.fn();
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.auth).toMatchObject({ userId: 42, role: 'user' });
});
