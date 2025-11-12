import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";
import { toast } from "sonner";

/**
 * Hook for uploading photos
 */
export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => userApi.uploadPhotos(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Photos uploaded successfully");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to upload photos";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for deleting a photo
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => userApi.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Photo deleted successfully");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to delete photo";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for setting profile picture
 */
export function useSetProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => userApi.setProfilePicture(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile picture updated successfully");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to set profile picture";
      toast.error(errorMessage);
    },
  });
}
