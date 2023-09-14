export interface IComment {
    id: string;
    name: string;
    email: string;
    body: string;
    postId: number;
}

export type CommentCreatePayload = Omit<IComment, "id">;
// Omit is a typescript helper, which returns the given type (first parameter in the generic type)
// and excludes the given key (second parameter)
