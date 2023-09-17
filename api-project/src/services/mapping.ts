import {IComment, ICommentEntity} from "../types";

export const mapCommentEntity = (data: ICommentEntity[]): IComment[] => {
    return data.map(({ comment_id, product_id, ...rest }) => ({
        id: comment_id,
        productId: product_id,
        ...rest,
    }));
};