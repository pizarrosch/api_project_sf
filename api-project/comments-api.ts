import { createServer, IncomingMessage, ServerResponse } from 'http';
import {IComment} from "./types";
import {readFile} from "fs/promises";
import {stringify} from "querystring";

const loadComments = async (): Promise<IComment[]> => {
    const rawData = await readFile("mock-comment.json", "binary");
    return JSON.parse(rawData.toString());
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/api/comments' && req.method === 'GET') {
        const comments = await loadComments();
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(comments));
        res.end();
    } else if(req.url === '/api/comments' && req.method === 'POST') {
        let rawBody: string | null = '';
        req.on('data', (chunk) => {
            rawBody += chunk;
        });


        req.on('end', () => {
            const result = JSON.parse(rawBody || 'Hello' );
            const item = result;
            item.status = "sold";
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(item));
        });
    } else {
        res.statusCode = 404;
        res.end('Not found');
    }
});

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});