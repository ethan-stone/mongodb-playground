import { User, userRepo } from "./user-repo";
import { Chance } from "chance";

const chance = new Chance();

type Event = {
  body: {
    email: string;
  };
};

type UserDTO = {
  _id: string;
  email: string;
};

class UserDTOMapper {
  /**
   * Converts from user domain type to user dto type
   * @param domainUser the user domain type to convert to user dto type
   * @returns the user dto type
   */
  public static fromDomainToDTO(domainUser: User): UserDTO {
    return {
      _id: domainUser._id,
      email: domainUser.email
    };
  }
}

export const handler = async (event: Event) => {
  const result = await userRepo.insertOne({ email: event.body.email });

  const user = await userRepo.findOne({ _id: result._id });

  if (!user) {
    console.error(
      `User could not be found despite being inserted (ID: ${result._id})`
    );
    return;
  }

  const userDTO = UserDTOMapper.fromDomainToDTO(user);

  return userDTO;
};

async function main() {
  const res = await handler({ body: { email: chance.email() } });
  console.log(res);
}

main();
