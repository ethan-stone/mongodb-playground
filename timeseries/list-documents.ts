import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";
import { Log } from "./seed-db";

loadEnv();

const mongourl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const client = new MongoClient(mongourl);

async function main() {
  const db = client.db("timeseries");
  const collection = db.collection<Log>("logs");

  const cursor = collection.find({}, { skip: 0, limit: 10 });

  const array = await cursor.toArray();

  console.log(JSON.stringify(array, undefined, 4));

  await client.close();
}

main();
