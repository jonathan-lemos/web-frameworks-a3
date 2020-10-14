import { dateToNumber, numberToDate } from "./date";

export interface BasePost {
    postId: number;
    userId: string;
    title: string;
    content: string;
    headerImage: string;
};

export type Post = BasePost & {createdDate: Date, lastUpdated: Date};

export type DbPost = BasePost & {createdDate: number, lastUpdated: number};

export const postToDbPost = (p: Post): DbPost => ({...p, createdDate: dateToNumber(p.createdDate), lastUpdated: dateToNumber(p.lastUpdated)});

export const dbPostToPost = (p: DbPost): Post => ({...p, createdDate: numberToDate(p.createdDate), lastUpdated: numberToDate(p.lastUpdated)});

export default Post;
