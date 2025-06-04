import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false, // <<< Ignore invalid certificates
});

async function getEmbedding(text) {
  const response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: text,
      model: "text-embedding-ada-002",
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_TOKEN}`, // 👈 Here!
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data[0].embedding;
}

export { getEmbedding };
