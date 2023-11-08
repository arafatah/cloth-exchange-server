const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion,ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://shop-auth-5d9ec.web.app",
      "https://shop-auth-5d9ec.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.dokkyfc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware


const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log('token in the middleware here', token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "forbidden" });
    }
    req.user = decoded;

    next();
  });
};

const dbConnect = async () => {
  try {
    client.connect();
    console.log("DB Connected Successfully✅");
  } catch (error) {
    console.log(error.name, error.message);
  }
};
dbConnect();



const serviceCollection = client.db("cloths").collection("services");
const cartCollection = client.db("cloths").collection("cart");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// auth related api
app.post("/jwt", async (req, res) => {
  const user = req.body;
  // console.log("get user her", user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({
      status: true,
    });
});

app.post("/logout", async (req, res) => {
  const user = res.body;
  // console.log("get user her", user);
  res
    .clearCookie("token", {
      maxAge: 0,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ status: true });
});

// Add a new service api here
app.post("/addService", async (req, res) => {
  const service = req.body;
  const result = await serviceCollection.insertOne(service);
  res.json(result);
});

// get all services api here
app.get("/services", async (req, res) => {
  const cursor = serviceCollection.find({});
  const services = await cursor.toArray();
  res.send(services);
});

// get single service api here
app.get("/service/:id", verifyToken, async (req, res) => {
  console.log('Token user info here', req.user.email);
  console.log("|hello", req.params.email);
  // if(req.user.email !== req.params.email){
  //   return res.status(403).send({message: 'forbidden'});
  // }
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const service = await serviceCollection.findOne(query);
  res.json(service);
});

// get single service by email api here
app.get("/services/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const cursor = serviceCollection.find(query);
  const services = await cursor.toArray();
  res.send(services);
});

// delete service api here
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
  const result = await serviceCollection.updateOne(query, updateDoc, options);

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

app.get("/orders", verifyToken, async (req, res) => {
  const cursor = cartCollection.find({});
  const orders = await cursor.toArray();
  res.send(orders);
});

app.get("/orders/:email", verifyToken, async (req, res) => {
  // console.log('Token user info here', req.user.email);
  // console.log("|hello", req.params.email);
  if (req.user.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden" });
  }
  const email = req.params.email;
  const query = { email: email };
  const cursor = cartCollection.find(query);
  const orders = await cursor.toArray();
  res.send(orders);
});

app.get("/serviceMail/:serviceEmail", verifyToken, async (req, res) => {
  // console.log("Token user info here", req.user.email);
  // console.log("|hello", req.params.serviceEmail);
  if (req.user.email !== req.params.serviceEmail) {
    return res.status(403).send({ message: "forbidden" });
  }
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
  const result = await cartCollection.updateOne(query, updateDoc, options);

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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
