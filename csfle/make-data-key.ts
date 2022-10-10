import { MongoClient } from "mongodb";
import {
  ClientEncryption,
  ClientEncryptionCreateDataKeyProviderOptions,
  ClientEncryptionOptions
} from "mongodb-client-encryption";
import { loadEnv, assertEnvVar } from "../helpers/load-env";

loadEnv();

const mongourl = assertEnvVar(process.env.DATABASE_URL, "Missing DATABASE_URL");
const client = new MongoClient(mongourl);

async function main() {
  const keyVaultDatabase = "encryption";
  const keyVaultCollection = "__keyVault";
  const keyVaultNamespace = `${keyVaultDatabase}.${keyVaultCollection}`;

  const keyVaultDB = client.db(keyVaultDatabase);

  // Drop the Key Vault Collection in case you created this collection
  // in a previous run of this application.
  await keyVaultDB.dropDatabase();
  // Drop the database storing your encrypted fields as all
  // the DEKs encrypting those fields were deleted in the preceding line.
  await client.db("medicalRecords").dropDatabase();
  const keyVaultColl = keyVaultDB.collection(keyVaultCollection);
  await keyVaultColl.createIndex(
    { keyAltNames: 1 },
    {
      unique: true,
      partialFilterExpression: { keyAltNames: { $exists: true } }
    }
  );

  const provider = "gcp";

  const clientEncryptionOptions: ClientEncryptionOptions = {
    keyVaultNamespace,
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

  const createDataKeyOptions: ClientEncryptionCreateDataKeyProviderOptions = {
    masterKey: {
      projectId: assertEnvVar(
        process.env.GCP_PROJECT_ID,
        "Missing gcp project ID"
      ),
      location: "global",
      keyRing: assertEnvVar(
        process.env.GCP_KEY_RING_NAME,
        "Missing GCP_KEY_RING_NAME"
      ),
      keyName: assertEnvVar(
        process.env.GCP_CRYPTO_KEY_NAME,
        "Missing GCP_CRYPTO_KEY_NAME"
      )
    }
  };

  const key = await encryption.createDataKey(provider, createDataKeyOptions);

  console.log("DataKeyId [base64]: ", key.toString("base64"));

  await client.close();
}

main();
