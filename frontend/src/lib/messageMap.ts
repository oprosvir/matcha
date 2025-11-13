export const messageMap: Record<string, string> = {
  // Success messages
  "SUCCESS_SIGNED_UP": "Account created successfully 🎉",
  "SUCCESS_SIGNED_IN": "Logged in successfully 🎉",
  "SUCCESS_SIGN_OUT": "Signed out successfully",
  "SUCCESS_PASSWORD_RESET_EMAIL_SENT": "If an account exists with this email, a password reset link has been sent",
  "SUCCESS_PASSWORD_RESET": "Password reset successfully",
  "SUCCESS_VERIFY_EMAIL_SENT": "A verification email has been sent to your email address 📨",
  "SUCCESS_EMAIL_VERIFIED": "Email verified successfully 🎉",
  "SUCCESS_PROFILE_COMPLETED": "Profile completed successfully! 🎉",
  "SUCCESS_PROFILE_UPDATED": "Profile updated successfully ✨",
  "SUCCESS_LOCATION_UPDATED": "Location updated successfully 📍",
  "SUCCESS_UPDATE_USER_INTERESTS": "Interests updated successfully ✨",
  "SUCCESS_PHOTOS_UPLOADED": "Photos uploaded successfully 📸",
  "SUCCESS_PHOTOS_RETRIEVED": "Photos loaded successfully",
  "SUCCESS_PHOTO_DELETED": "Photo deleted successfully",
  "SUCCESS_PROFILE_PICTURE_SET": "Profile picture updated successfully ✨",

  // Error messages
  "ERROR_INTERNAL_SERVER": "An unexpected internal server error occurred please try again later",
  "ERROR_INVALID_PASSWORD": "Password is not strong enough. Please use a stronger one",
  "ERROR_EMAIL_OR_USERNAME_ALREADY_EXISTS": "Email or username already exists. Please use a different one",
  "ERROR_EMAIL_ALREADY_EXISTS": "This email is already in use by another account. Please use a different email address",
  "ERROR_INVALID_CREDENTIALS": "Your username or password is incorrect. Please try again",
  "ERROR_EMAIL_ALREADY_VERIFIED": "Email already verified. Please sign in",
  "ERROR_INVALID_OR_EXPIRED_RESET_TOKEN": "Invalid or expired reset password link. Please request a new one.",
  "ERROR_USER_NOT_FOUND": "User not found",
  "ERROR_NO_UPDATE_FIELDS": "No fields provided for update.",
  "ERROR_VALIDATION_FAILED": "The data you provided is invalid. Please check your inputs and try again.",
  "ERROR_INVALID_INTEREST_IDS": "One or more interest IDs are invalid.",
  "ERROR_NO_PHOTOS": "You must upload at least one photo before completing your profile",
  "ERROR_NO_PROFILE_PICTURE": "You must select a profile picture",
  "ERROR_NO_FILES": "No files provided. Please select at least one photo to upload",
  "ERROR_MAX_PHOTOS_EXCEEDED": "You can upload a maximum of 6 photos. Please delete some photos before uploading new ones",
  "ERROR_FILE_TOO_LARGE": "File size exceeds the maximum limit of 5MB. Please choose a smaller image",
  "ERROR_INVALID_FILE_TYPE": "Invalid file type. Only JPEG and PNG images are allowed",
  "ERROR_MIME_MISMATCH": "File format mismatch detected. The file appears to be corrupted or not a valid image",
  "ERROR_INVALID_IMAGE": "Invalid or corrupted image file. Please upload a valid JPEG or PNG image",
  "ERROR_PHOTO_UPLOAD_FAILED": "Photo upload failed. Please try again later",
  "ERROR_PHOTO_NOT_FOUND": "Photo not found. It may have been already deleted",
  "PROFILE_PIC_ALREADY_EXISTS": "A profile picture is already set for this user",
  "ERROR_IMAGE_TOO_SMALL": "Image is too small. Minimum dimensions are 200x200 pixels",
  "ERROR_INVALID_ASPECT_RATIO": "Image aspect ratio is too extreme. Please use a more standard image proportion",
  "ERROR_CANNOT_DELETE_LAST_PHOTO": "You must have at least one photo. Please upload a new photo before deleting this one",
  "ERROR_UNKNOWN": "An unknown error occurred. Please try again.",
}

export const getToastMessage = (key: string, errorDetails?: string) => {
  if (key === 'ERROR_VALIDATION_FAILED' && errorDetails) {
    return errorDetails;
  }
  return messageMap[key] || messageMap['ERROR_UNKNOWN'];
}