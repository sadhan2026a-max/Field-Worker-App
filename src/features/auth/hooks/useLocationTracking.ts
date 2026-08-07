import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { updateLocation } from '../api/authService';

export function useLocationTracking() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          console.warn('Location permission denied');
          return;
        }

        // Send the initial location right away
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        if (initialLocation) {
          updateLocation(initialLocation.coords.latitude, initialLocation.coords.longitude);
        }

        // Start watching for location changes (foreground)
        // Adjust distanceInterval (meters) or timeInterval (ms) based on desired frequency
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 20000,  // Or at least every 20 seconds
          },
          (location) => {
            updateLocation(location.coords.latitude, location.coords.longitude);
          }
        );
      } catch (error) {
        console.warn('Error starting location tracking:', error);
      }
    })();

    // Cleanup when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return { errorMsg };
}
