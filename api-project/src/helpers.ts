import {IProduct, ICommentEntity, IComment, IProductSearchFilter} from "./types";
import {mapCommentEntity} from "./services/mapping";

export const enhanceProductsComments = (
    products: IProduct[],
    commentRows: ICommentEntity[]
): IProduct[] => {
    const commentsByProductId = new Map < string, IComment[]> ();

    for (let commentEntity of commentRows) {
        const comment = mapCommentEntity(commentEntity);
        if (!commentsByProductId.has(comment.productId)) {
            commentsByProductId.set(comment.productId, []);
        }

        const list = commentsByProductId.get(comment.productId);
        commentsByProductId.set(comment.productId, [...list!, comment]);
    }

    for (let product of products) {
        if (commentsByProductId.has(product.id)) {
            product.comments = commentsByProductId.get(product.id);
        }
    }

    return products;
}

export const getProductsFilterQuery = (
    filter: IProductSearchFilter
): [string , (string | number)[]] => {
    const { title, description, priceFrom, priceTo } = filter;

    let query: string | number = "SELECT * FROM products WHERE ";
    const values: (string | number)[] = []

    if (title) {
        query += "title LIKE ? ";
        values.push(`%${title}%`);
    }

    if (description) {
        if (values.length) {
            query += " OR ";
        }

        query += "description LIKE ? ";
        values.push(`%${description}%`);
    }

    if (priceFrom || priceTo) {
        if (values.length) {
            query += " OR ";
        }

        query += `(price > ? AND price < ?)`;
        values.push(priceFrom || 0);
        values.push(priceTo || 999999);
    }

    return [query, values];
}