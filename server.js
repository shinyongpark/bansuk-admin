require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// for login / register
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');
const cookieParser = require('cookie-parser');


// Connect to MongoDB
let connectDB = require('./config/db'); // Adjust path as necessary
const { MongoDBNamespace } = require('mongodb');

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
app.use(express.json({ limit: '50mb' })); // Increase JSON payload size limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase URL-encoded payload size limit
app.use(cors({
  origin: process.env.FRONTEND_URL, // frontend URL
  credentials: true,
}));


// helper functions & global vars //////////////////////////////////////////////////////////////////////
const secretKey = process.env.JWT_SECRET_KEY
const secretKeyIp = process.env.JWT_SECRET_KEY_IP
const saltRounds = Number(process.env.SALT);

const getKrDate = (input_time = null) => {
  // if new Date format and in Kr time zone do nothing
  if (input_time instanceof Date && input_time.getTimezoneOffset() === -540) {
    return new Date(input_time);
  }
  const kr_time_diff = 9 * 60 * 60 * 1000;
  const utc = input_time ? new Date(input_time).getTime() : Date.now();
  const kr_curr = new Date(utc + kr_time_diff);
  return kr_curr;
}

// convert utc or Date format to Date format
const convertDate = (time) => {
  //no value found
  if (time === "0" || time === 0 || time === "0000-00-00 00:00:00" || time === "NULL") {
    return "";
  }
  return time instanceof Date ? time : new Date(time * 1000)
}

//strict=true when only 관리자 is authorized otherwise any staff is authorized
const verify_user = (cookies, strict) => {
  try {
    const token = cookies.token
    jwt.verify(token, secretKey);
    const decoded = jwt.decode(token);
    if (strict && decoded.authUser !== "true") {
      return false;
    }
    // always verify name
    if (decoded.name !== cookies.name) {
      return false
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Function to encrypt the IP address
const encryptIpAddress = (ipAddress) => {
  const encrypted = cryptoJS.AES.encrypt(ipAddress, secretKeyIp).toString();
  return encrypted;
};

// Function to decrypt the encrypted IP address
const decryptIpAddress = (encryptedIpAddress) => {
  const bytes = cryptoJS.AES.decrypt(encryptedIpAddress, secretKeyIp);
  const decrypted = bytes.toString(cryptoJS.enc.Utf8);
  return decrypted;
};

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

async function getNextGUID(collectionName) {
  try {
    const lastRecord = await db.collection(collectionName).find().sort({ _id: -1 }).limit(1).toArray();
    const maxUID = lastRecord.length > 0 ? parseInt(lastRecord[0].group_uid) : 0;
    return maxUID + 1;
  } catch (error) {
    console.error(`Failed to retrieve next UID from ${collectionName}:`, error);
    throw new Error('Database operation failed');
  }
}

// converts all reg_date with string format to new Date format 
// since it's a loop it takes a while to convert all data... there might be a better way
const convertTime2DateDB = async (collectionName, loopNum) => {
  const convertLoop = async (loopMod) => {
    try {
      let count = 0;
      const cursor = db.collection(collectionName).find({ reg_date: { $type: "string" } });

      console.log(`Start converting for loopMod ${loopMod}`);
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const docIdStr = doc._id.toString();
        const lastDigit = parseInt(docIdStr[docIdStr.length - 1], 16);

        if (lastDigit % loopNum === loopMod) {
          const original_time = doc.reg_date;
          const newRegDate = getKrDate(original_time);

          await db.collection(collectionName).updateOne(
            { _id: doc._id },
            { $set: { reg_date: newRegDate } }
          );

          count++;
          if (count % 500 === 0) {
            console.log(`Finished ${count} for loopMod ${loopMod} out of loopNum ${loopNum}`);
            count = 0;
          }
        }
      }

      console.log(`All documents updated for loopMod ${loopMod} out of loopNum ${loopNum}`);
      return true;
    } catch (error) {
      console.error(`Error updating reg_date for loopMod ${loopMod} out of loopNum ${loopNum}`, ':', error);
      return false;
    }
  };

  const stopWhenFinished = async (i) => {
    let finished = false;
    let attempts = 0;
    const maxAttempts = 15; // Limit retries

    while (!finished && attempts < maxAttempts) {
      finished = await convertLoop(i);
      attempts++;
      if (!finished) {
        console.log(`Retrying loopMod ${i}, attempt ${attempts}`);
      }
    }

    if (!finished) {
      console.error(`Failed to complete loopMod ${i} after ${maxAttempts} attempts`);
    }
  }

  const convertList = [];
  for (let i = 0; i < loopNum; i++) {
    convertList.push(stopWhenFinished(i));
  }

  // Wait for all promises to resolve
  return Promise.all(convertList);
}

const createIndexDB = async (collectionName, fieldName = null) => {
  try {
    const field = fieldName || "uid";
    await db.collection(collectionName).createIndex({ [field]: 1 });
    console.log("Finished creating index for", collectionName);
  } catch (error) {
    console.log("Error creating index:", error)
  }
}

// helper functions end //////////////////////////////////////////////////////////////////////////////////////////

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
    const products = await db.collection('product_list').find({ cate_id: category, good_exist: 'y' }).toArray();
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
          recentIncomingDate = convertDate(timestamp).toISOString().split('T')[0];
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
        primeCost2: product.prime_cost_2,
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

app.get('/get-total-prime-cost', async (req, res) => {
  try {
    const products = await db.collection('product_list').find({ good_exist: 'y' }).toArray();
    const stockCounts = await db.collection('stock_count').find().toArray();
    const stockMap = stockCounts.reduce((map, item) => {
      map[item._id] = parseInt(item.stock);
      return map;
    }, {});

    const totalPrimeCost = products.reduce((acc, product) => {
      const productStock = stockMap[product.good_id] || 0;
      const productCost = parseFloat(product.prime_cost) || 0;
      // Only include product cost in the total if the stock is non-negative
      if (productStock >= 0) {
        return acc + (productCost * productStock);
      }
      return acc;
    }, 0);

    res.json({ totalPrimeCost });
  } catch (error) {
    console.error('Failed to calculate total prime cost:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-incoming-goods', async (req, res) => {
  try {
    const verified = verify_user(req.cookies, true)
    if (!verified) {
      return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
    }

    const nextUID = await getNextUID('incoming_goods');
    const { t_type, cate_id, good_cate, code, good_name, stocks, comment, date } = req.body;

    // Convert ISO 8601 date string to korean time
    const dateTimestamp = getKrDate(date);

    const newRecord = {
      uid: nextUID.toString(),
      cate_id,
      good_cate,
      code,
      good_name,
      stocks,
      warehouse: '반석',
      comment,
      date: dateTimestamp,
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
    const verified = verify_user(req.cookies, true)
    if (!verified) {
      return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
    }

    const nextUID = await getNextUID('outgoing_goods');
    const { t_type, cate_id, good_cate, code, good_name, stocks, comment, date } = req.body;
    const dateTimestamp = getKrDate(date);

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
      date: dateTimestamp,
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
  const verified = verify_user(req.cookies, true)
  if (!verified) {
    return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
  }

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
  const verified = verify_user(req.cookies, true)
  if (!verified) {
    return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
  }

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
      reg_date: getKrDate(),
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
  const verified = verify_user(req.cookies, true)
  if (!verified) {
    return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
  }

  const { id, newPrimeCost, newPrimeCost2 } = req.body; // Destructure the relevant data from request body

  if (!id || newPrimeCost === undefined || newPrimeCost2 === undefined) {
    return res.status(400).json({ message: 'Product ID and new prime costs are required.' });
  }

  try {
    // Attempt to update the product using the provided ID
    const updatedProduct = await db.collection('product_list').updateOne(
      { good_id: id },
      { $set: { prime_cost: newPrimeCost, prime_cost_2: newPrimeCost2 } }
    );

    nextUID = getNextUID('product_cost')


    await db.collection('product_cost').insertOne(
      {
        uid: nextUID,
        stock_good_id: id,
        prime_cost: newPrimeCost,
        prime_cost_2: newPrimeCost2,
        reg_date: getKrDate()
      }
    )

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
  if (!year || !month) {
    return res.status(400).json({ message: 'Year and month are required' });
  }
  try {
    const startMonth = new Date(year, month - 1, 1);
    const endMonth = new Date(year, month, 0);
    const startDate = Math.floor(startMonth.getTime() / 1000);
    const endDate = Math.floor(endMonth.getTime() / 1000);

    const query = { good_exist: 'y' };
    if (category) {
      query.cate_id = category;
    }

    const products = await db.collection('product_list').find(query).toArray();

    const salesData = await db.collection('outgoing_goods').aggregate([
      {
        $match: {
          ...(category && { cate_id: category }), // Only include category in the match if it is defined
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

    res.json(finalData);
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login/verify-user', async (req, res) => {
  const { username, password } = req.body;
  try {
    // search from db
    const member = await db.collection('members').findOne({ member_id: username });
    const match = true; // await bcrypt.compare(password, member.member_pass);

    if (match) {
      const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const encryptedIp = encryptIpAddress(userIp);
      const authUser = process.env.AUTH_USER.split(',').includes(member.member_id).toString();
      const secretToken = jwt.sign({ userId: member.member_id, authUser: authUser, name: member.member_name }, secretKey, { expiresIn: '4h' });
      const kr_curr = getKrDate()

      //store login information
      db.collection("user_login_history").insertOne({
        userId: member.member_id,
        userIp: encryptedIp,
        time_kr: kr_curr
      });

      res.cookie('token', secretToken, { httpOnly: true, secure: true, sameSite: 'Strict' }); //change secure to true when using https
      res.cookie('authUser', authUser, { httpOnly: true, secure: true, sameSite: 'Strict' }); //change secure to true when using https
      res.cookie('name', member.member_name, { httpOnly: true, secure: true, sameSite: 'Strict' }); //change secure to true when using https
      return res.status(201).json({ message: 'welcome!', authUser: authUser, name: member.member_name });
    }
    return res.status(404).send({ error: 'Login failed' });
  } catch (error) {
    return res.status(404).send({ err_msg: 'Login failed', error: error });
  }
});

app.post('/register/userInfo', async (req, res) => {
  try {
    //verify user
    const verified = verify_user(req.cookies, true)
    if (!verified) {
      return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
    }

    //store the hashed pw
    const kr_curr = getKrDate()
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

app.post('/profile/changePassword', async (req, res) => {
  try {
    console.log("/profile/changePassword", req.body);
    //verify user
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'invalid token', error: "관리자에게 문의해주세요" })
    }

    //check prev password
    const decoded = jwt.decode(req.cookies.token);
    const userId = decoded.userId;
    const member = await db.collection('members').findOne({ member_id: userId });
    const match = await bcrypt.compare(req.body.currentPassword, member.member_pass);
    console.log("match", match)
    if (!match) {
      return res.status(401).send({ error: "기존비밀번호가 일치하지 않습니다" });
    }

    //store new hashed pw
    const kr_curr = getKrDate()
    const newPassword = req.body.newPassword;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    console.log("hashedPassword", hashedPassword)
    const newInfo = await db.collection('members').updateOne(
      { member_id: userId },
      { $set: { member_pass: hashedPassword } }
    );
    console.log("newInfo", newInfo)
    if (!newInfo.acknowledged) {
      return res.status(500).send("update operation failed.");
    }

    return res.status(201).json({ message: "successful" });
  } catch (err) {
    return res.status(404).send({ err_msg: 'password update failed', error: err });
  }
});


app.get('/get-select-list', async (req, res) => {
  try {
    const select_lists = await db.collection('select_list').find().toArray();
    if (select_lists.length === 0) {
      console.log('No select list found in the database.??');
    }

    const products = await db.collection('product_list').find().sort({ cate_id: 1 }).toArray();
    if (products.length === 0) {
      console.log('No product list found in the database.');
    }
    const product_list = products.map(product => ({
      cate_id: product.cate_id.toString(),
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
    const query = {
      ...(req.body.address && { address: { $regex: req.body.address, $options: 'i' } }),
      ...(req.body.recipientName && { name: { $regex: req.body.recipientName, $options: 'i' } }),
      ...(req.body.buyerName && { purchaser_name: { $regex: req.body.buyerName, $options: 'i' } }),
      ...(req.body.productName.value && { goods_name: { $regex: req.body.productName.value, $options: 'i' } }),
      ...(req.body.company.value && { order_company: req.body.company.value }),
      ...(req.body.counselResult.value && { counsel_result: req.body.counselResult.value }),
      ...(req.body.recipientPhoneLast4 || req.body.buyerPhoneLast4 ? {
        $or: [
          ...(req.body.recipientPhoneLast4 ? [{ tel1: { $regex: req.body.recipientPhoneLast4 + '$' } }] : []),
          ...(req.body.recipientPhoneLast4 ? [{ tel2: { $regex: req.body.recipientPhoneLast4 + '$' } }] : []),
          ...(req.body.buyerPhoneLast4 ? [{ purchaser_tel1: { $regex: req.body.buyerPhoneLast4 + '$' } }] : []),
          ...(req.body.buyerPhoneLast4 ? [{ purchaser_tel2: { $regex: req.body.buyerPhoneLast4 + '$' } }] : [])
        ]
      } : {}),
      ...(req.body.startDate || req.body.endDate ? {
        reg_date: {
          ...(req.body.startDate && { $gte: new Date(req.body.startDate) }),
          ...(req.body.endDate && { $lte: new Date(req.body.endDate) })
        }
      } : {})
    };
    console.log(query)

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
      ], { maxTimeMS: 30000, allowDiskUse: true }).sort({ 'reg_date': -1 }).limit(1001).toArray();
    } else {
      // no userinput, limit result to 1000 ordered by reg_date
      ordered_item = await db.collection('external_buyer_table').find().sort({ 'reg_date': -1 }).limit(1000).toArray();
    }
    if (ordered_item.length === 0) {
      console.log('No data found; sending: ', 0);
    } else if (ordered_item.length >= 1001) {
      console.log('too much data cutting at 1001st sending ', ordered_item.length);
    } else {
      console.log('sending: ', ordered_item.length);
    }
    return res.json(ordered_item);
  } catch (error) {
    if (error.codeName === 'MaxTimeMSExpired') {
      return res.status(401).send("Request timeout: The query took too long to execute.");
    } else if (error.codeName === 'QueryExceededMemoryLimitNoDiskUseAllowed') {
      console.log("Error while fetching data from DB", error.codeName);
      return res.status(401).send("Request timeout: The query took too long to execute.");
    } else {
      console.error('Failed to fetch customer-suport-external-buyers:', error);
      return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
    }

  }
});

app.post('/customer-support/search-consultations', async (req, res) => {
  try {
    const c_table = await db.collection('counsel_table').find({ 'group_uid': req.body.group_uid }).toArray();
    const m_table = await db.collection('manager_table').find({ 'group_uid': req.body.group_uid }).toArray();

    //add a field; change dates from UNIX_TIMESTAMP to ISO Date
    const c_table_mod = c_table.map(item => ({
      ...item,
      table: "c",
      reg_date: convertDate(item.reg_date),
      end_date: convertDate(item.end_date),
    }));

    const m_table_mod = m_table.map(item => ({
      ...item,
      table: "m",
      reg_date: convertDate(item.reg_date),
      end_date: convertDate(item.end_date),
    }));
    //combine the two
    const combined_sorted_list = c_table_mod.concat(m_table_mod).sort((a, b) => new Date(a.reg_date) - new Date(b.reg_date));
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

app.post('/customer-support/search-ConsultationsTable', async (req, res) => {
  try {
    const today = getKrDate();
    const start_date = req.body.startDate ? new Date(req.body.startDate) : new Date(today.setHours(0, 0, 0, 0));
    const end_date = req.body.endDate ? new Date(req.body.endDate) : new Date(today.setHours(23, 59, 59, 999));

    // Find query with MongoDB
    const c_table = await db.collection('counsel_table').find({
      $or: [
        {
          reg_date: { // For Date objects
            $gte: start_date,
            $lte: end_date
          }
        },
        {
          reg_date: { // For Strings in milSec
            $gte: start_date.getTime().toString(),
            $lte: end_date.getTime().toString()
          }
        }
      ]
    }).sort({ counsel_result: -1 }).toArray();

    const groupUids = [...new Set(c_table.map(row => row.group_uid))]; // Assuming c_table has group_uid

    const buyers = await db.collection('external_buyer_table').find({
      group_uid: { $in: groupUids } // Only fetch buyers with matching group_uids
    }).toArray();

    // Create a map for quick lookup based on group_uid
    const buyerMap = {};
    buyers.forEach(buyer => {
      buyerMap[buyer.group_uid] = buyer.purchaser_name;
    });

    const c_table_mod = c_table.map(item => ({
      ...item,
      table: "c",
      reg_date: convertDate(item.reg_date),
      end_date: convertDate(item.end_date),
      buyer_name: buyerMap[item.group_uid]
    }));
    if (c_table_mod.length === 0) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending: ', c_table_mod.length);
    }

    return res.json(c_table_mod);
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.get('/customer-support/search-ASTable', async (req, res) => {
  try {
    const m_table = await db.collection('manager_table').find({ proceed: "0" }).sort({ 'reg_date': -1 }).toArray();
    const m_table_mod = m_table.map(item => ({
      ...item,
      table: "m",
      reg_date: convertDate(item.reg_date),
      end_date: convertDate(item.reg_date),
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

app.post('/customer-support/search-ASTable/resolved', async (req, res) => {
  const verified = verify_user(req.cookies, false)
  if (!verified) {
    return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
  }

  try {
    const m_table = await db.collection('manager_table').updateOne(
      { uid: req.body.uid }, // find by uid
      [
        { $set: { proceed: "1" } }
      ]
    );
    if (!m_table.acknowledged) {
      return res.status(500).send("update operation failed.");
    }

    return res.json(m_table);
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable-resolved:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/downloadCSV/changeCounselResult', async (req, res) => {
  try {
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
    }
    const filteredTableData = req.body
    const bulkOperations = filteredTableData.map(item => ({
      updateOne: {
        filter: { uid: item.uid },                // Find document by uid
        update: { $set: { counsel_result: "7" } }  // Set counselResult to "7"
      }
    }));

    // Perform the bulk update operation
    const result = await db.collection('external_buyer_table').bulkWrite(bulkOperations);
    console.log('sending : ', result.modifiedCount);
    return res.json([true]);
  } catch (error) {
    console.error('Failed to fetch /customer-support/downloadCSV/changeCounselResult:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/search-ASTable/consultations', async (req, res) => {
  try {
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
    // verify user
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
    }

    const nextUID = String(await getNextUID("counsel_table"))
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
        'end_date': req.body.counselResult?.value === "7" ? new Date(req.body.completionTime) : null, //valid only when result == 7
      }
    );
    if (!c_table.acknowledged) {
      return res.status(500).send("Insert operation failed.");
    }

    const e_table = await db.collection('external_buyer_table').updateOne(
      { uid: req.body.external_uid }, // Query to find the product by code
      [
        { $set: { counsel_uid: nextUID } },
        { $set: { counsel_result: req.body.counselResult.value } },
        { $set: { mod_date: kr_time } }
      ]
    );
    if (!e_table.acknowledged) {
      return res.status(500).send("Insert operation failed.");
    }

    const added_counsel = await db.collection('counsel_table').findOne({ 'uid': nextUID })
    added_counsel["table"] = "c" // used in frontned
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


app.post('/customer-support/delete-consultations', async (req, res) => {
  try {
    // verify user
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
    }

    const kr_time = getKrDate();
    //refer to admin_counsel_content2.php > mode=delete.
    //fixed the problem: when the deleted consultation is the last one, the code didn't update the external_buyer_table
    //query all data from counsel_table that match external_uid
    const c_table = await db.collection('counsel_table').find({
      external_uid: req.body.external_uid
    }).sort({ reg_date: 1 }).toArray();
    const matchingIndex = c_table.findIndex(item => (item.counsel_result === req.body.counselResult && item.uid === req.body.uid));
    if (matchingIndex === -1) {
      return res.status(404).send("Matching counsel result not found.");
    }

    //if it's the only one update to default
    if (c_table.length === 1) {
      const e_table = await db.collection('external_buyer_table').updateOne(
        { uid: req.body.external_uid },
        {
          $set: {
            counsel_uid: '',
            counsel_result: '',
            mod_date: kr_time
          }
        }
      );
      if (!e_table.acknowledged) {
        return res.status(500).send("Update operation failed.");
      }

      // if it's the last one but not the only one, update external_buyer_table to contain the previous counsel_result
    } else if (matchingIndex === c_table.length - 1) {
      const previousCounsel = c_table[matchingIndex - 1]; // Get the previous counsel result
      const e_table = await db.collection('external_buyer_table').updateOne(
        { uid: req.body.external_uid },
        {
          $set: {
            counsel_uid: previousCounsel.uid,
            counsel_result: previousCounsel.counsel_result,
            mod_date: kr_time
          }
        }
      );
      if (!e_table.acknowledged) {
        return res.status(500).send("Update operation failed.");
      }
    }

    //delete the consultation
    const del_counsel = await db.collection('counsel_table').deleteOne({ uid: req.body.uid });
    if (del_counsel.deletedCount !== 1) {
      return res.status(500).send("Delete operation failed.");
    }

    return res.json([true]);
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable-edit-consultations:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/edit-consultations', async (req, res) => {
  try {
    // verify user
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
    }

    const kr_time = getKrDate()
    const updateFields = {
      counsel_content: req.body.content,
      end_date: new Date(req.body.completionTime),
      counsel_time: kr_time,
      ...(req.body.counselResult ? { counsel_result: req.body.counselResult.value } : {}),
      ...(req.body.counselSection ? { counsel_section: req.body.counselSection.value } : {})
    };
    const c_table = await db.collection('counsel_table').updateOne(
      { uid: req.body.uid }, // Query to find the product by code
      { $set: updateFields }
    );
    if (!c_table.acknowledged) {
      return res.status(500).send("Update operation failed.");
    }

    const updateFieldEx = {
      mod_date: new Date(req.body.completionTime),
      end_date: req.body.counselResult?.value === "7" ? new Date(req.body.completionTime) : null,
      ...(req.body.counselResult ? { counsel_result: req.body.counselResult.value } : {})
    };
    const e_table = await db.collection('external_buyer_table').updateOne(
      { uid: req.body.external_uid }, // Query to find the product by code
      { $set: updateFieldEx }
    );
    if (!e_table.acknowledged) {
      return res.status(500).send("Insert operation failed.");
    }

    const added_counsel = await db.collection('counsel_table').findOne({ 'uid': req.body.uid })
    added_counsel["table"] = "c" // used in frontned
    if (!added_counsel) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending: 1',);
    }

    return res.json([added_counsel]); //wrap it to a list
  } catch (error) {
    console.error('Failed to fetch customer-support-searchASTable-edit-consultations:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.get('/get-stock-good', async (req, res) => {
  try {
    const s_table = await db.collection('stock_good').find().toArray()
    if (s_table.lengnth === 0) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending:', s_table.length);
    }

    return res.json(s_table);
  } catch (error) {
    console.error('Failed to fetch get-stock-good:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.get('/get-next-orderid', async (req, res) => {
  try {
    // console.log("server, get-next-orderid req.body", req.body)
    const e_table = await db.collection('external_buyer_table').find().sort({ order_uid: -1 }).limit(1).toArray();
    if (e_table.lengnth === 0) {
      console.log('No data found in the database.??');
    } else {
      console.log('sending:', e_table.length);
    }

    return res.json([e_table[0].order_uid]);
  } catch (error) {
    console.error('Failed to fetch get-next-orderid:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/check-duplicates', async (req, res) => {
  try {
    let err_dates = [];
    let { set_start_date } = req.body

    // query if req_date exist
    for (const start_date_str of set_start_date) {
      const start_date = new Date(start_date_str);
      start_date.setHours(0, 0, 0, 0);
      const end_date = new Date(start_date_str);
      end_date.setHours(23, 59, 59, 999);

      // Query the database for duplicates
      const e_table = await db.collection('external_buyer_table').findOne({
        $or: [
          {
            reg_date: {
              $gte: start_date,
              $lte: end_date
            }
          },
          {
            reg_date: {
              $gte: start_date.getTime().toString(),
              $lte: end_date.getTime().toString()
            }
          }
        ]
      });

      // Log the result and check for duplicates
      if (e_table) {
        err_dates.push(start_date_str);
      }
    }

    if (err_dates.length !== 0) {
      console.log('duplicates exist sendnig', err_dates.length);
    } else {
      console.log('no duplicates');
    }

    return res.json(err_dates);
  } catch (error) {
    console.error('Failed to fetch check-duplicates:', error);
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

app.post('/customer-support/submitOrderCheck-external-stock', async (req, res) => {
  try {
    // verify user
    const verified = verify_user(req.cookies, false)
    if (!verified) {
      return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
    }
    const { orderData, stockData, stockGood_dict } = req.body;
    let nextEUID = String(await getNextUID("external_buyer_table"))
    const NextGUID = await getNextGUID("external_buyer_table")
    console.log("start insert external_buyer_table");
    for (const orderDataItem of orderData) {
      const c_table = await db.collection('external_buyer_table').insertOne(
        {
          uid: nextEUID,
          group_uid: String(NextGUID + orderDataItem.group_uid),
          reg_date: new Date(orderDataItem.reg_date),
          zip_code: orderDataItem.receive_zip_code,
          address: orderDataItem.receive_address,
          name: orderDataItem.receive_name,
          tel1: orderDataItem.receive_tel1,
          tel2: orderDataItem.receive_tel2,
          goods_serial: orderDataItem.goods_serial,
          order_serial: orderDataItem.order_serial,
          purchaser_name: orderDataItem.buyer_name,
          purchaser_tel1: orderDataItem.buyer_tel1,
          purchaser_tel2: orderDataItem.buyer_tel2,
          goods_name: orderDataItem.goods_name,
          comments: orderDataItem.comments,
          goods_num: orderDataItem.goods_num,
          supply_price: orderDataItem.supply_price,
          selling_price: orderDataItem.selling_price,
          settlement_price: orderDataItem.settlement_price,
          delivery_cost: orderDataItem.delivery_cost,
          invoice_number: orderDataItem.invoice_number,
          pay_method: orderDataItem.pay_method,
          order_company: orderDataItem.order_company,
          warehouse: orderDataItem.warehouse,
          order_uid: orderDataItem.order_uid
        }
      );
      if (!c_table.acknowledged) {
        return res.status(500).send("Insert operation failed.");
      }
      nextEUID = String(Number(nextEUID) + 1);
    }
    console.log("finished insert external_buyer_table");


    const stockCat_dict = {}
    const sc_table = await db.collection('stock_category').find().toArray();
    for (const stockCatItem of sc_table) {
      stockCat_dict[stockCatItem.cate_id] = {
        catName: stockCatItem.cate_name,
      };
    }

    console.log("start insert stock_goods");
    let n = 0, u = 0, ub = 0;
    for (let i = 0; i < stockData.length; i++) {
      // console.log("stock_goods, i", i, stockData[i]);
      const goodDivision = stockData[i].goodDivision;
      let [passed, err_str] = [true, ""];
      switch (goodDivision) {
        case '0': // 신상품 재고 파악
          [passed, err_str] = await takeStock("new", stockData[i], stockGood_dict, stockCat_dict);
          n++;
          break;
        case '1': // 검품상품 재고 파악
          [passed, err_str] = await takeStock("used", stockData[i], stockGood_dict, stockCat_dict);
          u++;
          break;
        case '2': // B급 검품상품 재고 파악
          [passed, err_str] = await takeStock("usedB", stockData[i], stockGood_dict, stockCat_dict);
          ub++;
          break;
        default:
          return res.status(500).send(`error during inserting stock_goods check ${i}th`);
      }

      if (!passed) return res.status(500).send(err_str);
    }
    console.log("finished insert stock_goods");

    return res.json([true]);
  } catch (error) {
    return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
  }
});

async function takeStock(goodDivision, goods, stockGood_dict, stockCat_dict) {
  const sgood = stockGood_dict[goods.code];
  const scate = stockCat_dict[sgood.cateId];

  const categoryId = sgood.cateId;
  const categoryName = scate.catName;
  const gName = goods.real_name;
  const gId = goods.code;
  const gNum = String(Math.abs(goods.num));
  const gWarehouse = goods.warehouse;
  const gClass = 0; //goods.good_class; //?? not defined anywhere

  if (sgood.goodExist === "y") {
    if (goodDivision === "new") {
      const og_table = await db.collection('outgoing_goods').insertOne(
        {
          cate_id: categoryId,
          good_cate: categoryName,
          good_name: gName,
          code: gId,
          stocks: gNum,
          warehouse: gWarehouse,
          comment: '자동분류',
          good_exist: sgood.goodExist,
          regDate: getKrDate(),
          good_class: gClass
        }
      );
      if (!og_table.acknowledged) {
        return [false, "Insert operation failed for outgoing goods."];
      }
    } else if (goodDivision === "used") {
      const rg_table = await db.collection('returning_goods').insertOne(
        {
          cate_id: categoryId,
          good_cate: categoryName,
          good_name: gName,
          good_id: gId,
          class: 'resaled',
          stocks: gNum,
          comment: '자동분류',
          good_exist: sgood.goodExist,
          regDate: getKrDate(),
        }
      );
      if (!rg_table.acknowledged) {
        return [false, "Insert operation failed for returning goods."];
      }

    } else if (goodDivision === "usedB") {
      const rg_table = await db.collection('returning_goods').insertOne(
        {
          cate_id: categoryId,
          good_cate: categoryName,
          good_name: gName,
          good_id: gId,
          class: 'resaledB',
          stocks: gNum,
          comment: '자동분류',
          good_exist: sgood.goodExist,
          regDate: getKrDate(),
        }
      );
      if (!rg_table.acknowledged) {
        return [false, "Insert operation failed for returning goods B."];
      }
    }
  } else if (sgood.goodExist === "n") {
    return [false, `비활성화 된 제품을 출고하려 합니다. (${gName} [${gId}] ${gNum}개 ${goodDivision}) => 다시 확인해주세요.`];
  }

  return [true, ""];
}

app.post('/customer-support-refund/search', async (req, res) => {
  try {
    // make sure to convert counselResultRefund to counsel_result
    const e_table_search = req.body.recipientName || req.body.buyerName || req.body.recipientPhoneLast4
    // used to count data for 영업부에서 입력된 내용 == sql_count
    const query_ex = {
      ...(req.body.recipientName && { "e.name": { $regex: req.body.recipientName, $options: 'i' } }),
      ...(req.body.buyerName && { "e.purchaser_name": { $regex: req.body.buyerName, $options: 'i' } }),
      ...(req.body.recipientPhoneLast4 ? {
        $or: [
          ...(req.body.recipientPhoneLast4 ? [{ "e.tel1": { $regex: req.body.recipientPhoneLast4 + '$' } }] : []),
          ...(req.body.recipientPhoneLast4 ? [{ "e.tel2": { $regex: req.body.recipientPhoneLast4 + '$' } }] : [])
        ]
      } : {}),
      ...(req.body.startDate || req.body.endDate ? {
        "e.reg_date": {
          ...(req.body.startDate && { $gte: new Date(req.body.startDate) }),
          ...(req.body.endDate && { $lte: new Date(req.body.endDate) })
        }
      } : {})
    }
    const query_c = {
      ...(req.body.counselResultRefund?.value !== undefined && {
        counsel_result: req.body.counselResultRefund.value === "10"
          ? { $in: ["4", "3", "2"] }
          : req.body.counselResultRefund.value === "0"
            ? { $in: ["4", "3", "2", "7"] }
            : req.body.counselResultRefund.value
      }),
      ...(req.body.startDate || req.body.endDate ? {
        $or: [
          {
            reg_date: { // For Date objects
              ...(req.body.startDate && { $gte: new Date(req.body.startDate) }),
              ...(req.body.endDate && { $lte: new Date(req.body.endDate) })
            }
          },
          {
            reg_date: { // For Strings in milSec
              ...(req.body.startDate && { $gte: new Date(req.body.startDate).getTime().toString() }),
              ...(req.body.endDate && { $lte: new Date(req.body.endDate).getTime().toString() })
            }
          }
        ]
      } : {})
    }
    // console.log("server, query_ex", query_ex, "query_c", query_c)

    const pipeline = e_table_search
      ? [
        { $match: query_c },
        {
          $lookup: {
            from: "external_buyer_table",
            localField: "group_uid",
            foreignField: "group_uid",
            as: "e"
          }
        },
        { $unwind: "$e" },
        { $match: query_ex }
      ]
      : [{ $match: query_c }];
    var ordered_item = await db.collection("counsel_table").aggregate(pipeline, { maxTimeMS: 30000, allowDiskUse: true }).sort({ 'reg_date': -1 }).toArray();

    if (ordered_item.length !== 0) {
      console.log('sending: ', ordered_item.length);
      const c_table_mod = ordered_item.map(item => ({
        ...item,
        table: "c",
        reg_date: convertDate(item.reg_date),
        end_date: convertDate(item.end_date),
      }));

      // get data from external_buyer_table with c.group_uid = e_group_uid
      // this is used in frontend
      const uniqueGroupUids = [...new Set(ordered_item.map(item => item.group_uid))];
      //may help searching with reg_dates
      const ordered_item_ex = await db.collection("external_buyer_table").find({
        group_uid: { $in: uniqueGroupUids }
      }).toArray();

      return res.json({ counsel_table: true, ordered_item: c_table_mod, ordered_item_ex: ordered_item_ex });
    }


    console.log('no data found; 상담 내역이 완료되었거나 없을때 쿼리.');
    const query2_ex = {
      // some problem with this case... 
      //not sure what to do when value === 0, is it ne:NULL, $in[4, 3, 2, 7], or $in[4, 3, 2]
      ...(req.body.counselResultRefund?.value !== undefined && {
        counsel_result: req.body.counselResultRefund.value === "10"
          ? { $in: ["4", "3", "2"] }
          : req.body.counselResultRefund.value === "0"
            ? { $in: ["4", "3", "2", "7"] }
            : req.body.counselResultRefund.value
      }),
      ...(req.body.recipientName && { name: { $regex: req.body.recipientName, $options: 'i' } }),
      ...(req.body.buyerName && { purchaser_name: { $regex: req.body.buyerName, $options: 'i' } }),
      ...(req.body.recipientPhoneLast4 ? {
        $or: [
          ...(req.body.recipientPhoneLast4 ? [{ tel1: { $regex: req.body.recipientPhoneLast4 + '$' } }] : []),
          ...(req.body.recipientPhoneLast4 ? [{ tel2: { $regex: req.body.recipientPhoneLast4 + '$' } }] : [])
        ]
      } : {}),
      ...(req.body.startDate || req.body.endDate ? {
        reg_date: {
          ...(req.body.startDate && { $gte: new Date(req.body.startDate) }),
          ...(req.body.endDate && { $lte: new Date(req.body.endDate) })
        }
      } : {})
    };
    const c_table_search = req.body.counselResultRefund?.value !== "0";
    const query2_c = {
      ...(req.body.counselResultRefund?.value !== undefined && {
        "c.counsel_result": req.body.counselResultRefund.value === "10"
          ? { $in: ["4", "3", "2"] }
          : req.body.counselResultRefund.value
      }),
      ...(req.body.startDate || req.body.endDate ? {
        $or: [
          {
            "c.reg_date": { // For Date objects
              ...(req.body.startDate && { $gte: new Date(req.body.startDate) }),
              ...(req.body.endDate && { $lte: new Date(req.body.endDate) })
            }
          },
          {
            "c.reg_date": { // For Strings in milSec
              ...(req.body.startDate && { $gte: new Date(req.body.startDate).getTime().toString() }),
              ...(req.body.endDate && { $lte: new Date(req.body.endDate).getTime().toString() })
            }
          }
        ]
      } : {})
    };

    console.log("server, query2_ex", query2_ex, "query2_c", query2_c)

    const pipeline2 = c_table_search
      ? [
        { $match: query2_ex },
        {
          $lookup: {
            from: "counsel_table",
            localField: "uid",
            foreignField: "external_uid",
            as: "c"
          }
        },
        { $unwind: "$c" },
        { $match: query2_c }
      ]
      : [
        { $match: query2_ex }
      ];
    ordered_item = await db.collection("external_buyer_table").aggregate(pipeline2, { maxTimeMS: 30000, allowDiskUse: true }).sort({ 'reg_date': -1 }).toArray();
    if (ordered_item.length !== 0) {
      console.log('sending: ', ordered_item.length);
      // get data from counsel_table with c.group_uid = e_group_uid
      // this is used in frontend
      const uniqueCounselUids = [...new Set(ordered_item.map(item => item.counsel_uid))];
      //may help searching with reg_dates
      const ordered_item_c = await db.collection("counsel_table").find({
        group_uid: { $in: uniqueCounselUids }
      }).toArray();

      return res.json({ counsel_table: false, ordered_item: ordered_item, ordered_item_c: ordered_item_c });
    } else {
      console.log('no data found; sending: ', ordered_item.length);
      return res.json({ counsel_table: false, ordered_item: ordered_item });
    }
  } catch (error) {
    if (error.codeName === 'MaxTimeMSExpired') {
      return res.status(401).send("Request timeout: The query took too long to execute.");
    } else if (error.codeName === 'QueryExceededMemoryLimitNoDiskUseAllowed') {
      console.log("Error while fetching data from DB", error.codeName);
      return res.status(401).send("Request timeout: The query took too long to execute.");
    } else {
      console.error('Failed to fetch customer-suport-external-buyers:', error);
      return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
    }

  }
});

// 미완성
// app.post('/customer-support-refund/submit-consultations', async (req, res) => {
//   try {
//     // verify user
//     const verified = verify_user(req.cookies, false)
//     if (!verified) {
//       return res.status(404).send({ err_msg: 'Not authorized', error: "invalid token" })
//     }

//     const nextUID = String(await getNextUID("manager_table"))
//     const kr_time = getKrDate()
//     const c_table = await db.collection('manager_table').insertOne(
//       {
//         'uid': nextUID,
//         'counsel_uid': req.body.counsel_uid,
//         'group_uid': req.body.group_uid,
//         'external_uid': req.body.external_uid,
//         'counsel_result': req.body.counselResult.value,
//         'manager_content': req.body.content,
//         'counseler': req.cookies.name, //prevent impersonation
//         'reg_date': new Date(req.body.consultationTime),
//         'outgoing_num': req.body.outgoing_num,
//         'counsel_date': kr_time,

//         'counsel_section': req.body.counselSection.value,
//         'counsel_time': kr_time,
//         'web_uid': '',
//       }
//     );

//     if (!c_table.acknowledged) {
//       return res.status(500).send("Insert operation failed.");
//     }

//     const e_table = await db.collection('external_buyer_table').updateOne(
//       { uid: req.body.external_uid }, // Query to find the product by code
//       [
//         { $set: { counsel_uid: nextUID } },
//         { $set: { counsel_result: req.body.counselResult.value } },
//         { $set: { mod_date: kr_time } }
//       ]
//     );
//     if (!e_table.acknowledged) {
//       return res.status(500).send("Insert operation failed.");
//     }

//     const added_counsel = await db.collection('counsel_table').findOne({ 'uid': nextUID })
//     added_counsel["table"] = "c" // used in frontned
//     if (!added_counsel) {
//       console.log('No data found in the database.??');
//     } else {
//       console.log('sending: 1',);
//     }

//     return res.json([added_counsel]); //wrap it to a list
//   } catch (error) {
//     console.error('Failed to fetch customer-support-searchASTable-consultations:', error);
//     return res.status(500).json({ error_msg: 'Internal Server Error', error: error });
//   }
// });


// Handle any other requests and serve the React app
app.get('*', (req, res) => {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log("unknown request:", fullUrl);
  return res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});


