import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedProfile = null;

export function getProfile() {
  if (!cachedProfile) {
    const filePath = path.join(__dirname, "../data/profile.json");
    cachedProfile = JSON.parse(readFileSync(filePath, "utf8"));
  }
  return cachedProfile;
}

export function getPublicProfile() {
  const profile = getProfile();
  return {
    name: profile.name,
    title: profile.title,
    location: profile.location,
    starterQuestions: profile.starterQuestions || [],
  };
}
