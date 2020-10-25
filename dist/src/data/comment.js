"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCommentToComment = exports.commentToDbComment = void 0;
const date_1 = require("./date");
;
exports.commentToDbComment = (c) => ({ ...c, commentDate: date_1.dateToNumber(c.commentDate) });
exports.dbCommentToComment = (c) => ({ ...c, commentDate: date_1.numberToDate(c.commentDate) });
//# sourceMappingURL=comment.js.map