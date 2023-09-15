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

const compareValues = (target: string, compare: string): boolean => {
    return target.toLowerCase() === compare.toLowerCase();
}

export const checkCommentUniq = (payload: CommentCreatePayload, comments: IComment[]): boolean => {
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

const validateComment = (body: CommentCreatePayload | null) => {
    if (!body) {
        return 'No body found!';
    }
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

app.listen(3002, () => {
    console.log(`Server running on port 3002`);
});