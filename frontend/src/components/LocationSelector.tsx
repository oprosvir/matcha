import { useState } from 'react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { getCurrentPosition, getGeolocationErrorMessage, type GeolocationError } from '../utils/geolocation';
import { userApi } from '@/api/user/user';
import { useUpdateLocation } from '@/hooks/useUpdateLocation';
import { toast } from 'sonner';

interface LocationSelectorProps {
  onLocationSelect?: (location: { latitude: number; longitude: number; cityName: string; countryName: string }) => void;
  currentLocation?: { latitude: number; longitude: number; cityName?: string; countryName?: string } | null;
  disabled?: boolean;
  standalone?: boolean;
  showLabel?: boolean;
}

type LocationStatus = 'idle' | 'loading' | 'resolving' | 'success' | 'error';

export function LocationSelector({
  onLocationSelect,
  currentLocation,
  disabled,
  standalone = false,
  showLabel = false
}: LocationSelectorProps) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<{ cityName: string; countryName: string } | null>(null);

  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation();

  const getButtonText = () => {
    if (status === 'loading') return 'Getting coordinates...';
    if (status === 'resolving') return 'Resolving location...';
    if (isUpdating) return 'Updating...';
    return standalone ? 'Update Location' : 'Share my location';
  };

  const handleGetLocation = async () => {
    setStatus('loading');
    setError(null);
    setResolvedLocation(null);

    try {
      // Step 1: Try to get GPS coordinates
      const position = await getCurrentPosition();

      // Step 2: Resolve city and country from coordinates
      setStatus('resolving');
      const locationData = await userApi.resolveLocationByCoordinates(position.latitude, position.longitude);

      setResolvedLocation(locationData);

      // If standalone mode, update location directly via API
      if (standalone) {
        updateLocation({ latitude: position.latitude, longitude: position.longitude });
      } else if (onLocationSelect) {
        // Otherwise, call the callback for form integration
        onLocationSelect({
          latitude: position.latitude,
          longitude: position.longitude,
          cityName: locationData.cityName,
          countryName: locationData.countryName,
        });
      }

      setStatus('success');
    } catch (gpsError) {
      // GPS failed, try IP-based location as fallback
      console.log('GPS failed, trying IP-based location...');

      try {
        setStatus('resolving');

        // Get user's IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ipAddress = ipData.ip;

        // Get coordinates from IP
        const coordinates = await userApi.resolveLocationByIpAddress(ipAddress);

        // Resolve city and country from coordinates
        const locationData = await userApi.resolveLocationByCoordinates(coordinates.latitude, coordinates.longitude);

        setResolvedLocation(locationData);

        // If standalone mode, update location directly via API
        if (standalone) {
          updateLocation({ latitude: coordinates.latitude, longitude: coordinates.longitude });
        } else if (onLocationSelect) {
          // Otherwise, call the callback for form integration
          onLocationSelect({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            cityName: locationData.cityName,
            countryName: locationData.countryName,
          });
        }

        setStatus('success');
      } catch (ipError) {
        // Both GPS and IP failed
        const geoError = gpsError as GeolocationError;
        const errorMessage = getGeolocationErrorMessage(geoError);
        setError(errorMessage);
        setStatus('error');

        if (standalone) {
          toast.error('Failed to detect location. Please try again or enable location permissions.');
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {showLabel && (
        <div>
          <label className="text-sm leading-snug font-semibold">
            Where are you now?
          </label>
          <p className="text-sm text-gray-500 mb-3 mt-1">
            We'll use your location to find matches around you
          </p>
        </div>
      )}

      {((currentLocation?.cityName && currentLocation?.countryName) || (resolvedLocation?.cityName && resolvedLocation?.countryName)) ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm font-medium text-green-800">
            Current location: {resolvedLocation?.cityName || currentLocation?.cityName}, {resolvedLocation?.countryName || currentLocation?.countryName}
          </p>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleGetLocation}
          disabled={disabled || status === 'loading' || status === 'resolving' || isUpdating}
          className="flex items-center gap-2"
        >
          {(status === 'loading' || status === 'resolving' || isUpdating) && <Spinner className="h-4 w-4" />}
          {getButtonText()}
        </Button>
      </div>

      {status === 'error' && error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm font-medium text-red-800 mb-1">Location Error</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
