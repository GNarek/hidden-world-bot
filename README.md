# Hidden World Bot 🤖🌍

Automatically picks the weirdest RSS article, summarizes it with GPT, generates a surreal thumbnail with DALL·E, and posts to a Facebook page.

### 🔧 Setup

1. Clone the repo
2. Create `.env` file with:
   OPENAI_API_KEY=…
   PAGE_ACCESS_TOKEN=…
   GIST_ID=…
   GIST_TOKEN=…
3. Run manually with:

```bash
node poster.js
```

4. Or set up GitHub Actions to run every 3 hours!

5. 🧠 Tech Used
   • OpenAI GPT + DALL·E
   • Facebook Graph API
   • GitHub Gist for remote storage
