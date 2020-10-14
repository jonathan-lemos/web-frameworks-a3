export default interface User {
    userId: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
};

export type AddUser = User & {password: string};

export type DbUser = User & {passwordHash: string};

export const dbUserToUser = (u: DbUser) => ({ userId: u.userId, firstName: u.firstName, lastName: u.lastName, emailAddress: u.emailAddress});
