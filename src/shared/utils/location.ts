import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '@/domain/entities/Assignment';

export function useCurrentLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.warn('Failed to get location', e);
      }
    })();
  }, []);

  return location;
}

export function calculateDistanceKm(loc1: Coordinates | null, loc2: Coordinates | null): number {
  if (!loc1 || !loc2) return 0;
  if (loc2.latitude === 0 && loc2.longitude === 0) return 0;

  const R = 6371; // Radius of the earth in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Number((R * c).toFixed(1));
}
