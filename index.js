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
      origin: ["https://portfolio-pi-one-12.vercel.app"],
      methods: ["POST", "GET"],
      credentials: true
  }
));
app.get("/", (req, res) => {
    res.json("Hello");
})
app.get("/api/tell", (req, res) => {
    res.json("Telling");
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

app.get('/api/ask', async (req, res) => {
  console.log('reacg')
  try {
    const { question } = req.query;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // For embeddings, use the Text Embeddings model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // Read and parse JSON data from file
    

    // Embed the question
    const questionResult = await model.embedContent(question);
    const questionEmbedding = questionResult.embedding.values;

    // Prepare data for embedding
    const data=[
    {
      "id": 1,
      "info": "Name/details/introduction",
      "description": "I am Nithin kasturi Experienced in full-stack development, blockchain, and machine learning projects."
    },
       {
      "id": 1,
      "info": "details",
      "description": "I am Nithin kasturi Experienced in full-stack development, blockchain, and machine learning projects."
    },
       {
      "id": 1,
      "info":  "introduction",
      "description": "I am Nithin kasturi. Experienced in full-stack development, blockchain, and machine learning projects."
    },
       {
      "id": 1,
      "info": "about",
      "description": "I am Nithin kasturi. Experienced in full-stack development, blockchain, and machine learning projects."
    },
    {
      "id": 2,
      "info": "Education , study",
      "description": "B.Tech in Computer Science and Engineering from Vignan Institute of Technology and Science (July 2020 – July 2024) with eighty percent."
    },
    {
      "id": 3,
      "info": "Technical Skills , languages",
      "description": "Languages: C, C++, Java, Python, JavaScript, Solidity. Frameworks: React, Node.js, Tailwind, Redux. Concepts: Data Structures, Algorithms, OOPs, Databases, Operating Systems, TCP/IP, Computer Networks."
    },
    {
      "id": 4,
      "info": "Projects",
      "description": "1. MERN Messenger: A full-stack chat app using MERN stack (MongoDB, Express.js, React.js, Node.js), JWT for authentication, and Socket.io for real-time messaging. 2. Decentralized Twitter Clone: Built with React and Solidity for secure blockchain transactions. 3. Interview Insights: An application that helps job seekers by using web scraping and a custom Google search engine to gather relevant job role information, and GPT-4 API to generate tailored interview questions.4.Book Store:The MERN-based Book Reviews project enables users to explore, read, and contribute reviews seamlessly. Leveraging MongoDB, Express.js, React, and Node.js, it ensures a dynamic, interactive, and secure platform."
    },
    {
      "id": 5,
      "info": "Certifications",
      "description": "1. The Joy of Computing Using Python (NPTEL). 2. Introduction to Programming through C++ (NPTEL). 3. Data Structures and Algorithms (Udemy). 4. Basics of Cloud Computing by IIT Kharagpur."
    },
    {
      "id": 6,
      "info": "Achievements",
      "description": "1. Qualified and participated in Hackathon 2023. 2. Institute Rank 2 on GeeksforGeeks. 3. Won prizes in coding competitions."
    },
    {
      "id": 7,
      "info": "Coding Profiles",
      "description": "GitHub: https://github.com/Nithin-kasturi/ \n LeetCode: https://leetcode.com/u/nithinkasturi8/"
    },
      
      {
      "id": 9,
      "info": "Coding Profiles",
      "description": "Hackerrank: https://www.hackerrank.com/profile/nithin20891a05e5"
    },
    {
      "id": 10,
      "info": "LinkedIn",
      "description": "https://www.linkedin.com/in/kasturi-nithin-142935242"
    },
      {
      "id": 11,
      "info": "Future objectives goals",
      "description": "I continually improve myself to contribute to the advancement of future generations and to spearhead the development of cutting-edge technologies that drive progress and innovation."
    },
  ]
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
