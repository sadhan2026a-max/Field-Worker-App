import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Assignment } from '@/features/assignment/types/Assignment';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/core/theme';
import { useCurrentLocation } from '@/shared/utils/location';
import { DistanceDisplay } from '@/features/assignment/components/DistanceDisplay';

interface BookingCardProps {
  assignment: Assignment;
}

export function BookingCard({ assignment }: BookingCardProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, isDark), [colors, isDark]);
  const currentLocation = useCurrentLocation();

  const [showItemsModal, setShowItemsModal] = useState(false);

  // 1. Order / Booking ID
  const orderId = assignment.code && assignment.code !== 'N/A' ? assignment.code : assignment.id || 'N/A';

  // 2. Date Formatting (DD/MM/YY)
  const formattedDate = (() => {
    if (!assignment.createdAt) return 'N/A';
    try {
      const d = new Date(assignment.createdAt);
      if (isNaN(d.getTime())) return 'N/A';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  })();

  // 3. Order Time (Single time, e.g. 05:24 PM)
  const orderTime = (() => {
    if (!assignment.createdAt) return 'N/A';
    try {
      const d = new Date(assignment.createdAt);
      if (isNaN(d.getTime())) return 'N/A';

      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    } catch {
      return 'N/A';
    }
  })();

  // 4. Items Count
  const itemCount = assignment.items?.length || assignment.itemCount || 0;

  // 5. Address & Landmark
  const addressText = assignment.customer?.address || 'Address not available';
  const rawLandmark =
    assignment.landmark ||
    assignment.deliveryInstructions?.match(/landmark[:\s]*(.+)/i)?.[1]?.trim() ||
    (addressText.toLowerCase().includes('near') ? 'near ' + addressText.split(/near/i)[1].split(',')[0].trim() : 'NA');

  // 6. Order Amount & Payment Type
  const totalAmount = assignment.totalAmount || assignment.codAmount || 0;
  const isCod =
    Boolean((assignment as any).isCod) ||
    (assignment.codAmount ?? 0) > 0 ||
    String(assignment.paymentMode || (assignment as any).paymentMethod || '').toLowerCase().includes('cash') ||
    String(assignment.paymentMode || (assignment as any).paymentMethod || '').toLowerCase().includes('cod');
  const paymentTypeLabel = isCod ? 'Cash on Delivery (COD)' : 'Prepaid';

  // 7. Warehouse / Hub & Order Type
  const orderTypeFormatted = assignment.type
    ? assignment.type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Task';
  const assignedHub = assignment.pickupWarehouseName || (assignment as any).assignedLab || 'Main Hub';
  const reference = assignment.externalReferenceId || (assignment as any).reference || 'NA';

  // 8. Remarks / Instructions
  const remarksText = assignment.deliveryInstructions || assignment.deliveryNotes || 'No special instructions';

  // 9. Customer details
  const customerName = assignment.customer?.name || 'Customer';
  const customerPhone = assignment.customer?.phone && assignment.customer.phone !== 'N/A' ? assignment.customer.phone : null;

  // 10. Items summary line
  const itemsSummary =
    assignment.items && assignment.items.length > 0
      ? assignment.items.map((it) => `${it.description}${it.quantity > 1 ? ` (x${it.quantity})` : ''}`).join(', ')
      : assignment.checklist && assignment.checklist.length > 0
      ? assignment.checklist.map((c) => c.label).join(', ')
      : 'N/A';

  const callCustomer = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    } else {
      Toast.show({ type: 'info', text1: 'Customer phone number not available' });
    }
  };

  const whatsappCustomer = () => {
    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
    } else {
      Toast.show({ type: 'info', text1: 'Customer phone number not available' });
    }
  };

  return (
    <View style={styles.cardWrapper}>
      {/* ─── 1. TOP HEADER BANNER (THEMED) ─── */}
      <View style={[styles.headerBanner, assignment.status === 'cancelled' && styles.headerBannerCancelled]}>
        <Text style={styles.headerBannerText}>Booking ID : {orderId}</Text>
        {assignment.status === 'cancelled' && (
          <View style={styles.cancelledBadge}>
            <MaterialIcons name="cancel" size={12} color="#FFFFFF" />
            <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        {/* ─── 2. SUB-HEADER INFO ROW (Order Date & Order Time Only) ─── */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="calendar-today" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <MaterialIcons name="access-time" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{orderTime}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ─── 3. ADDRESS SECTION ─── */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitleThemed, { marginBottom: 6 }]}>Delivery Address</Text>

          <Text style={styles.subLabel}>Address Details</Text>
          <Text style={styles.boldValueText}>{addressText}</Text>

          {rawLandmark !== 'NA' && (
            <>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Landmark</Text>
              <Text style={styles.boldValueText}>{rawLandmark}</Text>
            </>
          )}

          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <View style={{ marginTop: 6 }}>
              <DistanceDisplay
                style={styles.distanceText}
                currentLocation={currentLocation}
                targetLocation={assignment.customer.location}
                targetAddress={assignment.customer.address}
                backendDistanceKm={assignment.distanceKm}
              />
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* ─── 4. ORDER AMOUNT & PAYMENT ─── */}
        <View style={styles.orderAmountRow}>
          <View>
            <Text style={styles.orderAmountLabel}>Order Amount</Text>
            {isCod && <Text style={styles.codBadge}>COD: Collect Cash</Text>}
          </View>
          <Text style={styles.orderAmountValue}>₹ {totalAmount.toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        {/* ─── 5. 3-COLUMN METADATA ROW (Operations & Logistics) ─── */}
        <View style={styles.threeColumnRow}>
          <View style={styles.columnItem}>
            <Text style={styles.colLabel}>Order Type</Text>
            <Text style={styles.colValue} numberOfLines={1}>{orderTypeFormatted}</Text>
          </View>

          <View style={[styles.columnItem, { flex: 1.4, paddingHorizontal: 4 }]}>
            <Text style={styles.colLabel}>Assigned Hub</Text>
            <Text style={styles.colValue} numberOfLines={1}>{assignedHub}</Text>
          </View>

          <View style={styles.columnItem}>
            <Text style={styles.colLabel}>Payment</Text>
            <Text style={styles.colValue} numberOfLines={1}>{isCod ? 'COD' : 'Prepaid'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ─── 6. REMARKS / INSTRUCTIONS ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.colLabel}>Instructions & Remarks</Text>
          <View style={styles.remarksBox}>
            <Text style={styles.remarksText}>{remarksText}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ─── 7. CUSTOMER DETAILS & CALL / WHATSAPP ACTIONS ─── */}
        <View style={styles.customerSectionContainer}>
          <Text style={styles.sectionTitleThemed}>Customer Details</Text>

          <View style={styles.customerRow}>
            {/* Avatar Circle */}
            <View style={styles.customerAvatar}>
              <MaterialIcons name="person" size={24} color={isDark ? colors.textSecondary : '#9CA3AF'} />
            </View>

            {/* Vertical Accent Bar */}
            <View style={styles.themedVerticalBar} />

            {/* Customer Name, Phone, Items */}
            <View style={styles.customerInfo}>
              <Text style={styles.customerName} numberOfLines={1}>{customerName}</Text>
              {customerPhone && (
                <Text style={styles.customerPhoneText}>📞 {customerPhone}</Text>
              )}
              {itemsSummary && itemsSummary !== 'N/A' && (
                <Text style={styles.itemsSummaryText} numberOfLines={1}>
                  <Text style={styles.itemsPrefix}>Items: </Text>
                  {itemsSummary}
                </Text>
              )}
            </View>

            {/* ─── REDESIGNED INLINE QUICK ACTION BUTTONS (CALL & WHATSAPP) ─── */}
            {customerPhone && (
              <View style={styles.customerActions}>
                <TouchableOpacity
                  style={styles.circleBtnCall}
                  onPress={callCustomer}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="call" size={19} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleBtnWhatsapp}
                  onPress={whatsappCustomer}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <FontAwesome name="whatsapp" size={21} color={isDark ? '#34D399' : '#16A34A'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ─── 8. BOTTOM OUTLINED THEMED BUTTON (Order Items) ─── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => setShowItemsModal(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="receipt-long" size={17} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.pillButtonText}>View Order Items</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── ORDER ITEMS MODAL ─── */}
      <Modal visible={showItemsModal} transparent animationType="fade" onRequestClose={() => setShowItemsModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Items & Checklist</Text>
              <TouchableOpacity onPress={() => setShowItemsModal(false)}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {assignment.items && assignment.items.length > 0 ? (
                assignment.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.itemRow}>
                    <View style={styles.itemNumberBadge}>
                      <Text style={styles.itemNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.description}</Text>
                      {item.unitPrice > 0 && (
                        <Text style={styles.itemPrice}>Rate: ₹{item.unitPrice.toLocaleString()}</Text>
                      )}
                    </View>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyText}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                ))
              ) : assignment.checklist && assignment.checklist.length > 0 ? (
                assignment.checklist.map((c, idx) => (
                  <View key={c.id || idx} style={styles.itemRow}>
                    <MaterialIcons
                      name={c.isChecked ? 'check-circle' : 'radio-button-unchecked'}
                      size={20}
                      color={c.isChecked ? '#16A34A' : colors.textSecondary}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.itemName}>{c.label}</Text>
                      <Text style={styles.itemPrice}>{c.isRequired ? 'Mandatory step' : 'Optional'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <MaterialIcons name="inventory" size={36} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>No separate item details for this task.</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowItemsModal(false)}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    cardWrapper: {
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: 14,
      marginHorizontal: 14,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: colors.border || '#E5E7EB',
      overflow: 'hidden',
    },
    headerBanner: {
      backgroundColor: colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerBannerCancelled: {
      backgroundColor: '#DC2626',
    },
    cancelledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    cancelledBadgeText: {
      color: '#FFFFFF',
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    headerBannerText: {
      color: colors.textInverse || '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    cardBody: {
      paddingBottom: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaDivider: {
      width: 1,
      height: 14,
      backgroundColor: isDark ? colors.border : '#E5E7EB',
    },
    metaText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? colors.border : '#F0F2F5',
      marginHorizontal: 14,
    },
    sectionContainer: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    sectionTitleThemed: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.primary,
    },
    directionsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.primary + '15',
    },
    directionsBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    subLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    boldValueText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 18,
    },
    distanceText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.primary,
    },
    orderAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    orderAmountLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    codBadge: {
      fontSize: 11,
      fontWeight: '700',
      color: '#D97706',
      marginTop: 2,
    },
    orderAmountValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    threeColumnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    columnItem: {
      flex: 1,
    },
    colLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    colValue: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 3,
    },
    remarksBox: {
      backgroundColor: isDark ? colors.border + '50' : '#F3F4F6',
      borderRadius: 8,
      paddingVertical: 9,
      paddingHorizontal: 12,
      marginTop: 6,
    },
    remarksText: {
      fontSize: 12.5,
      color: colors.textPrimary,
      lineHeight: 17,
    },
    customerSectionContainer: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    customerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? colors.border : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    themedVerticalBar: {
      width: 3.5,
      height: 42,
      backgroundColor: colors.primary,
      borderRadius: 2,
      marginHorizontal: 10,
    },
    customerInfo: {
      flex: 1,
      justifyContent: 'center',
      marginRight: 6,
    },
    customerName: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    customerPhoneText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    itemsSummaryText: {
      fontSize: 11.5,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    itemsPrefix: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    customerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    circleBtnCall: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary + '35',
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleBtnWhatsapp: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#064E3B40' : '#DCFCE7',
      borderWidth: 1,
      borderColor: isDark ? '#059669' : '#86EFAC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    pillButton: {
      flex: 1,
      height: 42,
      borderRadius: 21,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    // Modal styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 18,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
        android: { elevation: 8 },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#F3F4F6',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#F9FAFB',
    },
    itemNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemNumberText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    itemName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemPrice: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemQtyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.primary + '15',
    },
    itemQtyText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.primary,
    },
    modalCloseBtn: {
      marginTop: 14,
      backgroundColor: colors.primary,
      height: 42,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseBtnText: {
      color: colors.textInverse || '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border || '#D1D5DB',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: isDark ? colors.border + '30' : '#FFFFFF',
      minHeight: 100,
    },
  });
