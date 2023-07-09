const { encode } = require("gpt-3-encoder");
const fs = require("fs");
const CHUNK_LIMIT = 200;
const CHUNK_MINIMAL = 100;
require("dotenv").config();
const openAiHelper = require("./openAi");
const supabaseHelper = require("./supabase");

const chunkArticle = (article) => {
  const articleTextChunks = [];
  const chunkSize = CHUNK_LIMIT;
  let startIndex = 0;

  while (startIndex < article.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex >= article.length) {
      endIndex = article.length;
    } else {
      // Find the last occurrence of ". " within the chunk
      const lastDotIndex = article.lastIndexOf(". ", endIndex);
      if (lastDotIndex !== -1) {
        endIndex = lastDotIndex + 2; // Include the dot and space
      }
    }

    const chunkText = article.substring(startIndex, endIndex).trim();
    articleTextChunks.push(chunkText);

    startIndex = endIndex;
  }

  const articleChunks = articleTextChunks.map((text) => {
    return {
      content: text,
      content_length: text.length,
      content_tokens: encode(text).length,
      embedding: [],
    };
  });

  return articleChunks;
};

(async () => {
  const article = await fs.readFileSync("training_data.txt", {
    encoding: "utf-8",
  });
  const chunkedArticles = await chunkArticle(article);  
  for (let i = 0; i < chunkedArticles.length; i++) {
    const embedding = await openAiHelper.createEmbedding(
      chunkedArticles[i].content
    );
    const { data, error } = await supabaseHelper
      .from("semantic_search_poc")
      .insert({
        content: chunkedArticles[i].content,
        content_tokens: chunkedArticles[i].content_tokens,
        embedding,
      });
    setTimeout(() => {}, 500);
  }
})();
