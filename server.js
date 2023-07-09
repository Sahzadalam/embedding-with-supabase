const { default: axios } = require("axios");
const openAiHelper = require("./openAi");
const supabaseHelper = require("./supabase");

const express = require("express");
const fs = require("fs");
const app = express();
const port = 4000;

app.get("/", async (req, res) => {
  const { q } = req.query;
  console.log(q);
  const embedding = await openAiHelper.createEmbedding(q);
  const { data, error } = await supabaseHelper.rpc("semantic_search", {
    query_embedding: embedding,
    similiarity_threshold: 0.5,
    match_count: 5,
  });
  console.log(data);
  console.log(error);
  if (error) {
    res.status(404).send({ message: `${q} does not match any context` });
  } else {
    res.status(200).send([...data]);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
