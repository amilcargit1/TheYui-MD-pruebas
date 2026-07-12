import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botName: "TheYui-MD",
  creator: "AmilcarGit",
  ownerNumber: process.env.OWNER_NUMBER || "",
  sessionFolder: "./session",
  pluginsFolder: "./plugins",

  newsletterJid: process.env.NEWSLETTER_JID || "",

  apis: {
    edward: {
      baseUrl: process.env.EDWARD_API_BASE_URL || "",
      apiKey: process.env.EDWARD_API_KEY || "",
    },
  },
};
