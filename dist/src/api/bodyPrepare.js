"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errorResult_1 = __importDefault(require("./errorResult"));
function default_1(body, keys, partial = false) {
    if (typeof body !== "object") {
        return new errorResult_1.default({ errors: [`The body must be an object (was '${JSON.stringify(body)}').`] });
    }
    let s = [];
    let o = {};
    for (const key of keys) {
        if (typeof body[key] !== "string" || body[key].trim().length == 0) {
            if (typeof body[key] === undefined) {
                if (partial) {
                    continue;
                }
                s.push(`The key '${key}' is required in the request body.`);
            }
            else if (typeof body[key] === "number") {
                o[key.toString()] = body[key].toString();
            }
            else {
                s.push(`The key '${key}' must be a string (was ${JSON.stringify(body[key])}).`);
            }
        }
        else {
            o[key] = body[key].trim();
        }
    }
    if (s.length > 0) {
        return new errorResult_1.default({ errors: s });
    }
    else {
        return o;
    }
}
exports.default = default_1;
//# sourceMappingURL=bodyPrepare.js.map