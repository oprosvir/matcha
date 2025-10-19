import { z } from "zod";
import { createApiResponseSchema } from "../schema";

// Add custom validation here?

//===----------------------------------------------------------------------===//
//=== Sign Up
//===----------------------------------------------------------------------===//
export const SignUpRequestSchema = z.object({
  email: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string(),
});
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;

export const SignUpResponseSchema = createApiResponseSchema(z.object({
  accessToken: z.string(),
}));
export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;

//===----------------------------------------------------------------------===//
//=== Sign In
//===----------------------------------------------------------------------===//
export const SignInRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

export const SignInResponseSchema = createApiResponseSchema(z.object({
  accessToken: z.string(),
}));
export type SignInResponse = z.infer<typeof SignInResponseSchema>;

//===----------------------------------------------------------------------===//
//=== Sign Out
//===----------------------------------------------------------------------===//
export const SignOutRequestSchema = z.object({
  refreshToken: z.string(),
});
export type SignOutRequest = z.infer<typeof SignOutRequestSchema>;

// No response needed for sign out

//===----------------------------------------------------------------------===//
//=== Refresh Token
//===----------------------------------------------------------------------===//
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const RefreshTokenResponseSchema = createApiResponseSchema(z.object({
  accessToken: z.string(),
}));
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

//===----------------------------------------------------------------------===//
//=== Send Password Reset Email
//===----------------------------------------------------------------------===//
export const SendPasswordResetEmailRequestSchema = z.object({
  email: z.string(),
});
export type SendPasswordResetEmailRequest = z.infer<typeof SendPasswordResetEmailRequestSchema>;

// No response needed for send password reset email

//===----------------------------------------------------------------------===//
//=== Reset Password
//===----------------------------------------------------------------------===//
export const ResetPasswordRequestSchema = z.object({
  token: z.string(),
  password: z.string(),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// No response needed for reset password

//===----------------------------------------------------------------------===//
//=== Send Verify Email
//===----------------------------------------------------------------------===//

// No request type needed for send verify email

// No response needed for send verify email

//===----------------------------------------------------------------------===//
//=== Verify Email
//===----------------------------------------------------------------------===//
export const VerifyEmailRequestSchema = z.object({
  verifyEmailToken: z.string(),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

// No response needed for verify email