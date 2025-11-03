import { Injectable } from "@nestjs/common";
import { InterestRepository } from "./repository/interest.repository";
import { FindAllResponseDto } from "./dto/find-all/find-all-response.dto";

@Injectable()
export class InterestService {
  constructor(private readonly interestRepository: InterestRepository) { }

  async findAll(): Promise<FindAllResponseDto> {
    return await this.interestRepository.findAll();
  }

  async updateUserInterests(userId: string, interestIds: string[]): Promise<void> {
    return await this.interestRepository.updateUserInterests(userId, interestIds);
  }
}