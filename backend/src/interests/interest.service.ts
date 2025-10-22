import { Injectable } from "@nestjs/common";
import { Interest, InterestRepository } from "./repository/interest.repository";

@Injectable()
export class InterestService {
  constructor(private readonly interestRepository: InterestRepository) { }

  async findAll(): Promise<Interest[]> {
    return await this.interestRepository.findAll();
  }
}