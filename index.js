const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

function verifyJWT(req, res, next) {
    console.log('verify', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

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

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email != decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
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
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.Access_TOKEN, { expiresIn: '1h' });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' });
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