require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Connect to MongoDB
let connectDB = require('./config/db'); // Adjust path as necessary

let db;
connectDB.then((client) => {
    console.log('Connected to MongoDB');
    db = client.db('bs_admin');
    app.listen(process.env.PORT, () => {
        console.log('Running on port ' + process.env.PORT);
    });
}).catch((err) => {
    console.error(err);
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// API endpoints
app.get('/sales/view-sales', async (req, res) => {
    try {
        const data = await db.collection('orders').find().toArray();
        console.log(data);
        res.json({ orders: data });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/get-categories', async (req, res) => {
  console.log('get category api reached.');
  try {
    const data = await db.collection('product_category').find().toArray();
    console.log('Data fetched:', data);  // Log the raw data fetched from MongoDB
    if (data.length === 0) {
      console.log('No categories found in the database.');
    }
    const categories = data.map(category => ({
        id: category.cate_id.toString(),  // Ensuring the ID is a string
        name: category.cate_name
    }));
    console.log('Categories to send:', categories);  // Log the processed categories
    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/get-products', async (req, res) => {
    const { category } = req.query;
    if (!category) {
        return res.status(400).send({ error: 'Category ID is required' });
    }
    try {
        const products = await db.collection('product_list').find({ cate_id: category }).toArray();
        res.json(products.map(product => ({
            id: product.good_id,
            productName: product.good_name,
        })));
    } catch (error) {
        console.error('Failed to fetch products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function getNextUID(collectionName) {
  try {
      const lastRecord = await db.collection(collectionName).find().sort({_id: -1}).limit(1).toArray();
      const maxUID = lastRecord.length > 0 ? parseInt(lastRecord[0].uid) : 0;
      return maxUID + 1;
  } catch (error) {
      console.error(`Failed to retrieve next UID from ${collectionName}:`, error);
      throw new Error('Database operation failed');
  }
}

app.post('/add-incoming-goods', async (req, res) => {
  try {
      const nextUID = await getNextUID('incoming_goods');
      const { t_type, cate_id, good_cate, code, good_name, stocks, comment, date } = req.body;
      const newRecord = {
          uid: nextUID.toString(),
          cate_id,
          good_cate,
          code,
          good_name,
          stocks,
          warehouse: '반석',
          comment,
          date,
          state: 'in',
          good_class: '0',
          good_exist: 'y',
          good_rocket: 'n'
      };
      await db.collection('incoming_goods').insertOne(newRecord);
      res.status(201).json({ message: 'Incoming goods record added successfully!' });
  } catch (error) {
      console.error('Failed to add incoming goods:', error);
      res.status(500).json({ error: 'Failed to add incoming goods' });
  }
});

app.post('/add-outgoing-goods', async (req, res) => {
  try {
      console.log('outgoing post request reached')
      const nextUID = await getNextUID('outgoing_goods');
      console.log('nextUID = ', nextUID.toString())
      const { t_type, cate_id, good_cate, code, good_name, stocks, comment, date } = req.body;
      const newRecord = {
          uid: nextUID.toString(),
          state: 'out',
          cate_id,
          good_cate,
          code,
          good_name,
          stocks,
          warehouse: '반석',
          comment,
          date,
          category: '00000000',
          good_class: '0',
          good_exist: 'y',
          good_rocket: 'n'
      };
      await db.collection('outgoing_goods').insertOne(newRecord);
      res.status(201).json({ message: 'Outgoing goods record added successfully!' });
  } catch (error) {
      console.error('Failed to add outgoing goods:', error);
      res.status(500).json({ error: 'Failed to add outgoing goods' });
  }
});


// Handle any other requests and serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});
