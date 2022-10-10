import { Binary } from "bson";
import { MongoClient } from "mongodb";
import { ClientEncryption } from "mongodb-client-encryption";
import { loadEnv, assertEnvVar } from "../helpers/load-env";
import { Chance } from "chance";

loadEnv();

const dataKeyId = "wVaRu37fSkS4XtelFrT4tg==";

const chance = new Chance();

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

async function time(cb: () => any | Promise<any>, iterations: number) {
  let totalTime = 0;
  for (let i = 0; i < iterations; i++) {
    const start = new Date().getTime();
    await cb();
    const end = new Date().getTime();
    totalTime += end - start;
  }
  return {
    averageTime: totalTime / iterations,
    totalTime
  };
}

async function encrypt() {
  await encryption.encrypt(chance.email(), {
    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
    keyId: new Binary(Buffer.from(dataKeyId, "base64"), 4)
  });
}

async function main() {
  const result = await time(encrypt, 100000);
  console.log(result);
}

main();
