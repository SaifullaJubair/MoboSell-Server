const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const { query } = require('express');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mesrluc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
   try {

      const categoriesCollection = client.db('mobosell').collection('categories')
      const productsCollection = client.db('mobosell').collection('products')
      const bookingsCollection = client.db('mobosell').collection('bookings')

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
      //--------------------------------
      app.post('/products', async (req, res) => {
         const product = req.body;
         const result = await productsCollection.insertOne(product);
         res.send(result)
      })

      app.post('/bookings', async (req, res) => {
         const booking = req.body;

         const query = {
            userName: booking.userName,
            userEmail: booking.userEmail,
         }
         const alreadyBooked = await bookingsCollection.find(query).toArray();
         if (alreadyBooked.length) {
            // const message = `You already have a book on ${booking.appointmentDate}`
            const message = "You already have a book this item"
            return res.send({ acknowledged: false, message })
         }
         const result = await bookingsCollection.insertOne(booking)
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