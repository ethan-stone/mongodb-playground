import { UUID, Binary } from "bson";
import { MongoClient } from "mongodb";
import {
  ClientEncryption,
  ClientEncryptionOptions
} from "mongodb-client-encryption";
import { assertEnvVar, loadEnv } from "../helpers/load-env";
import { Chance } from "chance";

loadEnv();

const mongurl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const client = new MongoClient(mongurl);

const chance = new Chance();

type User = {
  _id: UUID;
  email: Binary; // email is encrypted thus it should be binary
};

async function main() {
  const db = client.db("csfle");
  const users = db.collection<User>("users");

  const clientEncryptionOptions: ClientEncryptionOptions = {
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
  };

  const encryption = new ClientEncryption(client, clientEncryptionOptions);

  const dataKeyId = "wVaRu37fSkS4XtelFrT4tg==";

  const usersArray: User[] = [];
  for (let i = 0; i < 100; i++) {
    usersArray.push({
      _id: new UUID(),
      email: await encryption.encrypt(chance.email(), {
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
        keyId: new Binary(Buffer.from(dataKeyId, "base64"), 4)
      })
    });
  }

  await users.insertMany(usersArray);

  console.log("Users inserted");
  console.log(usersArray);

  await client.close();
}

main();
