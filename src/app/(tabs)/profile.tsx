import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, palette, FontSize, FontFamily } from '@/core/theme';
import { logoutThunk, selectDriver } from '@/features/auth/redux/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const driver = useAppSelector(selectDriver);
  const logout = () => dispatch(logoutThunk());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.content}>
        <MaterialIcons 
          name="account-circle" 
          size={84} 
          color={colors.primary} 
          style={styles.placeholderIcon} 
        />
        
        {driver ? (
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverPhone}>{driver.phone}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.statusBadge}>{driver.status}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.comingSoonText}>Profile details not found.</Text>
        )}
        
        <View style={styles.spacer} />

        {/* Logout Section */}
        <Button 
          label="Log Out" 
          variant="outline" 
          onPress={logout} 
          style={styles.logoutBtn}
          textStyle={styles.logoutLabel}
          icon={<MaterialIcons name="exit-to-app" size={18} color={palette.red} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  placeholderIcon: {
    marginBottom: spacing.sm,
  },
  driverInfo: {
    alignItems: 'center',
    width: '100%',
  },
  driverName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  driverPhone: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  badgeContainer: {
    backgroundColor: palette.blueLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  statusBadge: {
    ...typography.caption,
    color: palette.blue,
    fontWeight: 'bold',
  },
  comingSoonText: {
    ...typography.bodyMedium,
    fontSize: FontSize.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  logoutBtn: {
    borderColor: palette.red,
    width: '100%',
    marginTop: spacing.xl,
  },
  logoutLabel: {
    color: palette.red,
  },
});
