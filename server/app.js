const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const tripRoutes = require('./routes/tripRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/trip', tripRoutes);

module.exports = app;
