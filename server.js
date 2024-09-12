require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
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
      nickname: product.good_alias,
      factory: product.good_factory,
      good_kc: product.good_kc,
      import: product.stock_kind,
      remarks: product.good_remarks,
      coupang: product.good_remarks2,
      primeCost: product.prime_cost,
    })));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function getNextUID(collectionName) {
  try {
    const lastRecord = await db.collection(collectionName).find().sort({ _id: -1 }).limit(1).toArray();
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

app.post('/edit-products', async (req, res) => {
  console.log('reached')
  const {
    code: good_id,
    importType,
    category,
    cate_id: cate_id,
    factory: good_factory,
    newProductName: newProductName,
    newNickname: newNickname,
    newComment: newComment,
    coupang: coupang,
    validation: validation,
    description: description,
    deliveryFee: del_a,
    containerDeliveryFee: del_b,
    containerFee: del_c,
    rocket: rocket,
  } = req.body; // Extract code and other fields from body

  const updateData = {};
  if (good_factory !== '') updateData.good_factory = good_factory;
  if (newProductName !== '') updateData.good_name = newProductName;
  if (newNickname !== '') updateData.good_alias = newNickname;
  if (newComment !== '') updateData.comment = newComment;
  if (coupang !== '') updateData.good_remarks2 = coupang;
  if (validation !== '') updateData.good_kc = validation;
  if (description !== '') updateData.good_remarks = description;
  if (del_a !== '') updateData.del_a = del_a;
  if (del_b !== '') updateData.del_b = del_b;
  if (del_c !== '') updateData.del_c = del_c;
  updateData.good_rocket = rocket;

  console.log(cate_id)
  try {
    const result = await db.collection('product_list').updateOne(
      { good_id: good_id }, // Query to find the product by code
      { $set: updateData }  // Use the $set operator to update the product fields
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: 'No product found with the given code or no changes made.' });
    }

    res.status(200).send({ message: 'Product updated successfully', result: result });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-product', async (req, res) => {
  const {
    importType: importType,
    category: category,
    productCode: productCode,
    productName: productName,
    classification: classification,
    good_alias: good_alias,
    factoryName: factoryName,
    description: description,
  } = req.body;
  const productExists = await db.collection('product_list').findOne({ good_id: productCode });

  if (productExists) {
    return res.status(400).json({ message: 'Product code already exists.' });
  }

  try {
    const nextUID = await getNextUID('product_list');
    await db.collection('product_list').insertOne({
      uid: nextUID,
      cate_id: category,
      good_id: productCode,
      good_name: productName,
      prime_cost: '',
      prime_cost_2: '',
      good_alias: good_alias,
      good_exist: 'y',
      comment: description,
      reg_date: new Date(),
      sale_price: '',
      free_sale_price: '',
      stock_kind: importType,
      del_a: '',
      del_b: '',
      del_c: '',
      good_class: classification,
      good_factory: factoryName,
      good_remarks: '',
      good_remarks2: '',
      good_kc: '',
      good_rocket: ''
    });
    res.status(201).json({ message: 'Product added successfully.' });
  } catch (error) {
    console.error('Failed to add product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/update-product-cost', async (req, res) => {
  const { id, newPrimeCost } = req.body; // Destructure the relevant data from request body

  if (!id || newPrimeCost === undefined) {
    return res.status(400).json({ message: 'Product ID and new prime cost are required.' });
  }

  try {
    // Attempt to update the product using the provided ID
    const updatedProduct = await db.collection('product_list').updateOne(
      { good_id: id },
      { $set: { prime_cost: newPrimeCost } }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Send back the updated product data
    res.status(200).json({ message: 'Product updated successfully', updatedProduct });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const formatDate = (date) => {
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

app.get('/sales/orders', async (req, res) => {
  const { year, month } = req.query;

  try {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0); // Start of month
    const endDate = new Date(year, month, 0, 23, 59, 59);   // End of month
    console.log(formatDate(startDate), formatDate(endDate))
    const orders = await db.collection('orders').find({
      reg_date: {
        $gte: formatDate(startDate),
        $lte: formatDate(endDate)
      }
    }).toArray();
    // console.log("server.js/sales/orders", orders)
    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/sales/product-details', async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).send({ error: 'Product ID is required' });
  }
  try {
    const productDetails = await db.collection('product_list').findOne({ good_id: productId });
    if (!productDetails) {
      return res.status(404).send({ error: 'Product not found' });
    }
    res.json(productDetails);
  } catch (error) {
    console.error('Failed to fetch product details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login/verify-user', async (req, res) => {
  const { username, password } = req.body;
  try {
    // search from db
    const member = await db.collection('members').findOne({ member_id: username });
    // console.log("server.js/login/verify", member)
    // console.log("server.js/login/verify", username, password, username == member.member_id, password == member.member_pass)

    if (username == member.member_id && password == member.member_pass) {
      const tokenExpiry = Date.now() + 3600 * 1000 // Token expire in 1 hour
      const authToken = crypto.randomBytes(32).toString('hex'); //later use userid to create this?
      const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      //store login information

      //allow tester to access registration
      let registration = false;
      if (member.member_id == "aa") {
        registration = true;
      }
      // console.log('server.js: id/pw', username, password, 'token, expire, ip:', authToken, tokenExpiry, userIp);
      return res.status(201).json({ message: 'welcome!', authToken: authToken, tokenExpiry: tokenExpiry, userIp: userIp, registration: registration });
    }
    return res.status(404).send({ error: 'Login failed' });
  } catch (error) {
    return res.status(404).send({ err_msg: 'Login failed', error: error });
  }
});

app.post('/register/userInfo', async (req, res) => {
  const userInfo = req.body;
  // console.log("serverjs userInfo:", userInfo)
  try {
    // search from db
    const nextUID = await getNextUID('members'); //?? not working
    const newUserInfo = {
      uid: nextUID,
      member_id: userInfo.username,
      member_pass: userInfo.password,
      member_name: userInfo.name,
      member_email: userInfo.email
    }
    const member = await db.collection('members').insertOne(newUserInfo);
    return res.status(201).json({ message: "successful" });

  } catch (error) {
    return res.status(404).send({ err_msg: 'Login failed', error: error });
  }
});


// Handle any other requests and serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});
