const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DATA_USER}:${process.env.DATA_PASS}@cluster0.cwjeixv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const volunteerCollection = client.db('volunteer').collection('volunteerInfo');
        const modalCollection = client.db('volunteerModal').collection('modalInfo');

        app.post('/volunteerInfo', async (req, res) => {
            const newUsers = req.body;
            console.log(newUsers)
            const result = await volunteerCollection.insertOne(newUsers)
            res.send(result)
        })

        app.get('/volunteerInfo', async (req, res) => {
            const cursor = volunteerCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/volunteerInfo/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await volunteerCollection.findOne(query);
            res.send(result)
        })

        app.get('/volunteerInfo/:email', async (req, res) => {
            console.log(req.params.email);
            const result = await volunteerCollection.find({ email: req.params.email }).toArray();
            res.send(result)
            // console.log(result);
        })

        // modal server
        app.post('/modalInfo', async (req, res) => {
            const newUsers = req.body;
            console.log(newUsers)
            const result = await modalCollection.insertOne(newUsers)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Volunteer is running')
})

app.listen(port, () => {
    console.log(`Volunteer server is running on port ${port}`);
})