import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import bodyParser from 'body-parser';
import cors from 'cors'
const app = express();
const PORT = 5000;
const API_KEY = 'AIzaSyCHinmyQACA01wyHYvWSn2ULevRuYi6Hc0'; // Your API key
const genAI = new GoogleGenerativeAI(API_KEY);
// app.use(bodyParser.json());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors(
  {
      origin: ["http://localhost:5173"],
      methods: ["POST", "GET"],
      credentials: true
  }
));
app.get("/", (req, res) => {
    res.json("Hello");
})
// Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, value, index) => sum + (value * vecB[index]), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value ** 2, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Find the most relevant section based on the question
function findMostRelevantSection(sections, embeddings, questionEmbedding) {
  let bestMatch = '';
  let highestSimilarity = -1;

  for (let i = 0; i < sections.length; i++) {
    const similarity = cosineSimilarity(embeddings[i], questionEmbedding);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = sections[i];
    }
  }

  return bestMatch;
}

app.post('/api/ask', async (req, res) => {
  console.log('reacg')
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // For embeddings, use the Text Embeddings model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // Read and parse JSON data from file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

    // Embed the question
    const questionResult = await model.embedContent(question);
    const questionEmbedding = questionResult.embedding.values;

    // Prepare data for embedding
    const sections = data.map(item => `${item.info}: ${item.description}`);

    // Embed each section of the data
    const embeddings = await Promise.all(sections.map(async (section) => {
      const result = await model.embedContent(section);
      return result.embedding.values;
    }));

    // Find the most relevant section based on similarity
    const answer = findMostRelevantSection(sections, embeddings, questionEmbedding);

    // Send response
    res.json({ answer });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
