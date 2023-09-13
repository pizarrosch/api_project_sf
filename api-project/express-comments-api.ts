import express, { Request, Response } from 'express';
import {IComment} from "./types";
import {readFile} from "fs/promises";

const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

const PATH = 'api/comments';

const loadComments = async (): Promise<IComment[]> => {
    const rawData = await readFile("mock-comment.json", "binary");
    return JSON.parse(rawData.toString());
}

const server = app.get(PATH, async (req: Request, res: Response) => {
    const comments = await loadComments();
    res.setHeader('Content-Type', 'application/json');
    res.send(comments);
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});