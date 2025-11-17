import { UserInterestDto } from "../user.dto";

export class UserListItemDto {
  id: string;
  username: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
  age: number;
  fameRating: number;
  cityName: string | null;
  countryName: string | null;
  interests: UserInterestDto[];
}

export class GetUsersResponseDto {
  users: UserListItemDto[];
  nextCursor: string | null;
  hasMore: boolean;
}