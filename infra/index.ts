import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// SA = Service Account

// Create a GCP resource (Storage Bucket)
const monogdbPlaygroundSA = new gcp.serviceaccount.Account(
  "mongodb-playground-sa",
  {
    accountId: "mongodb-playground",
    displayName: "SA for MongoDB Playground"
  }
);

const mongodbPlaygroundKeyRing = new gcp.kms.KeyRing("mongodb-playground", {
  location: "global"
});

const mongodbCMK = new gcp.kms.CryptoKey("mongodb-cmk", {
  keyRing: mongodbPlaygroundKeyRing.id,
  rotationPeriod: "86400s"
});

new gcp.kms.CryptoKeyIAMBinding(
  "mongodb-playground-sa-mongodb-cmk-iam-binding",
  {
    role: "roles/cloudkms.cryptoKeyEncrypterDecrypter",
    cryptoKeyId: mongodbCMK.id,
    members: [pulumi.interpolate`serviceAccount:${monogdbPlaygroundSA.email}`]
  }
);

export const mongodbPlaygroundKeyRingName = mongodbPlaygroundKeyRing.name;
export const mongodbCMKCryptoKeyName = mongodbCMK.name;
