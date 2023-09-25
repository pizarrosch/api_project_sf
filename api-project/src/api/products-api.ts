import { Request, Response, Router } from "express";
import {mapCommentsEntity, mapImagesEntity, mapProductsEntity} from "../services/mapping";
import {connection} from "../../index";
import {
    IProductEntity,
    ICommentEntity,
    IProductSearchFilter,
    ProductCreatePayload,
    IImageEntity,
    ImageCreatePayload
} from "../types";
import {enhanceProductsCommentsAndImages, getProductsFilterQuery} from "../helpers";
import {ResultSetHeader} from "mysql2";
import {INSERT_IMAGE_QUERY, INSERT_PRODUCT_QUERY} from "../queries";
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

        const [imagesRows] = await connection!.query < IImageEntity[] > (
            "SELECT * FROM images"
        );

        const products = mapProductsEntity(productRows);
        const result = enhanceProductsCommentsAndImages(products, commentRows, imagesRows);

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

        const [imagesRows] = await connection!.query < IImageEntity[] > (
            "SELECT * FROM images"
        );

        const products = mapProductsEntity(productRows);
        const result = enhanceProductsCommentsAndImages(products, commentRows, imagesRows);

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

        const [images] = await connection!.query<IImageEntity[]>(
            'SELECT * FROM images i WHERE product_id = ?',
            [req.params.id]
        );

        const product = mapProductsEntity(products)[0];

        if (comments.length) {
            product.comments = mapCommentsEntity(comments);
        }

        if (images.length) {
            product.images = mapImagesEntity(images);
        }

        res.send(product);

    } catch (err: any) {
        throwServerError(res, err);
    }
});

productsRouter.post('/', async (req: Request<{}, {}, ProductCreatePayload>, res: Response) => {
    try {
        const {title, description, price, images} = req.body;
        const id = uuidv4();
        await connection?.query<ResultSetHeader>(
            INSERT_PRODUCT_QUERY,
            [id, title || null, description || null, price || null]
        )

        await connection?.query<ResultSetHeader>(
            INSERT_IMAGE_QUERY,
            [id, images![0].productId || null, images![0].url || null, images![0].main]
        )

        res.status(200);
        res.send(`The product with the id ${id} has been added to your list`);
    } catch (err: any) {
        throwServerError(res, err);
    }
}
);

productsRouter.delete('/:id', async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const [deletedImage] = await connection!.query < ResultSetHeader > (
            "DELETE FROM images WHERE product_id = ?",
            [req.params.id]
        );

        const [deletedComment] = await connection!.query < ResultSetHeader > (
            "DELETE FROM Comments WHERE product_id = ?",
            [req.params.id]
        );

        const [info] = await connection!.query < ResultSetHeader > (
            "DELETE FROM products WHERE product_id = ?",
            [req.params.id]
        );

        if (info.affectedRows === 0) {
            res.status(404);
            res.send(`Product with id ${req.params.id} is not found`);
            return;
        }

        res.status(200);
        res.end();
    } catch (err: any) {
        throwServerError(res, err);
    }
});