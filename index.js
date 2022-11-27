const express = require('express');
const cors = require('cors');
//var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
//const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s3sxdks.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoryCollection = client.db('laptopDeals').collection('categories');
        const productCollection = client.db('laptopDeals').collection('products');
        const bookingsCollection = client.db('laptopDeals').collection('bookings');
        const usersCollection = client.db('laptopDeals').collection('users');


        app.get('/category', async(req, res) =>{
            const query ={}
            const category = await categoryCollection.find(query).toArray()
            res.send(category)
           });     
           
           app.get('/category/:id', async (req, res) => {
            const id = req.params.id
            const query = { category_id: id }
            const result = await productCollection.find(query).toArray()
            res.send(result)
        });

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            //const decodedEmail = req.decoded.email;
            // if (email != decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);

        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        
    }
    finally{

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('Laptop resale server is running');
})

app.listen(port, () => console.log(`Laptop resale running on ${port}`));