const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');

const SECRET = 'test_secret';

beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
});

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

test('renvoie 401 si aucun token', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('renvoie 401 si token invalide', () => {
    const req = { headers: { authorization: 'Bearer token_bidon' } };
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('passe au suivant et peuple req.auth si token valide', () => {
    const payload = { id: 42, role: 'user' };
    const token = jwt.sign(payload, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.auth).toMatchObject({ userId: 42, role: 'user' });
});
