const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const { query } = require('express');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mesrluc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
   // console.log('token verifyJWT', req.headers.authorization)
   const authHeader = req.headers.authorization;
   if (!authHeader) {
      return res.status(401).send('unauthorized access')
   }
   const token = authHeader.split(' ')[1];
   // console.log(token)

   jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
         console.log(err);
         return res.status(403).send({ message: 'forbidden access' })
      }
      req.decoded = decoded
      next()
   })
}

async function run() {
   try {

      const categoriesCollection = client.db('mobosell').collection('categories')
      const productsCollection = client.db('mobosell').collection('products')
      const bookingsCollection = client.db('mobosell').collection('bookings')
      const usersCollection = client.db('mobosell').collection('users')
      const paymentsCollection = client.db('mobosell').collection('payments')
      const verifyAdmin = async (req, res, next) => {
         // console.log("inside verifyAdmin", req.decoded.email);
         const decodedEmail = req.decoded.email;
         const query = { email: decodedEmail }
         const user = await usersCollection.findOne(query);

         if (user?.role !== 'admin') {
            return res.status(403).send({ message: 'forbidden access' })
         }
         next()
      }

      app.get('/categories', async (req, res) => {
         const query = {}
         const categories = await categoriesCollection.find(query).toArray()
         res.send(categories)
      })

      app.post('/categories', async (req, res) => {
         const category = req.body;
         const result = await categoriesCollection.insertOne(category);
         res.send(result)
      })


      app.get('/category/:id', async (req, res) => {
         const query = { category: req.params.id }
         const products = await productsCollection.find(query).toArray()
         res.send(products)
      })
      app.get('/products', async (req, res) => {
         const query = {};
         const products = await productsCollection.find(query).toArray();
         res.send(products)
      })
      //------------------------------
      app.get('/product/:id', async (req, res) => {
         const id = req.params.id
         const query = { _id: ObjectId(id) }
         const product = await productsCollection.findOne(query)
         res.send(product)
      })
      app.get('/report', async (req, res) => {
         const query = { report: true }
         const product = await productsCollection.find(query).toArray()
         res.send(product)
      })
      //--------------------------------
      app.post('/products', async (req, res) => {
         const product = req.body;
         const result = await productsCollection.insertOne(product);
         res.send(result)
      })


      app.get('/sellerProducts', verifyJWT, async (req, res) => {
         const email = req.query?.email;
         const decodedEmail = (req.decoded?.email)
         console.log(email, decodedEmail)

         if (email !== decodedEmail) {
            return res.status(403).send({ message: 'forbidden access' })
         }

         console.log('token', req.headers.authorization);
         const query = { email: email };
         const products = await productsCollection.find(query).toArray();
         res.send(products)
      })

      app.delete('/products/:id', verifyJWT, verifyAdmin, async (req, res) => {
         const id = req.params.id;
         const filter = { _id: ObjectId(id) }
         const result = await productsCollection.deleteOne(filter)
         res.send(result)
      })
      app.get('/bookings/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const booking = await bookingsCollection.findOne(query)
         res.send(booking)
      })
      //--------Booing-----
      app.get('/bookings', verifyJWT, async (req, res) => {
         const email = req.query?.email;
         const decodedEmail = (req.decoded?.email)
         console.log(email, decodedEmail)

         if (email !== decodedEmail) {
            return res.status(403).send({ message: 'forbidden access' })
         }

         console.log('token', req.headers.authorization);
         const query = { email: email };
         const bookings = await bookingsCollection.find(query).toArray();
         res.send(bookings)
      })
      app.get('/bookings/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const booking = await bookingsCollection.findOne(query)
         res.send(booking)
      })
      //--------------

      app.post('/bookings', async (req, res) => {
         const booking = req.body;

         const query = {
            productId: booking.productId,
            productName: booking.productName

         }
         const alreadyBooked = await bookingsCollection.find(query).toArray();
         if (alreadyBooked.length) {
            // const message = `You already have a book on ${booking.name}`
            const message = "You already have a book this item"
            return res.send({ acknowledged: false, message })
         }
         const result = await bookingsCollection.insertOne(booking)
         res.send(result)
      })

      //payment

      app.post('/create-payment-intent', async (req, res) => {
         const booking = req.body;
         const price = booking.price;
         const amount = price * 100;

         // Create a PaymentIntent with the order amount and currency
         const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: amount,
            "payment_method_types": [
               "card"
            ]
            // automatic_payment_methods: {
            //    enabled: true,
            // },
         });
         res.send({
            clientSecret: paymentIntent.client_secret,
         })
      })
      app.post('/payments', async (req, res) => {
         const payment = req.body;
         const productId = payment.productId
         const query = { _id: ObjectId(productId) }
         const up = {
            $set: {
               sold: true,
               transactionId: payment.transactionId
            }
         }
         const result = await paymentsCollection.insertOne(payment);
         const id = payment.bookingId
         const filter = { _id: ObjectId(id) }
         const updatedDoc = {
            $set: {
               paid: true,
               transactionId: payment.transactionId
            }
         }
         const updateResult = await bookingsCollection.updateMany(filter, updatedDoc)
         const updateUp = await productsCollection.updateOne(filter, up)
         res.send({ result, updateResult, updateUp })
      })

      app.get('/jwt', async (req, res) => {
         const email = req.query.email;
         // console.log(email);
         const query = { email: email };
         const user = await usersCollection.findOne(query);
         if (user) {
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })
            // console.log(token)
            return res.send({ accessToken: token })
         }
         res.status(403).send({ accessToken: '' })

      })

      app.get('/sellers', async (req, res) => {
         const query = { role: "seller" }
         const sellers = await usersCollection.find(query).toArray()
         res.send(sellers)
      })
      app.get('/buyers', async (req, res) => {
         const query = { role: "buyer" }
         const buyers = await usersCollection.find(query).toArray()
         res.send(buyers)
      })
      app.get('/users', async (req, res) => {
         const query = {}
         const users = await usersCollection.find(query).toArray()
         res.send(users)
      })
      app.get('/users/admin/:email', async (req, res) => {
         const email = req.params.email
         console.log(email);
         const query = { email: email }

         const user = await usersCollection.findOne(query);
         console.log(user);
         res.send({ isAdmin: user?.role === 'admin' })
      })
      app.get('/users/seller/:email', async (req, res) => {
         const email = req.params.email
         console.log(email);
         const query = { email: email }

         const user = await usersCollection.findOne(query);
         console.log(user);
         res.send({ isSeller: user?.role === 'seller' })
      })
      app.get('/users/buyer/:email', async (req, res) => {
         const email = req.params.email
         console.log(email);
         const query = { email: email }

         const user = await usersCollection.findOne(query);
         console.log(user);
         res.send({ isBuyer: user?.role === 'buyer' })
      })
      app.post('/users', async (req, res) => {
         const user = req.body;
         const query = { email: user.email }
         const find = await usersCollection.findOne(query)
         if (find) {
            return res.send({ found: true })
         }
         const result = await usersCollection.insertOne(user)
         res.send(result)
      })

      app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
         const id = req.params.id;
         const filter = { _id: ObjectId(id) }
         const option = { upsert: true }
         const updatedDoc = {
            $set: {
               role: 'admin'
            }
         }
         const result = await usersCollection.updateOne(filter, updatedDoc, option);
         res.send(result)
      })
      app.put('/report/:id', verifyJWT, async (req, res) => {
         const id = req.params.id;
         const filter = { _id: ObjectId(id) }
         const option = { upsert: true }
         const updatedDoc = {
            $set: {
               report: true
            }
         }
         const result = await productsCollection.updateOne(filter, updatedDoc, option);
         res.send(result)
      })

   }
   finally { }
}
run().catch(console.log)







app.get('/', async (req, res) => {
   res.send('mobo server running ')
})
app.listen(port, () => console.log(`mobosell running on ${port}`))