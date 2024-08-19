const db = require('../config/db');

async function getOrders(req, res) {
    const database = db.getDb();
    try {
        const orders = await database.collection('orders').find({}).toArray();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}

async function addOrder(req, res) {
    const database = db.getDb();
    try {
        const order = await database.collection('orders').insertOne(req.body);
        res.status(201).json(order.ops[0]);
    } catch (err) {
        res.status(400).json({ error: err.toString() });
    }
}

module.exports = {
    getOrders,
    addOrder
};
