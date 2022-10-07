import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";
import { Log } from "./seed-db";

loadEnv();

const mongoUrl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const mongoClient = new MongoClient(mongoUrl);

async function main() {
  const db = mongoClient.db("timeseries");
  const collection = db.collection<Log>("logs");

  const cursor = collection.find({}, { skip: 0, limit: 10 });

  const array = await cursor.toArray();

  console.log(JSON.stringify(array));

  await mongoClient.close();
}

main();
