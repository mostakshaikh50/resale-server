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



async function run(){
    try{

    }
    finally{

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('Laptop resale server is running');
})

app.listen(port, () => console.log(`Laptop resale running on ${port}`));