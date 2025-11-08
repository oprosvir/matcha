export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

/**
 * Request user's current position using browser Geolocation API
 * Returns a promise that resolves with coordinates or rejects with error
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    const options = {
      enableHighAccuracy: false, // Don't need high accuracy, saves battery
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000, // Accept cached position up to 5 minutes old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: error.message,
        });
      },
      options
    );
  });
};

/**
 * Check if browser supports Geolocation API
 */
export const isGeolocationSupported = (): boolean => {
  return 'geolocation' in navigator;
};

/**
 * Get user-friendly error message based on error code
 */
export const getGeolocationErrorMessage = (error: GeolocationError): string => {
  switch (error.code) {
    case GEOLOCATION_ERRORS.PERMISSION_DENIED:
      return 'Location permission denied. Please enable location access in your browser settings.';
    case GEOLOCATION_ERRORS.POSITION_UNAVAILABLE:
      return 'Location information is unavailable. Please try again.';
    case GEOLOCATION_ERRORS.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'An unknown error occurred while getting your location.';
  }
};
