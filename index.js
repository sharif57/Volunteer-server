const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



//MIDDLEWARE
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://volunteer-e0eac.web.app',
        'https://volunteer-e0eac.firebaseapp.com'
    ],
    // origin:'*',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())

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

// middlewares
const logger = async (req, res, next) => {
    console.log('called', req.host, req.originUrl);
    next()
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'not authorize' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //error
        if (err) {
            console.log(err);
            return res.status(401).status.send({ message: 'unauthorized' })
        }
        //if token is value then it would be decoded
        console.log('value in the token ', decoded);
        req.user = decoded
        next()
    })

}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const volunteerCollection = client.db('volunteer').collection('volunteerInfo');
        const modalCollection = client.db('volunteerModal').collection('modalInfo');

        //auth related
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
            })

                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res
                .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
                .send({ success: true })
        })


        //server related
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

        app.get('/volunteer/:email', async (req, res) => {
            console.log(req.params.email);
            const email = req.params.email;
            const query = { email: email }
            const result = await volunteerCollection.find(query).toArray();
            res.send(result)
            // console.log(result);
        })
        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await volunteerCollection.deleteOne(query)
            res.send(result)
            console.log(result);
        })

        app.put('/volunteerInfo/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const newUsers = req.body
            const items = {
                $set: {
                    Thumbnail: newUsers.Thumbnail,
                    PostTitle: newUsers.PostTitle,
                    Description: newUsers.Description,
                    Category: newUsers.Category,
                    Location: newUsers.Location,
                    VolunteersNeeded: newUsers.VolunteersNeeded,
                    Deadline: newUsers.Deadline,
                    OrganizerName: newUsers.OrganizerName,
                    email: newUsers.email,

                }
            }

            const result = await volunteerCollection.updateOne(filter, items, options)
            res.send(result)
        })



        // modal server
        app.post('/modalInfo', async (req, res) => {
            const newUsers = req.body;
            console.log(newUsers)
            const result = await modalCollection.insertOne(newUsers)
            res.send(result)
        })


        app.get('/modalInfo/:email', async (req, res) => {
            // const cursor = modalCollection.find();
            // const result = await cursor.toArray();
            // res.send(result)
            
            const email = req.params.email;
            console.log(email);
            const result = await modalCollection.find({ email: email }).toArray();
            console.log('length',result.length);
            res.send(result);

        })

        app.delete('/delete2/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            // const query = { _id:  }
            const result = await modalCollection.deleteOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
            console.log(result);

        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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