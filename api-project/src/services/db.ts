import mysql, { Connection } from "mysql2/promise";

export async function initDataBase(): Promise<Connection | null> {
    let connection: Connection | null = null;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            password: 'Pizarrosch89',
            user: 'pizarrosch',
            database: 'ProductsApplication',
        });
    } catch (err: any) {
        console.error(err.message || err);
        return null;
    }

    console.log(`Connection to DB ProductsApplication established`);
    return connection;
}