const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const uri=process.env.ATLAS_URI;
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;

connection.once('open', () => {
    console.log("Connection has been made")
});

const bugRouter = require('./routes/bug');
app.use('/bug', bugRouter);

app.listen(port,()=>{ console.log(`Server started on ${port}`)});
