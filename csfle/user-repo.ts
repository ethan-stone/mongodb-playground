import { Binary, UUID } from "bson";
import { Collection, Db, MongoClient } from "mongodb";
import { ClientEncryption } from "mongodb-client-encryption";
import { loadEnv, assertEnvVar } from "../helpers/load-env";
import { randomUUID } from "crypto";

loadEnv();

const mongourl = assertEnvVar(
  process.env.DATABASE_URL,
  "Missing DATABASDE_URL"
);

const client = new MongoClient(mongourl);
const encryption = new ClientEncryption(client, {
  keyVaultNamespace: "encryption.__keyVault",
  kmsProviders: {
    gcp: {
      email: assertEnvVar(process.env.GCP_EMAIL, "Missing GCP_EMAIL"),
      privateKey: assertEnvVar(
        process.env.GCP_PRIVATE_KEY,
        "Missing GCP_PRIVATE_KEY"
      )
    }
  }
});

type MongoUser = {
  _id: UUID;
  email: Binary; // encrypted
};

export type User = {
  _id: string;
  email: string;
};

export type UserInsert = Omit<User, "_id">;

const dataKeyId = "wVaRu37fSkS4XtelFrT4tg==";

class UserRepo {
  private collection: Collection<MongoUser>;

  constructor(db: Db) {
    this.collection = db.collection<MongoUser>("users");
  }

  private async serialize(user: User) {
    const mongoUser: MongoUser = {
      _id: new UUID(user._id),
      email: await encryption.encrypt(user.email, {
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
        keyId: new Binary(Buffer.from(dataKeyId, "base64"), 4)
      })
    };

    return mongoUser;
  }

  // private async deserialize(mongoUser: MongoUser) {
  //   const user: User = {
  //     _id: mongoUser._id.toString(),
  //     email: await encryption.decrypt(mongoUser.email)
  //   };

  //   return user;
  // }

  public async insertOne(user: UserInsert) {
    const mongoUser = await this.serialize({ _id: randomUUID(), ...user });
    const result = await this.collection.insertOne(mongoUser);
    if (!result.acknowledged) throw new Error("Operation was not acknowledged");
    return { _id: result.insertedId };
  }

  public async insertMany(users: Array<UserInsert>) {
    const mongoUsers: Array<MongoUser> = [];
    for (const user of users) {
      mongoUsers.push(
        await this.serialize({
          _id: randomUUID(),
          ...user
        })
      );
    }

    const result = await this.collection.insertMany(mongoUsers);

    return {
      acknowledged: result.acknowledged
    };
  }
}

export const userRepo = new UserRepo(client.db("repos"));
