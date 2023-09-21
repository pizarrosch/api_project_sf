import { Request, Response, Router } from "express";
import {mapCommentsEntity, mapProductsEntity} from "../services/mapping";
import {connection} from "../../index";
import {IProductEntity, ICommentEntity} from "../types";
import {enhanceProductsComments} from "../helpers";

export const productsRouter = Router();

const throwServerError = (res: Response, e: Error) => {
    console.debug(e.message);
    res.status(500);
    res.send("Something went wrong");
}

productsRouter.get('/', async (req: Request, res: Response) => {
    try {
        const [productRows] = await connection!.query < IProductEntity[] > (
            "SELECT * FROM products"
        );

        const [commentRows] = await connection!.query < ICommentEntity[] > (
            "SELECT * FROM Comments"
        );

        const products = mapProductsEntity(productRows);
        const result = enhanceProductsComments(products, commentRows);

        res.send(result);
    } catch (err: any) {
        throwServerError(res, err);
    }
});

productsRouter.get('/:id', async (req: Request<{id: string}>, res: Response) => {
    try {
        const [products] = await connection!.query<IProductEntity[]>(
            'SELECT * FROM products c WHERE product_id = ?',
            [req.params.id]
        );

        if (!products[0]) {
            res.status(404);
            res.send(`Comment with id ${req.params.id} is not found`);
            return;
        }

        const [comments] = await connection!.query<ICommentEntity[]>(
            'SELECT * FROM Comments c WHERE product_id = ?',
            [req.params.id]
        );

        const product = mapProductsEntity(products)[0];

        if (comments.length) {
            product.comments = mapCommentsEntity(comments);
        }

        res.send(product);

    } catch (err: any) {
        throwServerError(res, err);
    }
});