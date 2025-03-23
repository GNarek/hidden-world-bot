const axios = require("axios");

const GIST_ID = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
const FILENAME = "posted.json";

const headers = {
  Authorization: `Bearer ${GIST_TOKEN}`,
  "Content-Type": "application/json",
};

async function loadPostedLinks() {
  try {
    const res = await axios.get(GIST_API_URL, { headers });
    const content = res.data.files[FILENAME].content;
    return JSON.parse(content);
  } catch (err) {
    console.error("❌ Failed to load posted.json from Gist:", err.message);
    return [];
  }
}

async function savePostedLinks(postedLinks) {
  try {
    await axios.patch(
      GIST_API_URL,
      {
        files: {
          [FILENAME]: {
            content: JSON.stringify(postedLinks, null, 2),
          },
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("❌ Failed to update posted.json on Gist:", err.message);
  }
}

module.exports = { loadPostedLinks, savePostedLinks };
