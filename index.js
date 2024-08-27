import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bodyParser from 'body-parser';
import cors from 'cors';
import twilio from 'twilio';
import useragent from 'useragent';

const app = express();
const PORT = 5000;
const API_KEY = 'AIzaSyCHinmyQACA01wyHYvWSn2ULevRuYi6Hc0'; // Use environment variable for API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Twilio credentials
const TWILIO_ACCOUNT_SID = 'ACa0bf61147639c70db9c7aa53a70d536f';  // Replace with your Twilio Account SID
const TWILIO_AUTH_TOKEN = '19c33ab5a05aa561d1d7499730874398';    // Replace with your Twilio Auth Token
const TWILIO_PHONE_NUMBER = '+12566176053'; // Replace with your Twilio phone number
const RECIPIENT_PHONE_NUMBER = '+919502863501'; // Replace with the phone number you want to receive SMS

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: ["https://portfolio-pi-one-12.vercel.app"],
  methods: ["POST", "GET"],
  credentials: true
}));

app.get("/", (req, res) => {
    res.json("Hello");
});

app.get("/api/tell", (req, res) => {
    res.json("Telling");
});

app.post('/track-visit', (req, res) => {
  const agent = useragent.parse(req.body.userAgent);
  const deviceDetails = `
    Device: ${agent.device.toString()}
    OS: ${agent.os.toString()}
    Browser: ${agent.toAgent()}
  `;

  // Send SMS via Twilio
  client.messages.create({
    body: `Your portfolio was visited! \n\nDetails:\n${deviceDetails}\nReferrer: ${req.body.referrer}`,
    from: TWILIO_PHONE_NUMBER,
    to: RECIPIENT_PHONE_NUMBER
  })
  .then(message => console.log('SMS sent: ' + message.sid))
  .catch(error => console.error('Error sending SMS:', error));

  res.sendStatus(200);
});

app.post('/send-sms', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Send SMS via Twilio
  client.messages.create({
    body: `New message from ${name} (${email}): ${message}`,
    from: TWILIO_PHONE_NUMBER,
    to: RECIPIENT_PHONE_NUMBER
  })
  .then(message => {
    console.log('SMS sent: ' + message.sid);
    res.status(200).json({ success: true });
  })
  .catch(error => {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  });
});

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
  try {
    const { question } = req.query;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // For embeddings, use the Text Embeddings model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // Embed the question
    const questionResult = await model.embedContent(question);
    const questionEmbedding = questionResult.embedding.values;

    // Prepare data for embedding
    const data = [
      {
        "id": 1,
        "info": "name",
        "description": "I am Nithin kasturi Experienced in full-stack development, blockchain, and machine learning projects."
      },
      {
        "id": 1,
        "info": "introduce",
        "description": "I am Nithin Kasturi, a highly skilled and versatile individual with substantial experience in full-stack development, blockchain technology, and machine learning. I hold a B.Tech in Computer Science and Engineering from Vignan Institute of Technology and Science, where I achieved an impressive eighty percent. My technical expertise spans several programming languages, including C, C++, Java, Python, JavaScript, and Solidity. I am proficient in frameworks such as React, Node.js, and Tailwind, and I have a solid grasp of concepts like data structures, algorithms, and computer networks."
      },
      {
        "id": 2,
        "info": "Education, study",
        "description": "B.Tech in Computer Science and Engineering from Vignan Institute of Technology and Science (July 2020 – July 2024) with eighty percent."
      },
      {
        "id": 3,
        "info": "Technical Skills, languages",
        "description": "Languages: C, C++, Java, Python, JavaScript, Solidity. Frameworks: React, Node.js, Tailwind, Redux. Concepts: Data Structures, Algorithms, OOPs, Databases, Operating Systems, TCP/IP, Computer Networks."
      },
      {
        "id": 4,
        "info": "Projects",
        "description": "1. MERN Messenger: A full-stack chat app using MERN stack (MongoDB, Express.js, React.js, Node.js), JWT for authentication, and Socket.io for real-time messaging. 2. Decentralized Twitter Clone: Built with React and Solidity for secure blockchain transactions. 3. Interview Insights: An application that helps job seekers by using web scraping and a custom Google search engine to gather relevant job role information, and GPT-4 API to generate tailored interview questions. 4. Book Store: The MERN-based Book Reviews project enables users to explore, read, and contribute reviews seamlessly. Leveraging MongoDB, Express.js, React, and Node.js, it ensures a dynamic, interactive, and secure platform."
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
        "description": "GitHub: https://github.com/Nithin-kasturi/ \nLeetCode: https://leetcode.com/u/nithinkasturi8/ \nHackerrank: https://www.hackerrank.com/profile/nithin20891a05e5"
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
    ];

    // Process data for embedding
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
