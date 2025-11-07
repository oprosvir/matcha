import { IsArray, IsNumber, IsOptional, IsString, Min, Max, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { Type, Transform } from "class-transformer";
import { z } from "zod";

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortByAge {
  sortBy: 'age';
  sortOrder: SortOrder;
}

export interface SortByFameRating {
  sortBy: 'fameRating';
  sortOrder: SortOrder;
}

export interface SortByInterests {
  sortBy: 'interests';
  sortOrder: SortOrder;
}

export type Sort = SortByAge | SortByFameRating | SortByInterests;

export class GetUsersRequestDto {
  @IsOptional()
  @IsString({ message: 'Cursor must be a string' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Min age must be a number' })
  @Min(18, { message: 'Min age must be at least 18' })
  @Max(99, { message: 'Min age must be at most 99' })
  minAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Max age must be a number' })
  @Min(18, { message: 'Max age must be at least 18' })
  @Max(99, { message: 'Max age must be at most 99' })
  maxAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Min fame must be a number' })
  @Min(0, { message: 'Min fame must be at least 0' })
  @Max(100, { message: 'Min fame must be at most 100' })
  minFame?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Max fame must be a number' })
  @Min(0, { message: 'Max fame must be at least 0' })
  @Max(100, { message: 'Max fame must be at most 100' })
  maxFame?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return value;
  })
  @IsArray({ message: 'Cities must be an array' })
  @IsString({ each: true, message: 'Each city must be a string' })
  cities?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return value;
  })
  @IsArray({ message: 'Countries must be an array' })
  @IsString({ each: true, message: 'Each country must be a string' })
  countries?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return value;
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'First name must be at least 1 character long' })
  @MaxLength(50, { message: 'First name must be at most 50 characters long' })
  firstName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  sort?: Sort;
}
