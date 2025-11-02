import apiClient from "@/lib/apiClient";
import { parseApiResponse } from "../parseResponse";
import { InterestSchema, type Interest } from "@/types/user";
import { createApiResponseSchema } from "../schema";
import { getToastMessage } from "@/lib/messageMap";
import { z } from "zod";

const FindAllResponseSchema = z.object({ interests: z.array(InterestSchema) });

export const interestApi = {
  findAll: async (): Promise<Interest[]> => {
    const response = await parseApiResponse(apiClient.get('/interests/all'), createApiResponseSchema(FindAllResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.interests;
  },

  updateMyInterests: async (interestIds: string[]): Promise<void> => {
    const response = await parseApiResponse(
      apiClient.put('/interests/me', { interestIds }),
      createApiResponseSchema(z.void())
    );
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data;
  },
};