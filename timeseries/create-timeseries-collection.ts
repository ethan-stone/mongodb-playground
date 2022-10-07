import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";

loadEnv();

const mongoUrl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const mongoClient = new MongoClient(mongoUrl);

async function main() {
  const db = mongoClient.db("timeseries");

  const collectionsCursor = db.listCollections();
  const collectionsArray = await collectionsCursor.toArray();
  const logsCollection = collectionsArray.find((c) => c.name === "logs");

  if (!logsCollection) {
    await db.createCollection("logs", {
      timeseries: {
        timeField: "timestamp",
        metaField: "metadata"
      }
    });
  }

  await mongoClient.close();
}

main();
