import { Binary, UUID } from "bson";
import { Collection, Db, Filter } from "mongodb";
import { ClientEncryption } from "mongodb-client-encryption";
import { assertEnvVar } from "../helpers/load-env";
import { randomUUID } from "crypto";
import { client } from "./playground-sdk";

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

type DbUser = {
  _id: UUID;
  email: Binary; // encrypted
};

export type User = {
  _id: string;
  email: string;
};

export type UserInsert = Omit<User, "_id">;

export type UserFilter = Partial<User>;

type DbUserFilter = Filter<DbUser>;

const dataKeyId = "wVaRu37fSkS4XtelFrT4tg==";

export class UserRepo {
  private datasource: Collection<DbUser>;

  constructor(db: Db) {
    this.datasource = db.collection<DbUser>("users");
  }

  /**
   * Converts from user domain type to user db type
   * @param user the user domain type to convert to user db type
   * @returns the user db type
   */
  private async fromDomainToDb(user: User) {
    const dbUser: DbUser = {
      _id: new UUID(user._id),
      email: await encryption.encrypt(user.email, {
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
        keyId: new Binary(Buffer.from(dataKeyId, "base64"), 4)
      })
    };

    return dbUser;
  }

  /**
   * Converts from user db type to user domain type
   * @param dbUser the user db type to convert to user domain type
   * @returns the user domain type
   */
  private async fromDbToDomain(dbUser: DbUser) {
    const user: User = {
      _id: dbUser._id.toString(),
      email: await encryption.decrypt(dbUser.email)
    };

    return user;
  }

  public async insertOne(user: UserInsert) {
    const dbUser = await this.fromDomainToDb({ _id: randomUUID(), ...user });
    const result = await this.datasource.insertOne(dbUser);
    if (!result.acknowledged) throw new Error("Operation was not acknowledged");
    return { _id: result.insertedId };
  }

  public async insertMany(users: Array<UserInsert>) {
    const dbUsers: Array<DbUser> = [];
    for (const user of users) {
      dbUsers.push(
        await this.fromDomainToDb({
          _id: randomUUID(),
          ...user
        })
      );
    }

    const result = await this.datasource.insertMany(dbUsers);

    return {
      acknowledged: result.acknowledged
    };
  }

  public async findOne(filter: UserFilter) {
    const dbFilter: DbUserFilter = {
      _id: new UUID(filter._id)
    };

    const dbUser = await this.datasource.findOne(dbFilter);

    return dbUser && this.fromDbToDomain(dbUser);
  }
}
