import express, { Request, Response } from 'express';
import {readFile, writeFile} from "fs/promises";
import { v4 as uuidv4 } from 'uuid';
import {CommentCreatePayload} from "./types";

const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

const PATH = '/api/comments';

const loadComments = async (): Promise<CommentCreatePayload[]> => {
    const rawData = await readFile("mock-comment.json", "binary");
    return JSON.parse(rawData);
}

const saveComments = async (data: CommentCreatePayload[]): Promise<void> => {
    await writeFile("mock-comment.json", JSON.stringify(data));
}

app.get(PATH, async (req: Request, res: Response) => {
    const comments: CommentCreatePayload[] = await loadComments();
    res.setHeader('Content-Type', 'application/json');
    res.send(comments);
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

    const comments: CommentCreatePayload[] = await loadComments();
    comments.push(concatObj);
    await saveComments(comments)

    res.status(201);
    res.send(`Comment id:${id} has been added!`);
});

app.listen(3002, () => {
    console.log(`Server running on port 3002`);
});