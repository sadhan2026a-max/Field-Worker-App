import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { radius, colors, useTheme } from '@/core/theme';

import { Coordinates } from '@/domain/entities/Assignment';

interface RouteMapPreviewProps {
  origin: Coordinates | null;
  destination: Coordinates;
  height?: number;
}

export function RouteMapPreview({ origin, destination, height = 260 }: RouteMapPreviewProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  if (!origin) {
    // Fallback: If current location is loading or unavailable, center on destination
    return (
      <MapView
        style={[styles.map, { height }]}
        initialRegion={{
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        <Marker coordinate={destination} title="Customer" pinColor={colors.danger} />
      </MapView>
    );
  }

  const midLat = (origin.latitude + destination.latitude) / 2;
  const midLng = (origin.longitude + destination.longitude) / 2;
  const latDelta = Math.max(Math.abs(origin.latitude - destination.latitude) * 1.8, 0.01);
  const lngDelta = Math.max(Math.abs(origin.longitude - destination.longitude) * 1.8, 0.01);

  return (
    <MapView
      style={[styles.map, { height }]}
      initialRegion={{
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      }}
    >
      <Marker coordinate={origin} title="You" pinColor={colors.info} />
      <Marker coordinate={destination} title="Customer" pinColor={colors.danger} />
      <Polyline coordinates={[origin, destination]} strokeColor={colors.info} strokeWidth={4} />
    </MapView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  map: {
    width: '100%',
    borderRadius: radius.lg,
  },
});
