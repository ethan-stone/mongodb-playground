import { userRepo, User } from "./user-repo";

type Event = {
  body: {
    id: string;
  };
};

type UserDTO = {
  _id: string;
};

class UserDTOMapper {
  /**
   * Converts from user domain type to user dto type
   * @param domainUser the user domain type to convert to user dto type
   * @returns the user dto type
   */
  public static fromDomainToDTO(domainUser: User) {
    return {
      _id: domainUser._id
    };
  }
}

export const handler = async (event: Event): Promise<UserDTO> => {
  const user = await userRepo.findOne({ _id: event.body.id });
  if (!user) throw new Error("User not found");
  const userDTO = UserDTOMapper.fromDomainToDTO(user);
  return userDTO;
};
