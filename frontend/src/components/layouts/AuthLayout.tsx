import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import illustration from "@/assets/illustration.png";
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className={cn("flex flex-col gap-6")}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <Outlet />
              <div className="bg-muted relative hidden md:block">
                <img
                  src={illustration}
                  alt="Image"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
