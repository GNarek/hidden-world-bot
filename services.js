// services.js
const axios = require("axios");
const cheerio = require("cheerio");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const chooseMostInterestingArticle = async (articles) => {
  const list = articles.map((a, i) => `${i + 1}. ${a.title}`).join("\n");

  const prompt = `
You are a curious and sharp editor. Here is a list of article titles from mystery news sources.

Choose the one that is the most interesting, mystery, curiosity-triggering, or attention-grabbing — the one that would get the most clicks on Facebook.

ONLY reply with the number of the most interesting one. Do not explain your choice. Just give the number.

Titles:
${list}`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a smart assistant who only replies with the number of the most interesting article.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 10,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = res.data.choices[0].message.content.trim();
  const chosenNumber = parseInt(content.match(/\d+/)?.[0], 10);
  return articles[chosenNumber - 1];
};

const fetchArticleText = async (url) => {
  try {
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(html);
    const paragraphs = $("p")
      .map((i, el) => $(el).text())
      .get()
      .filter((p) => p.length > 50)
      .slice(0, 10)
      .join("\n\n");
    return paragraphs.slice(0, 4000);
  } catch (err) {
    console.warn("⚠️ Failed to fetch article text:", err.message);
    return null;
  }
};

const extractOpenGraphImage = async (url) => {
  try {
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(html);
    return $('meta[property="og:image"]').attr("content") || null;
  } catch (err) {
    console.warn("⚠️ Failed to extract image from article:", err.message);
    return null;
  }
};

const summarizeWithGPT = async (text) => {
  const prompt = `Summarize the following article in 3–5 sentences (max 400 characters) in an informative, slightly curious tone. End with: 'Find the link in the comments 👇'\n\n${text}`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content.trim();
};

const generateImageWithDalle = async (title) => {
  const dallePrompt = `Create a surreal and mysterious thumbnail image that visually represents this headline: \"${title}\"`;

  const res = await axios.post(
    "https://api.openai.com/v1/images/generations",
    {
      model: "dall-e-3",
      prompt: dallePrompt,
      n: 1,
      size: "1024x1024",
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.data[0]?.url;
};

const postPhotoToFacebook = async (
  message,
  imageUrl,
  PAGE_ID,
  PAGE_ACCESS_TOKEN
) => {
  const res = await axios.post(`https://graph.facebook.com/${PAGE_ID}/photos`, {
    caption: message,
    url: imageUrl,
    access_token: PAGE_ACCESS_TOKEN,
  });
  return res.data.post_id;
};

const commentWithLink = async (postId, link, PAGE_ACCESS_TOKEN) => {
  await axios.post(`https://graph.facebook.com/${postId}/comments`, {
    message: `🔗 ${link}`,
    access_token: PAGE_ACCESS_TOKEN,
  });
};

module.exports = {
  chooseMostInterestingArticle,
  fetchArticleText,
  extractOpenGraphImage,
  summarizeWithGPT,
  generateImageWithDalle,
  postPhotoToFacebook,
  commentWithLink,
};
