const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://mobosell:YMlT3Xl0cgrFICaF@cluster0.mesrluc.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
   try {
      const categoriesCollection = client.db('mobosell').collection('categories')
      app.post('/categories', async (req, res) => {
         const category = req.body;
         const result = await categoriesCollection.insertOne(category);
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