import { Platform } from 'react-native';
import { Coordinates } from '@/domain/entities/Assignment';

export function externalMapsUrl(destination: Coordinates, label: string, address?: string): string {
  const isMissingCoordinates = destination.latitude === 0 && destination.longitude === 0;
  const query = isMissingCoordinates && address ? encodeURIComponent(address) : `${destination.latitude},${destination.longitude}`;

  if (Platform.OS === 'ios') {
    return `maps://?daddr=${query}&q=${encodeURIComponent(label)}`;
  }
  if (Platform.OS === 'android') {
    return `google.navigation:q=${query}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
