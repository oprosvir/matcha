import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import validator from "validator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useUpdateProfile } from "@/hooks/useUserProfile";
import type { User } from "@/types/user";
import { formatDateOfBirth } from "@/utils/dateUtils";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long" })
    .max(50, { message: "First name must be less than 50 characters long" })
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
      message:
        "First name can contain letters, spaces, hyphens, and apostrophes",
    }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long" })
    .max(50, { message: "Last name must be less than 50 characters long" })
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
      message:
        "Last name can contain letters, spaces, hyphens, and apostrophes",
    }),
  email: z
    .string()
    .min(5, { message: "Email must be at least 5 characters long" })
    .max(100, { message: "Email must be less than 100 characters long" })
    .refine((val) => validator.isEmail(val), { message: "Invalid email address" }),
  gender: z.enum(["male", "female"], { message: "Please select a gender" }),
  sexualOrientation: z.enum(["straight", "gay", "bisexual"], {
    message: "Please select your sexual orientation",
  }),
  biography: z
    .string()
    .min(5, "Biography must be at least 5 characters")
    .max(500, "Biography must be less than 500 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender ?? undefined,
      sexualOrientation: user.sexualOrientation ?? undefined,
      biography: user.biography ?? "",
    },
  });

  const { isDirty } = form.formState;

  const onSubmit = form.handleSubmit((data: ProfileFormData) => {
    updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      gender: data.gender,
      sexualOrientation: data.sexualOrientation,
      biography: data.biography || "",
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="first-name" className="text-sm font-medium mb-2 block">First Name</label>
          <Input
            id="first-name"
            type="text"
            placeholder="John"
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="last-name" className="text-sm font-medium mb-2 block">Last Name</label>
          <Input
            id="last-name"
            type="text"
            placeholder="Doe"
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium mb-2 block">Email</label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
        {form.watch("email") !== user.email && (
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 1 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            Changing your email will require re-verification
          </p>
        )}
      </div>

      <div>
        <label htmlFor="date-of-birth" className="text-sm font-medium mb-2 block">Date of Birth</label>
        <Input
          id="date-of-birth"
          type="text"
          value={user.dateOfBirth ? formatDateOfBirth(user.dateOfBirth) : "Not specified"}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Date of birth cannot be changed
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-2 block">Gender</label>
          <Select
            value={form.watch("gender") || ""}
            onValueChange={(value) => form.setValue("gender", value as "male" | "female", { shouldDirty: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.gender && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.gender.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Sexual Orientation
          </label>
          <Select
            value={form.watch("sexualOrientation") || ""}
            onValueChange={(value) => form.setValue("sexualOrientation", value as "straight" | "gay" | "bisexual", { shouldDirty: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="straight">Straight</SelectItem>
              <SelectItem value="gay">Gay</SelectItem>
              <SelectItem value="bisexual">Bisexual</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.sexualOrientation && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.sexualOrientation.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Biography</label>
        <Textarea
          {...form.register("biography")}
          placeholder="Tell us about yourself..."
          rows={4}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground mt-1">
          {form.watch("biography")?.length || 0}/500 characters
        </p>
        {form.formState.errors.biography && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.biography.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => form.reset()}
          disabled={isPending || !isDirty}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
