import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Camera, XIcon, Star } from 'lucide-react';
import { useUserPhotos, useUploadPhoto, useDeletePhoto, useSetProfilePicture, type Photo } from '@/hooks/usePhotos';
import { Skeleton } from './ui/skeleton';
import { getPhotoUrl } from '@/utils/photoUtils';
import { toast } from 'sonner';
import { ImageCropModal, type CropData } from './ImageCropModal';

interface PhotoSlotProps {
  photo?: Photo;
  onUpload: (file: File, cropData?: CropData) => void;
  onDelete: () => void;
  onSetProfilePic: () => void;
  isUploading: boolean;
}

function PhotoSlot({ photo, onUpload, onDelete, onSetProfilePic, isUploading }: PhotoSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPEG and PNG files are supported');
      return;
    }

    // Validate image dimensions and aspect ratio
    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(imageUrl); // Clean up memory

        // Check minimum dimensions (200x200)
        const MIN_WIDTH = 200;
        const MIN_HEIGHT = 200;
        if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
          toast.error(`Image must be at least ${MIN_WIDTH}x${MIN_HEIGHT} pixels. Your image is ${img.width}x${img.height}`);
          return;
        }

        // Check aspect ratio (max 3:1 or 1:3)
        const MAX_ASPECT_RATIO = 3;
        const aspectRatio = img.width / img.height;
        if (aspectRatio > MAX_ASPECT_RATIO || aspectRatio < (1 / MAX_ASPECT_RATIO)) {
          toast.error('Image aspect ratio is too extreme. Please use a more standard image proportion');
          return;
        }

        // All validations passed, show crop modal
        setSelectedFile(file);
        setShowCropModal(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        toast.error('Failed to load image. Please try a different file');
      };

      img.src = imageUrl;
    } catch (error) {
      toast.error('Failed to validate image');
    }
  };

  const handleCropConfirm = (file: File, cropData: CropData) => {
    setShowCropModal(false);
    setSelectedFile(null);
    onUpload(file, cropData);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {selectedFile && (
        <ImageCropModal
          file={selectedFile}
          isOpen={showCropModal}
          onClose={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      <div className={`relative w-full aspect-square ${photo || isUploading ? 'pointer-events-none' : ''}`}>
        <div className={`w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center transition-colors relative overflow-hidden ${
          !photo && !isUploading ? 'hover:border-gray-400 cursor-pointer' : ''
        }`}>
          <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={!!photo || isUploading}
          />

          {photo ? (
          <>
            <img
              src={getPhotoUrl(photo.url)}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />

            {/* Star button for profile picture selection */}
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetProfilePic();
              }}
              variant={photo.isProfilePic ? "default" : "secondary"}
              size="icon"
              className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-0 rounded-full w-6 h-6 md:w-8 md:h-8 pointer-events-auto"
            >
              <Star
                size={12}
                className="md:w-4 md:h-4"
                fill={photo.isProfilePic ? "currentColor" : "none"}
              />
            </Button>

            {/* Delete button */}
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              variant="destructive"
              size="icon"
              className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-0 rounded-full w-6 h-6 md:w-8 md:h-8 pointer-events-auto"
            >
              <XIcon size={12} className="md:w-4 md:h-4" />
            </Button>
          </>
        ) : isUploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-4 text-center pointer-events-none">
              <Camera className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                Drag & drop<br className="md:hidden" /> or click
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function PhotoManager() {
  const { data: photos = [], isLoading } = useUserPhotos();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const setProfilePicture = useSetProfilePicture();

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleUpload = async (file: File, cropData?: CropData) => {
    if (photos.length >= 6) {
      toast.error('Maximum 6 photos allowed');
      return;
    }

    try {
      setUploadingIndex(photos.length);
      await uploadPhoto.mutateAsync({ file, cropData });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    // Prevent deleting the last photo
    if (photos.length === 1) {
      toast.error('You must have at least one photo. Please upload a new photo before deleting this one.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this photo?')) {
      await deletePhoto.mutateAsync(photoId);
    }
  };

  const handleSetProfilePic = async (photoId: string) => {
    await setProfilePicture.mutateAsync(photoId);
  };

  // Create array of 6 slots, filling with photos and null for empty slots
  const slots: (Photo | null)[] = [
    ...photos,
    ...Array(Math.max(0, 6 - photos.length)).fill(null)
  ].slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {slots.map((photo, index) => (
          <PhotoSlot
            key={photo?.id || `empty-${index}`}
            photo={photo || undefined}
            onUpload={handleUpload}
            onDelete={() => photo && handleDelete(photo.id)}
            onSetProfilePic={() => photo && handleSetProfilePic(photo.id)}
            isUploading={uploadingIndex === index}
          />
        ))}
      </div>
    </div>
  );
}
