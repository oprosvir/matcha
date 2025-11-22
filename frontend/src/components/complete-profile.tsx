import type { User } from "@/types/user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useInterests } from "@/hooks/useInterests";
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/shadcn-io/tags";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Separator } from "@/components/ui/separator";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompleteProfile } from "@/hooks/useUserProfile";
import { calculateAge, getMaxDate, formatDateForInput } from "@/utils/dateUtils";
import { LocationSelector } from "./LocationSelector";
import { PhotoManager } from "./PhotoManager";
import { useUserPhotos } from "@/hooks/usePhotos";
import { useState, useEffect } from "react";

const formSchema = z.object({
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (date) => calculateAge(date) >= 18,
      { message: "You must be at least 18 years old" }
  ),
  gender: z.enum(["male", "female"], {
    message: "Gender is required",
  }),
  sexualOrientation: z
    .enum(["straight", "gay", "bisexual"])
    .refine((val) => val !== undefined, {
      message: "Please select who you're interested in",
    }),
  biography: z
    .string()
    .min(5, "Biography must be at least 5 characters")
    .max(500, "Biography must be less than 500 characters"),
  interests: z.array(z.string()).min(1, "At least one interest is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  cityName: z.string().min(1, "Please share your location to see matches nearby"),
  countryName: z.string().min(1, "Please share your location to see matches nearby"),
}).refine(
  (data) => {
    // If cityName and countryName are provided, latitude and longitude must also be provided
    if (data.cityName && data.countryName) {
      return data.latitude !== undefined && data.longitude !== undefined;
    }
    return true;
  },
  {
    message: "Location coordinates are required when city and country are provided",
    path: ["latitude"],
  }
);

type FormData = z.infer<typeof formSchema>;

export function CompleteProfileForm({ user }: { user: User }) {
  const { data: interestsOptions, isLoading, isSuccess } = useInterests();
  const { signOut } = useAuth();
  const { mutate: completeProfile, isPending } = useCompleteProfile();
  const { data: photos = [] } = useUserPhotos();
  const [photoError, setPhotoError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      dateOfBirth: "",
      gender: user.gender ?? undefined,
      sexualOrientation: user.sexualOrientation ?? undefined,
      biography: user.biography ?? "",
      interests: user.interests.map((interest) => interest.id),
      latitude: undefined,
      longitude: undefined,
      cityName: "",
      countryName: "",
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = form;

  // Show photo error immediately when form is submitted
  useEffect(() => {
    if (isSubmitted && photos.length === 0) {
      setPhotoError("You must upload at least one photo before completing your profile");
    } else if (photos.length > 0) {
      setPhotoError(null);
    }
  }, [isSubmitted, photos.length]);
  const selectedInterests = watch("interests");
  const watchedLatitude = watch("latitude");
  const watchedLongitude = watch("longitude");
  const watchedCityName = watch("cityName");
  const watchedCountryName = watch("countryName");

  const handleInterestToggle = (interestId: string) => {
    const currentInterests = selectedInterests || [];
    const isSelected = currentInterests.includes(interestId);

    if (isSelected) {
      setValue(
        "interests",
        currentInterests.filter((id) => id !== interestId),
        { shouldValidate: true }
      );
    } else {
      // Limit to maximum 10 interests
      if (currentInterests.length >= 10) {
        return; // Don't allow selecting more than 10
      }
      setValue("interests", [...currentInterests, interestId], { shouldValidate: true });
    }
  };

  const getSelectedInterests = () => {
    return (
      interestsOptions?.filter((interest) =>
        selectedInterests?.includes(interest.id)
      ) || []
    );
  };

  const onSubmit = async (data: FormData) => {
    if (data.latitude === undefined || data.longitude === undefined) {
      return;
    }

    // Validate that user has uploaded at least one photo
    if (photos.length === 0) {
      setPhotoError("You must upload at least one photo before completing your profile");
      return;
    }

    completeProfile({
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      sexualOrientation: data.sexualOrientation,
      biography: data.biography,
      interestIds: data.interests,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete your profile to start dating!</CardTitle>
        <CardDescription>
          Make sure to fill out all the fields below to complete your profile
          and match with the right people.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>What is your date of birth?</FieldLabel>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <Input
                    type="date"
                    min="1900-01-01"
                    max={formatDateForInput(getMaxDate())}
                    {...field}
                  />
                )}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>What is your gender?</FieldLabel>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.gender.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>Who are you interested in?</FieldLabel>
              <Controller
                name="sexualOrientation"
                control={control}
                render={({ field }) => {
                  const selectedGender = watch("gender");

                  // Determine labels based on selected gender
                  const getOrientationLabel = (value: string) => {
                    if (value === "bisexual") return "Everyone";

                    if (!selectedGender) {
                      // If gender not selected yet
                      return value === "straight" ? "Opposite sex" : "Same sex";
                    }

                    if (selectedGender === "male") {
                      return value === "straight" ? "Women" : "Men";
                    } else {
                      return value === "straight" ? "Men" : "Women";
                    }
                  };

                  return (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Who are you looking for?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight">{getOrientationLabel("straight")}</SelectItem>
                        <SelectItem value="gay">{getOrientationLabel("gay")}</SelectItem>
                        <SelectItem value="bisexual">{getOrientationLabel("bisexual")}</SelectItem>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.sexualOrientation && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.sexualOrientation.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>Who are you?</FieldLabel>
              <Controller
                name="biography"
                control={control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Describe yourself in a few words"
                    {...field}
                  />
                )}
              />
              {errors.biography && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.biography.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>What are your interests?</FieldLabel>
              {isLoading && <Skeleton className="h-10 w-full" />}
              {isSuccess && (
                <>
                  <Tags className="max-w-full">
                    <TagsTrigger>
                      {getSelectedInterests().map((interest) => (
                        <TagsValue
                          key={interest.id}
                          onRemove={() => handleInterestToggle(interest.id)}
                        >
                          {interest.name}
                        </TagsValue>
                      ))}
                    </TagsTrigger>
                    <TagsContent>
                      <TagsInput placeholder="Search interest..." />
                      <TagsList>
                        <TagsEmpty />
                        <TagsGroup>
                          {interestsOptions
                            ?.filter(
                              (interest) =>
                                !selectedInterests?.includes(interest.id)
                            )
                            .map((interest) => (
                              <TagsItem
                                key={interest.id}
                                onSelect={() => handleInterestToggle(interest.id)}
                                value={interest.name}
                                disabled={(selectedInterests?.length || 0) >= 10}
                              >
                                {interest.name}
                              </TagsItem>
                            ))}
                        </TagsGroup>
                      </TagsList>
                    </TagsContent>
                  </Tags>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedInterests?.length || 0} / 10 interests selected
                    {(selectedInterests?.length || 0) >= 10 && " (maximum reached)"}
                  </p>
                </>
              )}
              {errors.interests && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.interests.message}
                </p>
              )}
            </Field>
            <Field>
              <label className="text-sm leading-snug font-semibold">
                Upload your photos
              </label>
              <PhotoManager />
              {photoError && (
                <p className="text-sm text-red-500 mt-1">
                  {photoError}
                </p>
              )}
            </Field>
            <Field>
              <LocationSelector
                showLabel
                onLocationSelect={(location) => {
                  setValue("latitude", location.latitude, { shouldValidate: true });
                  setValue("longitude", location.longitude, { shouldValidate: true });
                  setValue("cityName", location.cityName, { shouldValidate: true });
                  setValue("countryName", location.countryName, { shouldValidate: true });
                }}
                currentLocation={
                  watchedLatitude && watchedLongitude
                    ? {
                        latitude: watchedLatitude,
                        longitude: watchedLongitude,
                        cityName: watchedCityName,
                        countryName: watchedCountryName,
                      }
                    : null
                }
                disabled={isPending}
              />
              {errors.cityName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.cityName.message}
                </p>
              )}
            </Field>
            <Field>
              <Button
                className="mt-4 w-full"
                type="submit"
                disabled={isPending}
              >
                Complete Profile
              </Button>
            </Field>
            <Field>
              <Separator className="my-4 w-full" />
              <Button variant="destructive" onClick={() => signOut()}>
                Sign Out
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export function CompleteProfile({ user }: { user: User }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        <CompleteProfileForm user={user} />
      </div>
    </div>
  );
}
