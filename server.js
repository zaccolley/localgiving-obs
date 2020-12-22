const express = require("express");
const app = express();

const getLocalGivingJson = require("./getLocalGivingJson.js");
const connectBot = require("./twitchBot.js");

app.get("/api/data/:urlId", async (request, response) => {
  const { urlId } = request.params;
  try {
    const json = await getLocalGivingJson(urlId);
    response.json(json);
  } catch (e) {
    console.error(e);
    response.json({ error: "Something went wrong" });
  }
});

app.get("/api/connectBot", async (request, response) => {
  const { channel, urlId } = request.query;
  connectBot({ channel, urlId });  
  response.sendStatus(200);
});

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
