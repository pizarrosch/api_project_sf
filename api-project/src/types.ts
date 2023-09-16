import { RowDataPacket } from "mysql2/index";

export interface IComment {
    id: string;
    name: string;
    email: string;
    body: string;
    productId: string;
}

export interface ICommentEntity extends RowDataPacket {
    comment_id: string;
    name: string;
    email: string;
    body: string;
    product_id: string;
}

export type CommentCreatePayload = Omit<IComment, "id">;
// Omit is a typescript helper, which returns the given type (first parameter in the generic type)
// and excludes the given key (second parameter)