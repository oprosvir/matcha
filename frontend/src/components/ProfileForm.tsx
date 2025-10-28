import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { useUpdateProfile } from "@/hooks/useUserProfile";
import type { User } from "@/types/user";
import { formatDateOfBirth } from "@/utils/dateUtils";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long" })
    .max(50, { message: "First name must be less than 50 characters long" })
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
      message: "First name can contain letters, spaces, hyphens, and apostrophes",
    }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long" })
    .max(50, { message: "Last name must be less than 50 characters long" })
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
      message: "Last name can contain letters, spaces, hyphens, and apostrophes",
    }),
  gender: z.enum(["male", "female"], { message: "Please select a gender" }),
  sexualOrientation: z.enum(["straight", "gay", "bisexual"], { message: "Please select your sexual orientation" }),
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
      gender: data.gender,
      sexualOrientation: data.sexualOrientation,
      biography: data.biography || "",
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="first-name">First Name</FieldLabel>
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
        </Field>

        <Field>
          <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
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
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="date-of-birth">Date of Birth</FieldLabel>
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
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-2 block">Gender</label>
          <select
            {...form.register("gender")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {form.formState.errors.gender && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.gender.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Sexual Orientation</label>
          <select
            {...form.register("sexualOrientation")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select orientation</option>
            <option value="straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="bisexual">Bisexual</option>
          </select>
          {form.formState.errors.sexualOrientation && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.sexualOrientation.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Biography</label>
        <textarea
          {...form.register("biography")}
          placeholder="Tell us about yourself..."
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
