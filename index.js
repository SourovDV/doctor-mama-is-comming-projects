require('dotenv').config()
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const cors = require('cors')
const cokkeparser = require('cookie-parser')
const port = process.env.PORT || 5000

// middleware
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://cers-doctor-projects.web.app'],
        credentials: true,
    }),
)
app.use(express.json())
app.use(cokkeparser())


const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASSWORD }@cluster0.gyherua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})


const verification = (req, res, next) => {
    const token = req?.cookies?.token
    //no token available
    if (!token) {
        return res.status(401).send({ messege: 'unauthorized access' })
    }
    jwt.verify(token, process.env.JSON_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ messege: 'forbidden access' })
        }
        req.user = decoded
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect()

        const serverDate = client.db('DoctorMama').collection('services')
        const bookmarkcollection = client.db('DoctorMama').collection('booking')

        app.get('/services', async (req, res) => {
            const cursor = serverDate.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        //for token generation

        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.JSON_TOKEN, {
                expiresIn: '1d',
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })

        //delete a token genarate for cokkies, but don't work this code

        app.post('/logOut', (req, res) => {
            const user = req.body
            res
                .clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production' ? true : false,
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })

        //services
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }
            // const option = {
            //     projection: {  title: 1, description: 0, price: 1, img: 0 },
            // }
            const result = await serverDate.findOne(query)
            res.send(result)
        })

        //bokking features
        app.post('/booking', async (req, res) => {
            const id = req.body

            const result = await bookmarkcollection.insertOne(id)
            res.send(result)
        })

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }
            const result = await bookmarkcollection.deleteOne(query)
            res.send(result)
        })

        app.get('/booking', async (req, res) => {


            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }

            const cursor = bookmarkcollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        console.log(
            'Pinged your deployment. You successfully connected to MongoDB!',
        )
    } finally {
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Doctor mama is coming')
})

app.listen(port, () => {
    console.log(`Doctor mama is coming port number is a : ${ port }`)
})
