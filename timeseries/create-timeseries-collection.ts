import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";

loadEnv();

const mongourl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const client = new MongoClient(mongourl);

async function main() {
  const db = client.db("timeseries");

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

  await client.close();
}

main();
