import { Request, Response, Router } from "express";
import {mapCommentsEntity, mapProductsEntity} from "../services/mapping";
import {connection} from "../../index";
import {IProductEntity, ICommentEntity, IProductSearchFilter, ProductCreatePayload} from "../types";
import {enhanceProductsComments, getProductsFilterQuery} from "../helpers";
import {ResultSetHeader} from "mysql2";
import {INSERT_PRODUCT_QUERY} from "../queries";
import { v4 as uuidv4 } from 'uuid';

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

productsRouter.get('/search', async (req: Request<{}, {}, {}, IProductSearchFilter>, res: Response) => {
    try {
        const [query, values] = getProductsFilterQuery(req.query);
        const [productRows] = await connection!.query<IProductEntity[]>(query, values);

        if (!productRows?.length) {
            res.status(404);
            res.send(`Products are not found`);
            return;
        }

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

productsRouter.post('/', async (req: Request<{}, {}, ProductCreatePayload>, res: Response) => {
    try {
        const {title, description, price} = req.body;
        const id = uuidv4();
        await connection?.query<ResultSetHeader>(
            INSERT_PRODUCT_QUERY,
            [id, title || null, description || 0, price || 0]
        )

        res.status(200);
        res.send(`The product with the id ${id} has been added to your list`);
    } catch (err: any) {
        throwServerError(res, err);
    }
}
);