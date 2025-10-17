export const messageMap: Record<string, string> = {
  // Success messages
  "SUCCESS_SIGNED_UP": "Account created successfully 🎉",
  "SUCCESS_SIGNED_IN": "Logged in successfully 🎉",
  "SUCCESS_SIGN_OUT": "Signed out successfully",
  "SUCCESS_PASSWORD_RESET_EMAIL_SENT": "If an account exists with this email, a password reset link has been sent",
  "SUCCESS_PASSWORD_RESET": "Password reset successfully",
  "SUCCESS_VERIFY_EMAIL_SENT": "A verification email has been sent to your email address 📨",
  "SUCCESS_EMAIL_VERIFIED": "Email verified successfully 🎉",

  // Error messages
  "ERROR_INTERNAL_SERVER": "An unexpected internal server error occurred please try again later",
  "ERROR_INVALID_PASSWORD": "Password is not strong enough. Please use a stronger one",
  "ERROR_EMAIL_OR_USERNAME_ALREADY_EXISTS": "Email or username already exists. Please use a different one",
  "ERROR_INVALID_CREDENTIALS": "Your username or password is incorrect. Please try again",
  "ERROR_EMAIL_ALREADY_VERIFIED": "Email already verified. Please sign in"
}

export const getToastMessage = (key: string) => {
  return messageMap[key];
}