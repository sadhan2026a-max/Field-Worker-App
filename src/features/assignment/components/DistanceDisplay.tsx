import React, { useEffect, useState } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import * as Location from 'expo-location';
import { Coordinates } from '@/domain/entities/Assignment';
import { calculateDistanceKm } from '@/shared/utils/location';

interface DistanceDisplayProps {
  currentLocation: Coordinates | null;
  targetLocation: Coordinates | null;
  targetAddress: string;
  backendDistanceKm?: number;
  style?: StyleProp<TextStyle>;
}

export function DistanceDisplay({
  currentLocation,
  targetLocation,
  targetAddress,
  backendDistanceKm,
  style,
}: DistanceDisplayProps) {
  const [distance, setDistance] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(true);
  const [debugMsg, setDebugMsg] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const resolveDistance = async () => {
      if (backendDistanceKm && backendDistanceKm > 0) {
        if (isMounted) {
          setDistance(backendDistanceKm);
          setIsCalculating(false);
        }
        return;
      }

      if (!currentLocation || (currentLocation.latitude === 0 && currentLocation.longitude === 0)) {
        if (isMounted) {
          setDebugMsg('No GPS');
          setIsCalculating(false);
        }
        return;
      }

      let finalTarget = targetLocation;

      if ((!finalTarget || (finalTarget.latitude === 0 && finalTarget.longitude === 0)) && targetAddress) {
        try {
          const results = await Location.geocodeAsync(targetAddress);
          if (results && results.length > 0) {
            finalTarget = {
              latitude: results[0].latitude,
              longitude: results[0].longitude,
            };
          } else {
            if (isMounted) setDebugMsg('Distance unavailable');
          }
        } catch (e) {
          if (isMounted) setDebugMsg('Distance unavailable');
        }
      }

      // Calculate final distance
      if (finalTarget && (finalTarget.latitude !== 0 || finalTarget.longitude !== 0)) {
        const d = calculateDistanceKm(currentLocation, finalTarget);
        if (isMounted) setDistance(d);
      } else {
        if (isMounted) setDistance(0);
      }

      if (isMounted) setIsCalculating(false);
    };

    resolveDistance();

    return () => {
      isMounted = false;
    };
  }, [currentLocation, targetLocation, targetAddress, backendDistanceKm]);

  if (isCalculating) {
    return <Text style={style}>Calculating...</Text>;
  }

  if (distance === 0 && debugMsg) {
    return <Text style={style}>{debugMsg}</Text>;
  }

  return <Text style={style}>{distance > 0 ? distance : 0} km away</Text>;
}
