import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BellIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/types/notification";
import {
  getNotificationDetails,
  getNotificationTitle,
} from "@/lib/getNotificationContent";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { useReadNotifications } from "@/hooks/useReadNotifications";

export function NotificationMenu({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const { readNotifications } = useReadNotifications();

  const handleOpenChange = (open: boolean) => {
    if (open && notificationsUnreadCount > 0) {
      setNotificationsUnreadCount(0);
      readNotifications(
        notifications
          .filter((notification) => !notification.read)
          .map((notification) => notification.id)
      );
    }
  };

  useEffect(() => {
    setNotificationsUnreadCount(
      notifications.filter((notification) => !notification.read).length
    );
  }, [notifications]);

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:!bg-muted hover:!text-foreground">
          <BellIcon className="h-5 w-5" />
          {notificationsUnreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-wild-watermelon text-white">
              {notificationsUnreadCount > 9 ? "9+" : notificationsUnreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length > 0 ? (
          <>
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications
              .sort(
                (a: Notification, b: Notification) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((notification) => (
                <DropdownMenuItem key={notification.id}>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {getNotificationTitle(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getNotificationDetails(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
          </>
        ) : (
          <DropdownMenuItem>
            <p className="text-sm font-medium">No new notifications for now</p>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
