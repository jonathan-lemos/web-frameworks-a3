"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const respond_1 = __importDefault(require("./respond"));
exports.authorize = (db) => (req, res, next) => {
    var _a;
    const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace(/^Bearer /, "")) || (req.cookies && req.cookies["X-Auth-Token"]);
    if (!token) {
        respond_1.default(res, 401);
        return;
    }
    const r = db.decodeToken(token);
    if (r == null) {
        return r;
    }
    req.auth = r;
    next();
};
exports.default = exports.authorize;
//# sourceMappingURL=authorize.js.map