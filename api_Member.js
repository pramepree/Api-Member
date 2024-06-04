const express = require('express');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const cache = new NodeCache();

const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String
});

const Article = mongoose.model('articles', ArticleSchema);

app.get('/get_NameMember', async (req, res) => {
  const cachedArticles = cache.get('articles');
  if (cachedArticles) {
    res.json(cachedArticles);
  } else {
    try {
      const articles = await Article.find();
      cache.set('articles', articles, 3600); // cache for 1 hour
      res.json(articles);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});

app.post('/articles', async (req, res) => {
  try {
    const newArticle = req.body;
    const createdArticle = await Article.create(newArticle);
    cache.del('articles'); // invalidate cache
    res.status(201).json(createdArticle);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});