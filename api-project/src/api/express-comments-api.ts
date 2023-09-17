import express, { Request, Response, Router } from 'express';
import {readFile, writeFile} from "fs/promises";
import { v4 as uuidv4 } from 'uuid';
import {CommentCreatePayload, IComment, ICommentEntity} from "../types";
import {connection} from "../../index";
import {mapCommentEntity} from '../services/mapping';
import {ResultSetHeader} from "mysql2";

export const commentsRouter = Router();
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

const PATH = '/api/comments';

const loadComments = async (): Promise<IComment[]> => {
    const rawData = await readFile("mock-comment.json", "binary");
    return JSON.parse(rawData);
}

const saveComments = async (data: CommentCreatePayload[]): Promise<boolean> => {
    try {
        await writeFile("mock-comment.json", JSON.stringify(data));
        return true;
    }
    catch(err) {
        return false;
    }

}

const compareValues = (target: string, compare: string) => {
    if (target) {
        return target.toLowerCase() === compare.toLowerCase();
    }
    return null
}

export const checkCommentUniq = (payload: CommentCreatePayload, comments: IComment[]) => {
    if (payload) {
        const checkByEmail = comments.find(({ email }) => compareValues(payload.email, email));

        if (!checkByEmail) {
            return true;
        }

        const { body, name, productId } = checkByEmail;
        return !(
            compareValues(payload.body, body) &&
            compareValues(payload.name, name) &&
            compareValues(payload.productId.toString(), productId.toString())
        );
    }
}

commentsRouter.get(`/`, async (req: Request, res: Response) => {
    try {
        const [comments]: any = await connection?.query<ICommentEntity[]>("SELECT * FROM Comments");
        res.setHeader('Content-Type', 'application/json');
        res.send(mapCommentEntity(comments));
    } catch (error: any) {
        console.debug(error.message);
        res.status(500);
        res.send('Something went wrong');
    }
});

// GET function to get a comment by id
// app.get(`/:id`, async (req: Request<{id: string}>, res: Response) => {
//     const comments: IComment[] = await loadComments();
//     const id = req.params.id;
//
//     const targetComment: IComment | undefined = comments.find((comment: IComment) => id === comment.id.toString())
//
//     if (!targetComment) {
//         res.status(404);
//         res.send(`Comment with id <${req.params.id}> is not found`)
//     }
//
//     res.setHeader('Content-Type', 'application/json');
//     res.send(targetComment);
// });

type CommentValidator = (comment: CommentCreatePayload) => string | null;

const validateComment: CommentValidator = (body: CommentCreatePayload) => {
    const FIELDS = ['name', 'body', 'id', 'email'];

    if (!body || !Object.keys(body).length) {
        return 'Comment is absent or empty';
    }

    let checkAllKeys = FIELDS.every((key) => body.hasOwnProperty(key));
    const keyIndex = FIELDS.findIndex(index => !body.hasOwnProperty(index));

    if (!checkAllKeys) {
        return `This field <${FIELDS[keyIndex]}> is missing`
    }

    return null;

//     another option is:

// //     const requiredFields = new Set<keyof CommentCreatePayload>([
// //         "name",
// //         "email",
// //         "body",
// //         "postId"
// //     ]);
// //
// //     let wrongFieldName;
// //
// //     requiredFields.forEach((fieldName) => {
// //         if (!comment[fieldName]) {
// //             wrongFieldName = fieldName;
// //             return;
// //         }
// //     });
// //
// //     if (wrongFieldName) {
// //         return `Field '${wrongFieldName}' is absent`;
//     }
// //
// //     return null;
}

const findDuplicateQuery = `
        SELECT * FROM Comments c
        WHERE LOWER(c.email) = ?
        AND LOWER(c.name) = ?
        AND LOWER(c.body) = ?
        AND c.product_id = ?
    `;

const insertQuery = `
        INSERT INTO Comments 
        (comment_id, email, name, body, product_id)
        VALUES 
        (?, ?, ?, ?, ?)
    `;

commentsRouter.post('/', async (req: Request<{}, {}, CommentCreatePayload>, res: Response) => {

    const validationResult = validateComment(req.body);

    if (validationResult) {
        res.status(400);
        res.send(validationResult);
        return;
    }

    try {
        const { name, email, body, productId } = req.body;
        const [sameResult] = await connection!.query<ICommentEntity[]>(
            findDuplicateQuery,
            [email.toLowerCase(), name.toLowerCase(), body.toLowerCase(), productId]
        );

        console.log(sameResult[0]?.comment_id);

        if (sameResult.length) {
            res.status(422);
            res.send("Comment with the same fields already exists");
            return;
        }

        const id = uuidv4();

        await connection!.query<ResultSetHeader>(
            insertQuery,
            [id, email, name, body, productId]
        )

        res.status(201);
        res.send(`Comment id:${id} has been added!`);
    } catch(error: any) {
           console.debug(error.message);
           res.status(500);
           res.send("Server error. Comment has not been created");
       }
});

app.patch('/', async (req: Request<{}, {}, Partial<IComment>>, res: Response) => {
    const comments: IComment[] = await loadComments();
    const targetCommentIndex = comments.findIndex(({id}) => id === req.body.id);

    if (targetCommentIndex > -1) {
        comments[targetCommentIndex] = {...comments[targetCommentIndex], ...req.body};
        await saveComments(comments);
        res.status(200);
        res.send(comments[targetCommentIndex]);
        return;
    }

    const newComment = req.body as CommentCreatePayload;
    const validationResult = validateComment(newComment);

    if (validationResult) {
        res.status(400);
        res.send(validationResult);
        return;
    }

    const id = uuidv4();
    const commentToCreate = { ...newComment, id };
    comments.push(commentToCreate);
    await saveComments(comments);

    res.status(201);
    res.send(commentToCreate);
})

app.delete(`/:id`, async (req: Request<{ id: string }>, res: Response) => {
    const comments = await loadComments();
    const id = req.params.id;

    let removedComment: IComment | null = null;

    const filteredComments = comments.filter((comment) => {
        if (id === comment.id.toString()) {
            removedComment = comment;
            return false;
        }

        return true;
    });

    if (removedComment) {
        await saveComments(filteredComments);
        res.status(200);
        res.send(removedComment);
        return;
    }

    res.status(404);
    res.send(`Comment with id ${id} is not found`);
});

// app.listen(3000, () => {
//     console.log(`Server running on port 3002`);
// });
