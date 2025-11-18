import { PublicUserDto } from '../user.dto';

export class ConnectionStatusDto {
  youLikedThem: boolean;
  theyLikedYou: boolean;
  isConnected: boolean;
  youBlockedThem: boolean;
}

export class GetPublicProfileResponseDto {
  user: PublicUserDto;
  connectionStatus: ConnectionStatusDto;
  isOnline: boolean;
}
