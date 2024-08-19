const { MongoClient } = require('mongodb')
const url = process.env.MONGO_URI
let connectDB = new MongoClient(url).connect()

module.exports = connectDB 