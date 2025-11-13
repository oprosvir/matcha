import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Slider } from './ui/slider';
import { ZoomIn } from 'lucide-react';

interface ImageCropModalProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File, cropData: CropData) => void;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropModal({ file, isOpen, onClose, onConfirm }: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Load image from file
  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [file]);

  // Callback when crop area changes
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (!croppedAreaPixels) return;

    const cropData: CropData = {
      x: Math.round(croppedAreaPixels.x),
      y: Math.round(croppedAreaPixels.y),
      width: Math.round(croppedAreaPixels.width),
      height: Math.round(croppedAreaPixels.height),
    };

    onConfirm(file, cropData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 md:gap-4 py-1 md:py-2">
          <p className="text-xs md:text-sm text-muted-foreground">
            Drag to reposition and use the slider to zoom
          </p>

          {/* Cropper container */}
          <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
                restrictPosition={true}
              />
            )}
          </div>

          {/* Zoom control */}
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Zoom</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
