import express, { Request, Response } from 'express';
import {readFile, writeFile} from "fs/promises";
import { v4 as uuidv4 } from 'uuid';
import {CommentCreatePayload, IComment} from "./types";

const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

const PATH = '/api/comments';

const loadComments = async (): Promise<IComment[]> => {
    const rawData = await readFile("mock-comment.json", "binary");
    return JSON.parse(rawData);
}

const saveComments = async (data: CommentCreatePayload[]): Promise<void> => {
    await writeFile("mock-comment.json", JSON.stringify(data));
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

        const { body, name, postId } = checkByEmail;
        return !(
            compareValues(payload.body, body) &&
            compareValues(payload.name, name) &&
            compareValues(payload.postId.toString(), postId.toString())
        );
    }
}

app.get(`api/comments/`, async (req: Request, res: Response) => {
    const comments: CommentCreatePayload[] = await loadComments();
    res.setHeader('Content-Type', 'application/json');

    if (req.params.id) {
        res.send(comments);
    } else {
        res.status(404);
        res.send(`Comment with id <${req.params.id}> is not found`)
    }
});

// GET function to get a comment by id
app.get(`${PATH}/:id`, async (req: Request<{id: string}>, res: Response) => {
    const comments: IComment[] = await loadComments();
    const id = req.params.id;

    const targetComment: IComment | undefined = comments.find((comment: IComment) => id === comment.id.toString())

    if (!targetComment) {
        res.status(404);
        res.send(`Comment with id <${req.params.id}> is not found`)
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(targetComment);
});

type CommentValidator = (comment: CommentCreatePayload) => string | null;

const validateComment: CommentValidator = (body: CommentCreatePayload) => {
    const FIELDS = ['name', 'body', 'postId', 'email'];

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

app.post(PATH, async (req: Request<{}, {}, CommentCreatePayload>, res: Response) => {

    const validationResult = validateComment(req.body);

    if (validationResult) {
        res.status(400);
        res.send(validationResult);
        return;
    }

    const id = await uuidv4();
    const idObj: {id: string} = {id: id};
    const dataObj = req.body;
    const concatObj = Object.assign({}, idObj, dataObj);

    const comments: IComment[] = await loadComments();
    const isUniq = checkCommentUniq(req.body, comments);

    if (!isUniq) {
        res.status(422);
        res.send("Comment with the same fields already exists");
        return;
    }

    comments.push(concatObj);
    await saveComments(comments)

    res.status(201);
    res.send(`Comment id:${id} has been added!`);
});

app.patch(PATH, async (req: Request<{}, {}, Partial<IComment>>, res: Response) => {
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

app.delete(`${PATH}/:id`, async (req: Request<{ id: string }>, res: Response) => {
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

app.listen(3002, () => {
    console.log(`Server running on port 3002`);
});