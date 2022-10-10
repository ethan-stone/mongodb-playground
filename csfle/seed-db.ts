import { loadEnv } from "../helpers/load-env";
import { Chance } from "chance";
import { userRepo, User, UserInsert } from "./user-repo";

loadEnv();

const chance = new Chance();

async function main() {
  const usersArray: UserInsert[] = [];
  for (let i = 0; i < 100; i++) {
    usersArray.push({
      email: chance.email()
    });
  }

  const result = await userRepo.insertMany(usersArray);

  console.log("Result\n-----------");
  console.log(result);
}

main();
