import { TUser } from "../db/migrations/20230106181658_create_user_table";

export type SafeUserObject = Pick<TUser, "email" | "id" | "is_banned">;