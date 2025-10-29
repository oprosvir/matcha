import { useMutation } from "@tanstack/react-query";
import { notificationApi } from "@/api/notification/notification";

export function useReadNotifications() {
  const { mutate: readNotifications, isPending, isError, isSuccess } = useMutation({
    mutationFn: notificationApi.readNotifications,
  });

  return {
    readNotifications,
    isPending,
    isError,
    isSuccess,
  };
}