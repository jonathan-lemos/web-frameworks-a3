"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToDate = exports.dateToNumber = void 0;
exports.dateToNumber = (d) => Math.floor(d.getTime() / 1000);
exports.numberToDate = (n) => new Date(n * 1000);
//# sourceMappingURL=date.js.map