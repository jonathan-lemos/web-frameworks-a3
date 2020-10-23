import { dateToNumber, numberToDate } from "./date";

export interface BaseComment {
    commentId: number;
    userId: string;
    postId: number;
    comment: string;
};

export type Comment = BaseComment & {commentDate: Date};

export type DbComment = BaseComment & {commentDate: number};

export const commentToDbComment = (c: Comment): DbComment => ({...c, commentDate: dateToNumber(c.commentDate)});

export const dbCommentToComment = (c: DbComment): Comment => ({...c, commentDate: numberToDate(c.commentDate)});

export default Comment;