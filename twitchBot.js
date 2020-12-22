// bring in our environment variables
require("dotenv").config();

const {
  TWITCH_CHANNEL_NAME,
  TWITCH_BOT_NAME,
  TWITCH_OAUTH_TOKEN
} = process.env;

const tmi = require("tmi.js");
const getLocalGivingJson = require("./getLocalGivingJson.js");

async function connectBot({ channel, urlId }) {
  console.log("Connecting to...", channel);

  const client = new tmi.Client({
    options: {
      debug: true,
      messagesLogLevel: "info"
    },
    connection: {
      reconnect: true,
      secure: true
    },
    identity: {
      username: TWITCH_BOT_NAME,
      password: TWITCH_OAUTH_TOKEN
    },
    channels: [channel]
  });

  await client.connect();
  
  // remove existing message listeners
  client.removeAllListeners(['message']);

  client.on("message", async (channel, tags, message, self) => {
    if (self) return;

    if (message.toLowerCase() === "!donate") {
      try {
        const json = await getLocalGivingJson(urlId);
        const { donationUrl, charity } = json;

        client.say(
          channel,
          `Donate to ${charity.name}: ${donationUrl}. ${charity.description}`
        );
      } catch (e) {
        console.error(e);
      }
    }
  });
}

module.exports = connectBot;
