const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());



const { query } = require('express');


const uri = "mongodb+srv://mobosell:YMlT3Xl0cgrFICaF@cluster0.mesrluc.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
   try {
      const categoriesCollection = client.db('mobosell').collection('categories')
      const productsCollection = client.db('mobosell').collection('products')
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


      app.get('/products', async (req, res) => {
         const query = {};
         const products = await productsCollection.find(query).toArray();
         res.send(products)
      })

      app.post('/products', async (req, res) => {
         const product = req.body;
         const result = await productsCollection.insertOne(product);
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