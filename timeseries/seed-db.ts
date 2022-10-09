import { MongoClient } from "mongodb";
import { UUID } from "bson";
import { assertEnvVar, loadEnv } from "../helpers/load-env";

loadEnv();

const mongourl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const client = new MongoClient(mongourl, {
  ignoreUndefined: true
});

export type Log = {
  _id: UUID;
  metadata: { chargingStationId: UUID };
  timestamp: Date;
  log: Record<string, any>;
};

async function setTimeoutPromise(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

async function main() {
  const db = client.db("timeseries");

  const collection = db.collection<Log>("logs");

  const logs: Log[] = [];
  for (let i = 0; i < 100; i++) {
    const log = {
      _id: new UUID(),
      metadata: { chargingStationId: new UUID() },
      timestamp: new Date(),
      log: {
        occpMessageType: "RemoteStartTransaction",
        ocppMessageId: new UUID(),
        ocppMessagePayload: {}
      }
    };
    logs.push(log);
    console.log(log);

    await setTimeoutPromise(50);
  }

  await collection.insertMany(logs);

  console.log("Logs inserted");

  await client.close();
}

main();
