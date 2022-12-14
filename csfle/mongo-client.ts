import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";

loadEnv();

const dburl = assertEnvVar(process.env.DATABASE_URL, "Missing DATABASE_URL");

export const client = new MongoClient(dburl);
