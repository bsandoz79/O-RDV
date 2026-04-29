const checkRole = require('../middlewares/roleGuard');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

test('renvoie 403 si req.auth absent', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    checkRole(['pro'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
});

test('renvoie 403 si le rôle ne correspond pas', () => {
    const req = { auth: { userId: 1, role: 'user' } };
    const res = makeRes();
    const next = jest.fn();
    checkRole(['pro', 'admin'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
});

test('appelle next() si le rôle est autorisé', () => {
    const req = { auth: { userId: 1, role: 'pro' } };
    const res = makeRes();
    const next = jest.fn();
    checkRole(['pro', 'admin'])(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
});

test('accepte admin dans une liste multi-rôles', () => {
    const req = { auth: { userId: 99, role: 'admin' } };
    const res = makeRes();
    const next = jest.fn();
    checkRole(['user', 'admin'])(req, res, next);
    expect(next).toHaveBeenCalled();
});
