import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useInterests, useUpdateMyInterests } from "@/hooks/useInterests";
import { Skeleton } from "./ui/skeleton";
import type { Interest } from "@/types/user";
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

interface InterestsSelectorProps {
  currentInterests: Interest[];
}

export function InterestsSelector({ currentInterests }: InterestsSelectorProps) {
  const { data: allInterests, isLoading: isLoadingInterests } = useInterests();
  const { mutate: updateInterests, isPending } = useUpdateMyInterests();

  const [selectedIds, setSelectedIds] = useState<string[]>(
    currentInterests.map(interest => interest.id)
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedIds(currentInterests.map(interest => interest.id));
    setHasChanges(false);
  }, [currentInterests]);

  const handleInterestToggle = (interestId: string) => {
    const isSelected = selectedIds.includes(interestId);

    if (isSelected) {
      setSelectedIds(selectedIds.filter(id => id !== interestId));
      setHasChanges(true);
    } else {
      // Limit to maximum 10 interests
      if (selectedIds.length >= 10) {
        return; // Don't allow selecting more than 10
      }
      setSelectedIds([...selectedIds, interestId]);
      setHasChanges(true);
    }
  };

  const getSelectedInterests = () => {
    return (
      allInterests?.filter((interest) =>
        selectedIds.includes(interest.id)
      ) || []
    );
  };

  const handleSave = () => {
    if (selectedIds.length === 0) {
      return;
    }
    updateInterests(selectedIds);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setSelectedIds(currentInterests.map(interest => interest.id));
    setHasChanges(false);
  };

  if (isLoadingInterests) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!allInterests || allInterests.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No interests available.</p>
      </div>
    );
  }

  const maxInterests = 10;
  const isMaxReached = selectedIds.length >= maxInterests;

  return (
    <div className="space-y-4">
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
              {allInterests
                ?.filter(
                  (interest) =>
                    !selectedIds.includes(interest.id)
                )
                .map((interest) => (
                  <TagsItem
                    key={interest.id}
                    onSelect={() => handleInterestToggle(interest.id)}
                    value={interest.name}
                    disabled={isMaxReached}
                  >
                    {interest.name}
                  </TagsItem>
                ))}
            </TagsGroup>
          </TagsList>
        </TagsContent>
      </Tags>

      <p className="text-sm text-muted-foreground">
        {selectedIds.length} / {maxInterests} interests selected
        {isMaxReached && " (maximum reached)"}
      </p>

      {selectedIds.length === 0 && hasChanges && (
        <p className="text-sm text-red-500 mt-1">
          At least one interest is required
        </p>
      )}

      {hasChanges && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || selectedIds.length === 0}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
