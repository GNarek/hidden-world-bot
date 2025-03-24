// poster.js
require("dotenv").config();
const fs = require("fs");
const Parser = require("rss-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const { loadPostedLinks, savePostedLinks } = require("./gistStorage");

const {
  chooseMostInterestingArticle,
  fetchArticleText,
  extractOpenGraphImage,
  summarizeWithGPT,
  generateImageWithDalle,
  postPhotoToFacebook,
  commentWithLink,
} = require("./services");

const PAGE_ID = "614928315032964";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const FEEDS = [
  "https://www.wired.com/feed/rss",
  "https://www.huffpost.com/section/weird-news/feed",
  "https://anomalien.com/feed/",
  // "https://www.theonion.com/rss", // not mystery
  // "https://www.cracked.com/crackedrss/allposts.xml", ,  // not mystery but interesting
  // "https://reductress.com/feed",  // not mystery
  // "https://www.betootaadvocate.com/feed",   // not mystery
  // "https://www.thepoke.co.uk/feed", // not mystery
  // "https://www.thedailymash.co.uk/feed",  // not mystery
  // "https://newsbiscuit.com/feed",  // not mystery
  // "https://babylonbee.com/feed",  // not mystery
  // "https://newsthump.com/feed",  // not mystery
  // "https://boingboing.net/feed/",   // not mystery
  // "https://www.oddee.com/feed/",  // not mystery but weird
];

const parser = new Parser();

const collectAllArticles = async (postedLinks) => {
  const articles = [];
  for (const feedUrl of FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items) {
        if (item.title && item.link && !postedLinks.includes(item.link)) {
          articles.push({ title: item.title, link: item.link });
        }
      }
    } catch (err) {
      console.warn(`⚠️ Failed to parse feed: ${feedUrl}`);
    }
  }
  return articles;
};

(async () => {
  const postedLinks = await loadPostedLinks();
  const articles = await collectAllArticles(postedLinks);
  if (!articles.length) return console.log("❌ No new articles found.");

  const chosen = await chooseMostInterestingArticle(articles);
  console.log("🧠 Chosen:", chosen.title);

  const fullText = await fetchArticleText(chosen.link);
  const hashtags = "#WeirdNews #HiddenWorld #StrangeButTrue #DailyCuriosity";
  const message = await summarizeWithGPT(fullText);
  const messageWithTags = +"\n\n\n\n\n\n\n\n" + hashtags;

  let imageToPost = await extractOpenGraphImage(chosen.link);
  if (!imageToPost) {
    console.log("🖼️ No image found — generating with DALL·E...");
    imageToPost = await generateImageWithDalle(chosen.title);
  }

  const postId = await postPhotoToFacebook(
    messageWithTags,
    imageToPost,
    PAGE_ID,
    PAGE_ACCESS_TOKEN
  );
  if (postId) {
    await commentWithLink(postId, chosen.link, PAGE_ACCESS_TOKEN);
    postedLinks.push(chosen.link);
    await savePostedLinks(postedLinks);
    console.log("✅ Done.");
  }
})();
