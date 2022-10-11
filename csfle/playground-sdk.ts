import { MongoClient } from "mongodb";
import { assertEnvVar, loadEnv } from "../helpers/load-env";
import { UserRepo } from "./user-repo";

loadEnv();

const dburl = assertEnvVar(process.env.DATABASE_URL, "Missing DATABASDE_URL");

export const client = new MongoClient(dburl);

export class Playground {
  constructor(private userRepo: UserRepo) {}

  get users() {
    return this.userRepo;
  }
}

export const playground = new Playground(new UserRepo(client.db("ddd")));
