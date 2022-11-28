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
        console.log({err, decoded})
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
        const addProductCollection = client.db('laptopDeals').collection('addProduct');
        const paymentCollection = client.db('laptopDeals').collection('payments');

        const verifyAdmin = async (req, res, next) => {
            console.log(req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }


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
            console.log({email, decodedEmail})
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

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        });
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        });


        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.Access_TOKEN, { expiresIn: '7d' });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' });
        });


        app.get('/productCategory', async (req, res) => {
            const query = {}
            const result = await productCollection.find(query).project({ CategoryName: 1 }).toArray();
            res.send(result);
        });

        app.get('/addproduct', async (req, res) => {
            const query = {}
            const products = await addProductCollection.find(query).toArray();
            res.send(products);
        })

        app.post('/addproduct', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await addProductCollection.insertOne(product);
            res.send(result);
        });
        app.delete('/addproduct/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await addProductCollection.deleteOne(filter);
            res.send(result);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        });

        app.post('/create-payment-intent', async(req, res) =>{
            const booking = req.body;
            const price = booking.price;
            const amount = price;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types" : ["card"]

            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async(req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        
    }
    finally{

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('Laptop resale server is running');
})

app.listen(port, () => console.log(`Laptop resale running on ${port}`));