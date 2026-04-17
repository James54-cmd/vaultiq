const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const redirectUri = "http://localhost:3000/api/auth/callback";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const file = fs.readFileSync(envPath, "utf8");
  for (const line of file.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

function getOauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function main() {
  loadEnvFile();

  const oauth2Client = getOauthClient();
  const code = process.env.GMAIL_AUTH_CODE?.trim();

  if (!code) {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    });

    console.log("Open this URL:");
    console.log(url);
    console.log("");
    console.log("After approval, copy the `code` from the callback URL and rerun with:");
    console.log("GMAIL_AUTH_CODE=\"your_code_here\" node scripts/get-gmail-token.js");
    return;
  }

  const { tokens } = await oauth2Client.getToken(code);

  console.log("Copy these into .env.local:");
  console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token ?? ""}`);
  console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token ?? ""}`);
  console.log(`GMAIL_TOKEN_EXPIRY_DATE=${tokens.expiry_date ?? ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
