import { Binary, UUID } from "bson";
import { Collection, Db, Filter } from "mongodb";
import { ClientEncryption } from "mongodb-client-encryption";
import { assertEnvVar } from "../helpers/load-env";
import { randomUUID } from "crypto";
import { client } from "./mongo-client";

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

type DSUser = {
  _id: UUID;
  email: Binary; // encrypted
};

export type User = {
  _id: string;
  email: string;
};

export type UserInsert = Omit<User, "_id">;

export type UserFilter = Partial<User>;

type DSUserFilter = Filter<DSUser>;

const dataKeyId = new Binary(
  Buffer.from("wVaRu37fSkS4XtelFrT4tg==", "base64"),
  4
);

export class UserRepo {
  private datasource: Collection<DSUser>;

  constructor(db: Db) {
    this.datasource = db.collection<DSUser>("users");
  }

  /**
   * Converts from user domain type to user db type
   * @param user the user domain type to convert to user db type
   * @returns the user db type
   */
  private async fromDomainToDS(user: User) {
    const dbUser: DSUser = {
      _id: new UUID(user._id),
      email: await encryption.encrypt(user.email, {
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
        keyId: dataKeyId
      })
    };

    return dbUser;
  }

  /**
   * Converts from user db type to user domain type
   * @param dbUser the user db type to convert to user domain type
   * @returns the user domain type
   */
  private async fromDSToDomain(dbUser: DSUser) {
    const user: User = {
      _id: dbUser._id.toString(),
      email: await encryption.decrypt(dbUser.email)
    };

    return user;
  }

  /**
   * Converts the domain level filter to a filter compatible with the datasource
   * @param filter the domain level filter
   * @returns the datasource filter
   */
  private async fromDomainFilterToDSFilter(filter: UserFilter) {
    const dsFilter: DSUserFilter = {
      _id: new UUID(filter._id)
    };

    return dsFilter;
  }

  public async insertOne(user: UserInsert) {
    const dsUser = await this.fromDomainToDS({
      _id: randomUUID(),
      ...user
    });

    const result = await this.datasource.insertOne(dsUser);
    if (!result.acknowledged) throw new Error("Failed to insert user");

    return { _id: result.insertedId.toString() };
  }

  public async insertMany(users: Array<UserInsert>) {
    const dsUser: Array<DSUser> = [];
    for (const user of users) {
      dsUser.push(
        await this.fromDomainToDS({
          _id: randomUUID(),
          ...user
        })
      );
    }

    const result = await this.datasource.insertMany(dsUser);

    return {
      acknowledged: result.acknowledged
    };
  }

  public async findOne(filter: UserFilter) {
    const dsUser = await this.datasource.findOne(
      this.fromDomainFilterToDSFilter(filter)
    );

    return dsUser && this.fromDSToDomain(dsUser);
  }
}

export const userRepo = new UserRepo(client.db("csfle"));
