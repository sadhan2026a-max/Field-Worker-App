import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { RouteMapPreview } from '@/components/map/RouteMapPreview';
import { colors, spacing, typography, FontSize } from '@/core/theme';
import { externalMapsUrl } from '@/core/utils/maps';
import { Coordinates } from '@/domain/entities/Assignment';
import { useAssignment, useStartAssignment } from '@/hooks/useAssignments';

export function NavigateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);
  const startAssignment = useStartAssignment();
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  if (isLoading || !assignment) {
    return <ScreenLoader />;
  }

  const destination = assignment.customer.location;

  const onArrived = async () => {
    if (assignment.status === 'pending') {
      await startAssignment.mutateAsync(assignment.id);
    }
    router.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } });
  };

  const onOpenExternalMap = () => {
    Linking.openURL(externalMapsUrl(destination, assignment.customer.name));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `Deliver Order ${assignment.code}` }} />
      <View style={styles.mapContainer}>
        <RouteMapPreview origin={currentLocation} destination={destination} />
      </View>
      <ScreenFooter style={styles.footer}>
        <Card style={styles.addressCard}>
          <View style={styles.pinContainer}>
            <MaterialIcons name="place" size={24} color={colors.primary} />
          </View>
          <View style={styles.addressContent}>
            <Text style={styles.customerName}>{assignment.customer.name}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {assignment.customer.address}
            </Text>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>DISTANCE</Text>
                <Text style={styles.metaValue}>{assignment.distanceKm} km</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>COLLECT</Text>
                <Text style={styles.metaValue}>₹{(assignment.codAmount ?? 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </Card>
        <Button
          label="Open in Google Maps"
          variant="outline"
          onPress={onOpenExternalMap}
          icon={<MaterialIcons name="map" size={18} color={colors.primary} />}
          style={styles.navigateWithCard}
          textStyle={styles.navigateWithText}
        />
        <Button label="Arrived at Location" onPress={onArrived} />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  addressCard: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  pinContainer: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  addressContent: {
    flex: 1,
    gap: spacing.xs,
  },
  customerName: {
    ...typography.h3,
  },
  addressText: {
    ...typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  metaValue: {
    ...typography.h2,
  },
  metaLabel: {
    ...typography.caption,
  },
  navigateWithCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navigateWithText: {
    ...typography.bodyMedium,
    fontSize: FontSize.regular,
  },
});
