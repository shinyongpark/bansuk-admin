require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// for login / register
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


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
app.use(express.static(path.join(__dirname, 'frontend/build')));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000', // frontend URL
  credentials: true,
}));

app.get('/get-categories', async (req, res) => {
  // console.log('get category api reached.');
  try {
    const data = await db.collection('product_category').find().toArray();
    // console.log('Data fetched:', data);  // Log the raw data fetched from MongoDB
    if (data.length === 0) {
      console.log('No categories found in the database.');
    }
    const categories = data.map(category => ({
      id: category.cate_id.toString(),  // Ensuring the ID is a string
      name: category.cate_name
    }));
    // console.log('Categories to send:', categories);  // Log the processed categories
    res.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get-products-list', async (req, res) => {
  try {
    // Fetch products based on the category
    const products = await db.collection('product_list').find().sort({ cate_id: 1 }).toArray();
    if (products.length === 0) {
      console.log('No product list found in the database.');
    }
    // Fetch stock counts and map them into an object for quick lookup
    const product_list = products.map(product => ({
      cate_id: product.cate_id.toString(),  // Ensuring the ID is a string
      good_id: product.good_id.toString(),
      good_name: product.good_name.toString()
    }));
    // console.log(product_list)
    res.json(product_list);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.get('/get-products', async (req, res) => {
  const { category } = req.query;
  if (!category) {
    return res.status(400).send({ error: 'Category ID is required' });
  }
  try {
    // Fetch products based on the category
    const products = await db.collection('product_list').find({ cate_id: category }).toArray();
    // Fetch stock counts and map them into an object for quick lookup
    const stockCounts = await db.collection('stock_count').find({
      _id: { $in: products.map(p => p.good_id) }
    }).toArray();
    const stockMap = stockCounts.reduce((map, stock) => {
      map[stock._id] = stock.stock;
      return map;
    }, {});

    const enrichedProducts = await Promise.all(products.map(async product => {
      const recentIncoming = await db.collection('incoming_goods').find({ code: product.good_id }).sort({ date: -1 }).limit(1).toArray();
      let recentIncomingDate = '-';
      let recentIncomingQuantity = '-';
      if (recentIncoming.length > 0) {
        const timestamp = parseInt(recentIncoming[0].date);
        if (!isNaN(timestamp)) {
          recentIncomingDate = new Date(timestamp * 1000).toISOString().split('T')[0];
        }
        recentIncomingQuantity = recentIncoming[0].stocks || '-';
      }
      return {
        id: product.good_id,
        productName: product.good_name,
        nickname: product.good_alias,
        factory: product.good_factory,
        good_kc: product.good_kc,
        import: product.stock_kind,
        remarks: product.good_remarks,
        coupang: product.good_remarks2,
        primeCost: product.prime_cost,
        stock: stockMap[product.good_id] || 'N/A',
        recentIncomingDate,
        recentIncomingQuantity,
      };
    }));

    res.json(enrichedProducts);
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

    // Convert ISO 8601 date string to Unix timestamp
    const dateTimestamp = new Date(date).getTime() / 1000;  // Convert milliseconds to seconds

    const newRecord = {
      uid: nextUID.toString(),
      cate_id,
      good_cate,
      code,
      good_name,
      stocks,
      warehouse: '반석',
      comment,
      date: dateTimestamp.toString(),  // Store the date as a Unix timestamp
      state: 'in',
      good_class: '0',
      good_exist: 'y',
      good_rocket: 'n'
    };
    await db.collection('incoming_goods').insertOne(newRecord);

    // Update stock count
    await db.collection('stock_count').updateOne(
      { _id: code },
      { $inc: { stock: parseInt(stocks) } },
      { upsert: true }
    );

    res.status(201).json({ message: 'Incoming goods record added successfully!' });
  } catch (error) {
    console.error('Failed to add incoming goods:', error);
    res.status(500).json({ error: 'Failed to add incoming goods' });
  }
});


app.post('/add-outgoing-goods', async (req, res) => {
  try {
    const nextUID = await getNextUID('outgoing_goods');
    const { t_type, cate_id, good_cate, code, good_name, stocks, comment, date } = req.body;
    const dateTimestamp = new Date(date).getTime() / 1000;  // Convert milliseconds to seconds

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
      date: dateTimestamp.toString(),
      category: '00000000',
      good_class: '0',
      good_exist: 'y',
      good_rocket: 'n'
    };
    await db.collection('outgoing_goods').insertOne(newRecord);

    // Update stock count
    await db.collection('stock_count').updateOne(
      { _id: code },
      { $inc: { stock: -parseInt(stocks) } },
      { upsert: true }
    );

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

app.get('/get-sales-data', async (req, res) => {
  const { year, month, category } = req.query;
  if (!year || !month || !category) {
    return res.status(400).json({ message: 'Year, month, and category are required' });
  }
  try {
    const startMonth = new Date(year, month - 1, 1);
    const endMonth = new Date(year, month, 0);
    const startDate = Math.floor(startMonth.getTime() / 1000);
    const endDate = Math.floor(endMonth.getTime() / 1000);

    const products = await db.collection('product_list').find({ cate_id: category, good_exist: 'y' }).toArray();

    const salesData = await db.collection('outgoing_goods').aggregate([
      {
        $match: {
          cate_id: category,
          date: { $gte: startDate.toString(), $lt: endDate.toString() }
        }
      },
      {
        $addFields: {
          convertedDate: {
            $toDate: { $add: [{ $multiply: [{ $toInt: "$date" }, 1000] }, 86400000] }
          }
        }
      },
      {
        $group: {
          _id: {
            code: "$code",
            day: { $dayOfMonth: "$convertedDate" }
          },
          dailySales: { $sum: { $toInt: "$stocks" } }
        }
      },
      {
        $group: {
          _id: "$_id.code",
          salesByDay: { $push: { day: "$_id.day", count: "$dailySales" } }
        }
      },
      {
        $lookup: {
          from: "stock_count",
          localField: "_id",
          foreignField: "_id",
          as: "stockInfo"
        }
      },
      {
        $addFields: {
          stock: { $arrayElemAt: ["$stockInfo.stock", 0] }
        }
      }
    ]).toArray();

    const salesMap = salesData.reduce((acc, item) => {
      acc[item._id] = {
        salesByDay: item.salesByDay.reduce((map, daySale) => {
          map[daySale.day] = daySale.count;
          return map;
        }, {}),
        stock: item.stock || 0
      };
      return acc;
    }, {});

    const numDays = endMonth.getDate();
    const finalData = products.map(product => ({
      category: product.cate_id,
      productName: product.good_name,
      importType: product.stock_kind,
      dailySales: Array.from({ length: numDays }, (_, i) => ({
        day: i + 1,
        count: salesMap[product.good_id] ? salesMap[product.good_id].salesByDay[i + 1] || 0 : 0
      })),
      totalSales: Object.values(salesMap[product.good_id] ? salesMap[product.good_id].salesByDay : {}).reduce((a, b) => a + b, 0),
      stock: salesMap[product.good_id] ? salesMap[product.good_id].stock : 'N/A'
    }));

    // console.log(finalData[0].productName, finalData[0].dailySales, finalData[0].stock);
    res.json(finalData);
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const getKrDate = () => {
  const utc = Date.now()
  const kr_time_diff = 9 * 60 * 60 * 1000;
  const kr_curr = new Date(utc + kr_time_diff);
  return kr_curr
}

const secretKey = process.env.JWT_SECRET_KEY
const saltRounds = Number(process.env.SALT);
app.post('/login/verify-user', async (req, res) => {
  const { username, password } = req.body;
  try {
    // search from db
    const member = await db.collection('members').findOne({ member_id: username });
    const match = await bcrypt.compare(password, member.member_pass);
    // console.log("serverjs", member, match)

    if (match) {
      const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const authUser = process.env.AUTH_USER.split(',').includes(member.member_id).toString();
      const secretToken = jwt.sign({ userId: member.member_id, authUser: authUser, name: member.member_name }, secretKey, { expiresIn: '1h' });
      const kr_curr = getKrDate() //always convert to kr time? or use local time?

      //store login information
      db.collection("user_login").insertOne({
        userId: member.member_id,
        userIp: userIp,
        time_kr: kr_curr
      });

      // console.log('server.js: id/pw', username, password, 'token, expire, ip:', authToken, tokenExpiry, userIp);
      res.cookie('token', secretToken, { httpOnly: true, secure: false, sameSite: 'Strict' }); //change secure to true when using https
      res.cookie('authUser', authUser, { httpOnly: true, secure: false, sameSite: 'Strict' }); //change secure to true when using https
      res.cookie('name', member.member_name, { httpOnly: true, secure: false, sameSite: 'Strict' }); //change secure to true when using https
      return res.status(201).json({ message: 'welcome!', authUser: authUser, name: member.member_name });
    }
    return res.status(404).send({ error: 'Login failed' });
  } catch (error) {
    return res.status(404).send({ err_msg: 'Login failed', error: error });
  }
});

//strict=true when only 관리자 is authorized otherwise any staff is authorized
const verify_user = (cookies, strict) => {
  // console.log("verify_user", cookies, strict)
  const token = cookies.token
  jwt.verify(token, secretKey);
  const decoded = jwt.decode(token);
  // console.log(decoded, decoded.authUser, typeof decoded.authUser)
  if (strict && decoded.authUser !== "true") {
    return false;
  }
  // always verify name
  if (decoded.name !== cookies.name) {
    return false
  }
  return true;
}

app.post('/register/userInfo', async (req, res) => {
  // console.log("serverjs userInfo:", userInfo)
  try {
    //verify user
    // console.log("/register/userInfo", req.cookies)
    const verified = verify_user(req.cookies, true)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Login failed', error: "invalid token" })
    }

    //store the hashed pw
    const kr_curr = getKrDate() //always convert to kr time? or use local time?
    const userInfo = req.body;
    const hashedPassword = await bcrypt.hash(userInfo.password, saltRounds)
    const newUserInfo = {
      member_id: userInfo.username,
      member_pass: hashedPassword,
      member_name: userInfo.name,
      created_time_kr: kr_curr
    }
    const member = await db.collection('members').insertOne(newUserInfo);
    return res.status(201).json({ message: "successful" });

  } catch (err) {
    return res.status(404).send({ err_msg: 'Login failed', error: err });
  }

});


app.get('/get-select-list', async (req, res) => {
  try {
    const select_lists = await db.collection('select_list').find().toArray();
    // console.log("server", typeof select_lists, select_lists)
    if (select_lists.length === 0) {
      console.log('No select list found in the database.??');
    }

    const products = await db.collection('product_list').find().sort({ cate_id: 1 }).toArray();
    if (products.length === 0) {
      console.log('No product list found in the database.');
    }
    const product_list = products.map(product => ({
      cate_id: product.cate_id.toString(),  // Ensuring the ID is a string
      good_id: product.good_id.toString(),
      good_name: product.good_name.toString()
    }));
    select_lists[0]["product_list"] = product_list
    return res.json(select_lists[0]);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});
app.post('/customer-support/search', async (req, res) => {
  try {
    // await db.collection('external_buyer_table').find().forEach(function (doc) {
    //   if (doc.reg_date) {
    //     // Convert the string date to ISODate
    //     const kr_time_diff = 9 * 60 * 60 * 1000; //always convert to kr time? or use local time?
    //     var isoDate_kr = new Date(doc.reg_date).getTime() + kr_time_diff;
    //     var isoDate = new Date(isoDate_kr)


    //     // Update the document with the new ISODate
    //     db.collection('external_buyer_table').updateOne(
    //       { _id: doc._id },
    //       { $set: { reg_date: isoDate } }
    //     );
    //   }
    // });
    // console.log("req.body", req.body)
    const query = {
      ...(req.body.address !== "" && { address: { $regex: req.body.address, $options: 'i' } }),
      ...(req.body.recipientName !== "" && { name: { $regex: req.body.recipientName, $options: 'i' } }),
      ...(req.body.buyerName !== "" && { purchaser_name: { $regex: req.body.buyerName, $options: 'i' } }),
      ...(req.body.productName.value && { goods_name: { $regex: req.body.productName.value, $options: 'i' } }),
      ...(req.body.company.value && { order_company: req.body.company.value }),
      ...(req.body.counselResult.value && { counsel_result: req.body.counselResult.value }),
      ...(req.body.recipientPhoneLast4 !== "" || req.body.buyerPhoneLast4 !== "" ? {
        $or: [
          ...(req.body.recipientPhoneLast4 !== "" ? [{ tel1: { $regex: req.body.recipientPhoneLast4 + '$' } }] : []),
          ...(req.body.recipientPhoneLast4 !== "" ? [{ tel2: { $regex: req.body.recipientPhoneLast4 + '$' } }] : []),
          ...(req.body.buyerPhoneLast4 !== "" ? [{ purchaser_tel1: { $regex: req.body.buyerPhoneLast4 + '$' } }] : []),
          ...(req.body.buyerPhoneLast4 !== "" ? [{ purchaser_tel2: { $regex: req.body.buyerPhoneLast4 + '$' } }] : [])
        ]
      } : {}),
      ...(req.body.startDate !== "" || req.body.endDate !== "" ? {
        reg_date: {
          ...(req.body.startDate !== "" && { $gte: new Date(req.body.startDate) }),
          ...(req.body.endDate !== "" && { $lte: new Date(req.body.endDate) })
        }
      } : {})
    };
    // console.log("serverjs", query)
    var ordered_item;
    if (Object.keys(query).length !== 0) {
      ordered_item = await db.collection('external_buyer_table').aggregate([
        { $match: query }, // First, match the external_buyer_table records based on the query
        {
          $lookup: {
            from: 'counsel_table',                   // Join counsel_table
            localField: 'uid',                       // Match uid from external_buyer_table
            foreignField: 'external_uid',            // Match external_uid from counsel_table
            as: 'counselData'                        // Store joined counsel data in 'counselData'
          }
        },
        {
          $match: {
            ...(req.body.counselSection.value && {
              $and: [
                { 'counselData.counsel_section': req.body.counselSection.value },
                { 'counselData': { $ne: [] } }  // Ensure there is matching data in counsel_table
              ]
            })
          }
        }
      ]).sort({ 'reg_date': -1 }).toArray();
    } else {
      // no userinput, limit result to 1000 ordered by reg_date
      ordered_item = await db.collection('external_buyer_table').find().sort({ 'reg_date': 1 }).limit(1000).toArray();
    }

    // console.log("server", typeof select_lists, select_lists)
    if (ordered_item.length === 0) {
      console.log('No select list found in the database.??');
    } else {
      console.log('sending: ', ordered_item.length);
    }
    return res.json(ordered_item);
  } catch (error) {
    console.error('Failed to fetch customer-suport-external-buyers:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/search-consultations', async (req, res) => {
  try {
    // console.log("server", req.body.group_uid, typeof req.body.group_uid);
    const c_table = await db.collection('counsel_table').find({ 'group_uid': req.body.group_uid }).toArray();
    const m_table = await db.collection('manager_table').find({ 'group_uid': req.body.group_uid }).toArray();
    console.log("server", c_table)
    // console.log("server", m_table)
    //add a field; change dates from UNIX_TIMESTAMP to ISO Date
    const c_table_mod = c_table.map(item => ({
      ...item,
      table: "c",
      reg_date: new Date(item.reg_date * 1000),
      end_date: new Date(item.end_date * 1000),
    }));

    const m_table_mod = m_table.map(item => ({
      ...item,
      table: "m",
      reg_date: new Date(item.reg_date * 1000),
      end_date: new Date(item.end_date * 1000),
    }));
    // console.log("server c_table_mod", c_table_mod)
    // console.log("server m_table_mod", m_table_mod)
    const combined_sorted_list = c_table_mod.concat(m_table_mod).sort((a, b) => new Date(a.reg_date) - new Date(b.reg_date));
    // console.log("server combined_sorted_list", combined_sorted_list)
    //combine the two
    if (combined_sorted_list.length === 0) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending: ', combined_sorted_list.length);
    }

    return res.json(combined_sorted_list);
  } catch (error) {
    console.error('Failed to fetch customer-suport-consultations:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.get('/customer-support/search-ASTable', async (req, res) => {
  try {
    const m_table = await db.collection('manager_table').find({ proceed: "0" }).sort({ 'reg_date': -1 }).toArray();
    const m_table_mod = m_table.map(item => ({
      ...item,
      table: "m",
      reg_date: new Date(item.reg_date * 1000),
      end_date: new Date(item.end_date * 1000),
    }));
    if (m_table_mod.length === 0) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending: ', m_table_mod.length);
    }

    return res.json(m_table_mod);
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/search-ASTable/consultations', async (req, res) => {
  try {
    // console.log("server, req.body", req.body)
    const e_table = await db.collection('external_buyer_table').find({ $and: [{ 'group_uid': req.body.group_uid }, { 'uid': req.body.external_uid }] }).sort({ 'reg_date': -1 }).toArray();

    if (e_table.length === 0) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending: ', e_table.length);
    }

    return res.json(e_table);
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable-consultations:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/submit-consultations', async (req, res) => {
  try {
    console.log("server, customer-support/submit-consultations req.body", req.body)

    // verify user
    // console.log(req.cookies, req.cookies.token)
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
    }

    const nextUID = String(await getNextUID("counsel_table"))
    console.log("customer-support/submit-consultations nextUID", nextUID)
    // return res.send(201);
    const kr_time = getKrDate()
    const c_table = await db.collection('counsel_table').insertOne(
      {
        'uid': nextUID,
        'counsel_section': req.body.counselSection.value,
        'counsel_result': req.body.counselResult.value,
        'counsel_time': kr_time,
        'counsel_content': req.body.content,
        'counseler': req.cookies.name, //prevent impersonation
        'web_uid': '',
        'external_uid': req.body.external_uid,
        'group_uid': req.body.group_uid,
        'reg_date': new Date(req.body.consultationTime),
        'end_date': new Date(req.body.completionTime),
      }
    );
    if (!c_table.acknowledged) {
      return res.status(500).send("Insert operation failed.");
    }

    // return res.send(201);
    const e_table = await db.collection('external_buyer_table').updateOne(
      { uid: req.body.external_uid }, // Query to find the product by code
      [
        { $set: { counsel_uid: nextUID } },
        { $set: { counsel_result: req.body.counselResult } },
        { $set: { mod_date: kr_time } }
      ]
    );
    if (!e_table.acknowledged) {
      return res.status(500).send("Insert operation failed.");
    }

    console.log(nextUID, typeof nextUID)
    const added_counsel = await db.collection('counsel_table').findOne({ 'uid': nextUID })
    added_counsel["table"] = "c" // used in frontned
    console.log(added_counsel)
    if (!added_counsel) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending: 1',);
    }

    return res.json([added_counsel]); //wrap it to a list
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable-consultations:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

// Handle any other requests and serve the React app
app.get('*', (req, res) => {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log("unknown request:", fullUrl);
  return res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});
