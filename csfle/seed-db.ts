import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";

loadEnv();

const mongurl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const client = new MongoClient(mongurl);
