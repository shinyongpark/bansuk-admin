const db = require('../config/db');

async function getProducts(req, res) {
    const database = db.getDb();
    try {
        const products = await database.collection('products').find({}).toArray();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}

async function addProduct(req, res) {
    const database = db.getDb();
    try {
        const product = await database.collection('products').insertOne(req.body);
        res.status(201).json(product.ops[0]);
    } catch (err) {
        res.status(400).json({ error: err.toString() });
    }
}

module.exports = {
    getProducts,
    addProduct
};
