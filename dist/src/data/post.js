"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPostToPost = exports.postToDbPost = void 0;
const date_1 = require("./date");
;
exports.postToDbPost = (p) => ({ ...p, createdDate: date_1.dateToNumber(p.createdDate), lastUpdated: date_1.dateToNumber(p.lastUpdated) });
exports.dbPostToPost = (p) => ({ ...p, createdDate: date_1.numberToDate(p.createdDate), lastUpdated: date_1.numberToDate(p.lastUpdated) });
//# sourceMappingURL=post.js.map