import express, { Express } from "express";

export function initServer(): Express {
    const app = express();

    const jsonMiddleware = express.json();
    app.use(jsonMiddleware);

    app.listen(3005, () => {
        console.log(`Server running on port 3005`);
    });

    return app;
}