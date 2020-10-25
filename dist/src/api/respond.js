"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = void 0;
const statuses_1 = __importDefault(require("statuses"));
exports.respond = (response, status = 200, msg) => {
    const stat_string = statuses_1.default(status);
    const m = msg !== null && msg !== void 0 ? msg : stat_string;
    response.status(status);
    response.json({ "status": status, "message": m });
};
exports.default = exports.respond;
//# sourceMappingURL=respond.js.map