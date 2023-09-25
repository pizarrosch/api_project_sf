export const INSERT_PRODUCT_QUERY = `
        INSERT INTO products
        (product_id, title, description, price)
        VALUES
        (?, ?, ?, ?)
    `;

export const FIND_DUPLICATE_QUERY = `
        SELECT * FROM Comments c
        WHERE LOWER(c.email) = ?
        AND LOWER(c.name) = ?
        AND LOWER(c.body) = ?
        AND c.product_id = ?
    `;

export const  INSERT_COMMENT_QUERY = `
        INSERT INTO Comments 
        (comment_id, email, name, body, product_id)
        VALUES 
        (?, ?, ?, ?, ?)
    `;

export const  INSERT_IMAGE_QUERY = `
        INSERT INTO images 
        (image_id, product_id, url, main)
        VALUES 
        (?, ?, ?, ?)
    `;