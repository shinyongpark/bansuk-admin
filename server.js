require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
// const db = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const path = require('path');

// Connect to MongoDB
let connectDB = require('./config/db') //database.js 파일 경로

let db
connectDB.then((client)=>{
  console.log('Connected to MongoDB')
  db = client.db('bs_admin')
  app.listen(process.env.PORT, () => {
    console.log('running on port')
  })
}).catch((err)=>{
  console.log(err)
}) 

app.use(express.json());
app.use(cors());

// API routes

// app.use('/products', productRoutes);
// app.use('/orders', orderRoutes);

// // Serve static files from the React app
// app.use(express.static(path.join(__dirname, 'frontend/build')));

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend/build/index.html'))
// })

// // Handles any requests that don't match the API routes
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
// });
app.use(express.static('frontend'));

app.get('/sales/view-sales', async function (req, res) {
  data = await db.collection('orders').find().toArray()
  console.log(data)
  res.json({orders: data})
})

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});
