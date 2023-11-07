const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.dokkyfc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("cloths").collection("services");
    const cartCollection = client.db("cloths").collection("cart");

    app.post("/addService", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.json(result);
    });

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find({});
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.json(service);
    });

    app.get("/services/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.json(result);
    });

    

    app.patch("/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedService = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          yourName: updatedService.yourName,
          price: updatedService.price,
          description: updatedService.description,
          image: updatedService.image,
          serviceArea: updatedService.serviceArea,
          serviceName: updatedService.serviceName,
          email: updatedService.email,
        },
      };
      const result = await serviceCollection.updateOne(
        query,
        updateDoc,
        options
      );

      res.json(result);
    });

    app.post("/addOrder", async (req, res) => {
      const order = req.body;
      const result = await cartCollection.insertOne(order);
      res.json(result);
    });

    app.delete("/deleteOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.json(result);
    });

    app.get("/orders", async (req, res) => {
      const cursor = cartCollection.find({});
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = cartCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.get("/serviceMail/:serviceEmail", async (req, res) => {
      const serviceEmail = req.params.serviceEmail;
      const query = { serviceEmail: serviceEmail };
      // console.log(serviceEmail);
      const cursor = cartCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
      // console.log(orders);
    });

    app.patch("/updateOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedOrder = req.body;
      // console.log(updatedOrder);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updatedOrder.status,
          
        },
      };
      const result = await cartCollection.updateOne(
        query,
        updateDoc,
        options
      );

      res.json(result);
    });


    // app.get('/orders/:email', async(req,res)=>{
    //   console.log(req.params.email);
    //   const result = await cartCollection.find({email: req.params.email}).toArray();
    //   res.send(result);
    // });

    // app.get("/orders", async (req, res) => {
    //   const cursor = cartCollection.find({});
    //   const orders = await cursor.toArray();
    //   res.send(orders);
    // });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
