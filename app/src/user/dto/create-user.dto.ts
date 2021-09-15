import { UpdateUserDto } from "./update-user.dto";

export class CreateUserDto extends UpdateUserDto {
  username: string;
}
