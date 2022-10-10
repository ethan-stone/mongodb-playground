import { UUID, Binary } from "bson";
import { MongoClient } from "mongodb";
import {
  ClientEncryption,
  ClientEncryptionOptions
} from "mongodb-client-encryption";
import { assertEnvVar, loadEnv } from "../helpers/load-env";

loadEnv();

const mongurl = assertEnvVar(process.env.DATABASE_URL, "Missing mongo url");

const client = new MongoClient(mongurl);

type User = {
  _id: UUID;
  email: Binary; // email is encrypted thus it should be binary
};

type DecryptedUser = {
  _id: UUID;
  email: string;
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

  const cursor = users.find({}, { skip: 0, limit: 100 });

  const usersArray = await cursor.toArray();

  console.log("Encrypted users");
  console.log(usersArray);

  const decryptedUsers: DecryptedUser[] = [];
  for (const user of usersArray) {
    decryptedUsers.push({
      _id: user._id,
      email: await encryption.decrypt(user.email)
    });
  }

  console.log("Decrypted users");
  console.log(decryptedUsers);

  await client.close();
}

main();
