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
import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Button } from "./ui/button";
import { Camera, XIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCompleteProfile } from "@/hooks/useUserProfile";
import { useUploadPhotos } from "@/hooks/usePhotos";
import { calculateAge, getMaxDate, formatDateForInput } from "@/utils/dateUtils";
import { LocationSelector } from "./LocationSelector";

const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, "File must be less than 5 MB")
  .refine(
    (file) => ["image/jpeg", "image/png"].includes(file.type),
    "Unsupported file format"
  );

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
      message: "Sexual orientation is required",
    }),
  biography: z
    .string()
    .min(5, "Biography must be at least 5 characters")
    .max(500, "Biography must be less than 500 characters"),
  interests: z.array(z.string()).min(1, "At least one interest is required"),
  photos: z.array(fileSchema).min(1, "At least one photo is required").max(6, "Maximum 6 photos allowed"),
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

function FileInputWithCamera({
  onChange,
  onRemove,
}: {
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange?.(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemove = () => {
    onChange?.(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  return (
    <div className="relative w-full">
      <div className="w-full h-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors relative overflow-hidden cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleRemove();
              }}
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 z-20 rounded-full"
            >
              <XIcon size={12} />
            </Button>
          </>
        ) : (
          <Camera className="w-6 h-6 text-gray-400" />
        )}
      </div>
    </div>
  );
}

function PhotoUploadGrid({
  onPhotoChange,
}: {
  onPhotoChange: (index: number, file: File | null) => void;
}) {
  const handlePhotoChange = (index: number) => (file: File | null) => {
    onPhotoChange(index, file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex-1">
            <FileInputWithCamera onChange={handlePhotoChange(index)} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[3, 4, 5].map((index) => (
          <div key={index} className="flex-1">
            <FileInputWithCamera onChange={handlePhotoChange(index)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompleteProfileForm({ user }: { user: User }) {
  const { data: interestsOptions, isLoading, isSuccess } = useInterests();
  const { signOut } = useAuth();
  const { mutate: completeProfile, isPending } = useCompleteProfile();

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
      photos: [], // TODO: Once photos hosting is implemented, handle photos already uploaded by the user here if any
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
    formState: { errors },
  } = form;
  const selectedInterests = watch("interests");

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

  const uploadPhotos = useUploadPhotos();

  const onSubmit = async (data: FormData) => {
    if (data.latitude === undefined || data.longitude === undefined) {
      return;
    }

    if (!data.photos || data.photos.length === 0) {
      return;
    }

    try {
      // First, upload photos
      await uploadPhotos.mutateAsync(data.photos);

      // Then, complete profile (photos are already uploaded)
      completeProfile({
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        sexualOrientation: data.sexualOrientation,
        biography: data.biography,
        interestIds: data.interests,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } catch (error) {
      // Error is handled by uploadPhotos hook (shows toast)
      console.error("Failed to upload photos:", error);
    }
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
              <FieldLabel>What is your sexual orientation?</FieldLabel>
              <Controller
                name="sexualOrientation"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your sexual orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight">Straight</SelectItem>
                      <SelectItem value="gay">Gay</SelectItem>
                      <SelectItem value="bisexual">Bisexual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                                value={interest.id}
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
              <FieldLabel>Upload up to 6 pictures of yourself</FieldLabel>
              <Controller
                name="photos"
                control={control}
                render={({ field }) => (
                  <PhotoUploadGrid
                    onPhotoChange={(index, file) => {
                      const currentPhotos = field.value || [];
                      if (file) {
                        const newPhotos = [...currentPhotos];
                        newPhotos[index] = file;
                        field.onChange(newPhotos);
                      } else {
                        const newPhotos = currentPhotos.filter(
                          (_, photoIndex) => photoIndex !== index
                        );
                        field.onChange(newPhotos);
                      }
                    }}
                  />
                )}
              />
              {errors.photos && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.photos.message}
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
                  watch("latitude") && watch("longitude")
                    ? {
                        latitude: watch("latitude")!,
                        longitude: watch("longitude")!,
                        cityName: watch("cityName"),
                        countryName: watch("countryName"),
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
