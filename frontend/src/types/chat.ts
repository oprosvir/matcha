import { z } from "zod";
import { ProfilePreviewSchema } from "./user";

export const MessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  content: z.string(),
  read: z.boolean().optional().default(false),
  createdAt: z.string().transform((str) => new Date(str)),
});
export type Message = z.infer<typeof MessageSchema>;

export const MessagesSchema = z.array(MessageSchema);
export type Messages = z.infer<typeof MessagesSchema>;

export const ConversationSchema = z.object({
  chatId: z.string(),
  profilePreview: ProfilePreviewSchema,
  createdAt: z.string().transform((str) => new Date(str)),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationsSchema = z.array(ConversationSchema);
export type Conversations = z.infer<typeof ConversationsSchema>;
