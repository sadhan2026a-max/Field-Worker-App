import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Animated,
  Easing,
  Platform,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { useCurrentLocation } from '@/shared/utils/location';

interface SearchingOrderRadarProps {
  isAvailable: boolean;
}

// Top-Left Micro Radar Dimensions (26px diameter, ultra-compact)
const RADAR_SIZE = 26;
const RADAR_RADIUS = RADAR_SIZE / 2;
const TILE_SIZE = 256;
const MAP_ZOOM = 16; // Level 16 is the maximum native detail level with 100% reliable street coverage

// Fixed Precision Coordinates for Blip Targets inside 26px Micro-Radar (Radius 13px)
const BLIP_POSITIONS = [
  { left: 16.5, top: 6.5 },  // Quadrant 1 (2 o'clock, radius ~7px)
  { left: 6.5, top: 15.5 },  // Quadrant 3 (7 o'clock, radius ~6.5px)
  { left: 5.5, top: 7.5 },   // Quadrant 4 (10 o'clock, radius ~7.5px)
];

// Web Mercator Slippy Map Tile Math: Lat/Lon -> Global World Pixels at zoom 16
function latLonToWorldPixels(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const xFloat = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yFloat =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  return {
    worldX: xFloat * TILE_SIZE,
    worldY: yFloat * TILE_SIZE,
  };
}

// Dedicated Tile Component:
// 100% Clean Non-Colored Slate/Monochrome Base + Sharp High-Contrast Labels & Road Lining
const MapTileItem = React.memo(function MapTileItem({
  x,
  y,
  zoom,
  left,
  top,
  isDark,
}: {
  x: number;
  y: number;
  zoom: number;
  left: number;
  top: number;
  isDark?: boolean;
}) {
  const serviceBase = isDark ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
  const serviceRef = isDark ? 'World_Dark_Gray_Reference' : 'World_Light_Gray_Reference';

  // 1. Clean Non-Colored Slate/Monochrome Base (Zero yellow, zero green, clean slate)
  const baseUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${serviceBase}/MapServer/tile/${zoom}/${y}/${x}`;
  // 2. High-Contrast Sharp Labels & Road Lining Overlay (Makes all street names and path lines crystal clear)
  const refUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${serviceRef}/MapServer/tile/${zoom}/${y}/${x}`;

  return (
    <View style={[styles.tileStyle, { left, top }]}>
      {/* Non-Colored Clean Slate Map */}
      <Image
        source={{ uri: baseUrl }}
        style={StyleSheet.absoluteFillObject}
        fadeDuration={0}
        resizeMode="cover"
      />
      {/* Crisp Road Linings and Sharp Dark Street Names */}
      <Image
        source={{ uri: refUrl }}
        style={StyleSheet.absoluteFillObject}
        fadeDuration={0}
        resizeMode="cover"
      />
    </View>
  );
});

// ─── High-Performance Memoized Micro Radar Scanner ───
// Fully isolated from map gestures and GPS updates to guarantee 60 FPS zero-hitch continuous sweep
interface MicroRadarScannerProps {
  isAvailable: boolean;
  colors: any;
  styles: any;
}

const MicroRadarScanner = React.memo(function MicroRadarScanner({
  isAvailable,
  colors,
  styles,
}: MicroRadarScannerProps) {
  // 360° Continuous Sweep Animation for the Radar (Native Driver)
  const sweepAnim = useRef(new Animated.Value(0)).current;

  // Staggered Pulsing Dot Animations inside Radar
  const blip1Anim = useRef(new Animated.Value(0)).current;
  const blip2Anim = useRef(new Animated.Value(0)).current;
  const blip3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAvailable) {
      sweepAnim.setValue(0);
      blip1Anim.setValue(0);
      blip2Anim.setValue(0);
      blip3Anim.setValue(0);
      return;
    }

    // 1. Continuous 360° Sweep (Native Driver, isInteraction: false prevents gesture/scroll throttling)
    const sweepLoop = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
      { iterations: -1, resetBeforeIteration: true }
    );

    // 2. Staggered Blip 1 Pulse (Quadrant 1)
    const blip1Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(blip1Anim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(blip1Anim, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(1050),
      ]),
      { iterations: -1 }
    );

    // 3. Staggered Blip 2 Pulse (Quadrant 3)
    const blip2Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1150),
        Animated.timing(blip2Anim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(blip2Anim, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(250),
      ]),
      { iterations: -1 }
    );

    // 4. Staggered Blip 3 Pulse (Quadrant 4)
    const blip3Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(blip3Anim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(blip3Anim, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
      { iterations: -1 }
    );

    sweepLoop.start();
    blip1Loop.start();
    blip2Loop.start();
    blip3Loop.start();

    return () => {
      sweepLoop.stop();
      blip1Loop.stop();
      blip2Loop.stop();
      blip3Loop.stop();
    };
  }, [isAvailable]);

  // Sweep rotation interpolation: 0deg -> 360deg
  const sweepRotation = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.topLeftRadarAnchor} pointerEvents="none">
      {/* Ambient Halo Ring */}
      <View style={styles.radarHalo} />

      <View style={styles.radarScopeTransparent}>
        {/* Concentric Scope Circles */}
        <View style={[styles.gridCircle, styles.circleOuter]} />
        <View style={[styles.gridCircle, styles.circleMiddle]} />
        <View style={[styles.gridCircle, styles.circleInner]} />

        {/* Precision Cardinal Micro-Ticks */}
        <View style={styles.tickN} />
        <View style={styles.tickS} />
        <View style={styles.tickW} />
        <View style={styles.tickE} />

        {/* Crosshairs */}
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />

        {/* 360° Moving Sweep Beam */}
        {isAvailable && (
          <Animated.View
            style={[
              styles.sweepContainer,
              { transform: [{ rotate: sweepRotation }] },
            ]}
          >
            <View style={styles.sweepWedgeWrapper}>
              <LinearGradient
                colors={[colors.primary + '75', colors.primary + '25', 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.sweepWedge}
              />
              <View style={[styles.sweepLeadingLine, { backgroundColor: colors.primary }]} />
            </View>
          </Animated.View>
        )}

        {/* Blip 1 */}
        {isAvailable && (
          <Animated.View
            style={[
              styles.blipDot,
              {
                left: BLIP_POSITIONS[0].left,
                top: BLIP_POSITIONS[0].top,
                opacity: blip1Anim,
                transform: [{ scale: blip1Anim }],
              },
            ]}
          />
        )}

        {/* Blip 2 */}
        {isAvailable && (
          <Animated.View
            style={[
              styles.blipDot,
              {
                left: BLIP_POSITIONS[1].left,
                top: BLIP_POSITIONS[1].top,
                opacity: blip2Anim,
                transform: [{ scale: blip2Anim }],
              },
            ]}
          />
        )}

        {/* Blip 3 */}
        {isAvailable && (
          <Animated.View
            style={[
              styles.blipDot,
              {
                left: BLIP_POSITIONS[2].left,
                top: BLIP_POSITIONS[2].top,
                opacity: blip3Anim,
                transform: [{ scale: blip3Anim }],
              },
            ]}
          />
        )}

        {/* Center Micro Core Pip */}
        <View style={[styles.centerPipRing, { borderColor: colors.primary }]}>
          <View style={[styles.centerPipDot, { backgroundColor: colors.primary }]} />
        </View>
      </View>
    </View>
  );
});

export function SearchingOrderRadar({ isAvailable }: SearchingOrderRadarProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, isDark), [colors, isDark]);
  const currentLocation = useCurrentLocation();

  const [cardWidth, setCardWidth] = useState(360);

  // ─── Interactive Continuous Pan & Smooth Zoom Scale States ───
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);

  const panCurrentRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const scaleCurrentRef = useRef(1);
  const scaleStartRef = useRef(1);
  const initialPinchDistRef = useRef<number | null>(null);

  panCurrentRef.current = panOffset;
  scaleCurrentRef.current = mapScale;

  // ─── PanResponder for Multi-Directional Drag & Silky Smooth Pinch-to-Zoom ───
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 1.5 || Math.abs(gestureState.dy) > 1.5;
      },
      onPanResponderGrant: () => {
        panStartRef.current = { ...panCurrentRef.current };
        scaleStartRef.current = scaleCurrentRef.current;
        initialPinchDistRef.current = null;
      },
      onPanResponderMove: (e, gestureState) => {
        // Two-finger Smooth Continuous Pinch-to-Zoom
        if (e.nativeEvent.touches.length === 2) {
          const t1 = e.nativeEvent.touches[0];
          const t2 = e.nativeEvent.touches[1];
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          if (initialPinchDistRef.current === null) {
            initialPinchDistRef.current = dist;
            scaleStartRef.current = scaleCurrentRef.current;
          } else {
            const ratio = dist / initialPinchDistRef.current;
            const newScale = Math.min(2.2, Math.max(0.65, scaleStartRef.current * ratio));
            setMapScale(Number(newScale.toFixed(3)));
          }
        } else if (e.nativeEvent.touches.length === 1 && initialPinchDistRef.current === null) {
          // One-finger Drag / Pan in any direction
          setPanOffset({
            x: Math.round(panStartRef.current.x + gestureState.dx),
            y: Math.round(panStartRef.current.y + gestureState.dy),
          });
        }
      },
      onPanResponderRelease: () => {
        initialPinchDistRef.current = null;
      },
      onPanResponderTerminate: () => {
        initialPinchDistRef.current = null;
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Coordinates: default to standard city coordinates if GPS still loading
  const defaultCoords = { latitude: 28.6139, longitude: 77.2090 };
  const userLat = currentLocation?.latitude ?? defaultCoords.latitude;
  const userLng = currentLocation?.longitude ?? defaultCoords.longitude;

  const CARD_HEIGHT = 155;
  const centerX = cardWidth / 2;
  const centerY = CARD_HEIGHT / 2;

  // 1. Calculate driver's world pixel position at level 16
  const { worldX: driverWorldX, worldY: driverWorldY } = latLonToWorldPixels(
    userLat,
    userLng,
    MAP_ZOOM
  );

  // 2. Map screen center in world pixels (compensating for scale)
  const screenCenterWorldX = driverWorldX - panOffset.x / mapScale;
  const screenCenterWorldY = driverWorldY - panOffset.y / mapScale;

  // 3. Center tile indices & sub-pixel offsets
  const centerTileXFloat = screenCenterWorldX / TILE_SIZE;
  const centerTileYFloat = screenCenterWorldY / TILE_SIZE;
  const centerTileX = Math.floor(centerTileXFloat);
  const centerTileY = Math.floor(centerTileYFloat);
  const subTileX = (centerTileXFloat - centerTileX) * TILE_SIZE;
  const subTileY = (centerTileYFloat - centerTileY) * TILE_SIZE;

  const tileOriginX = centerX - subTileX;
  const tileOriginY = centerY - subTileY;

  // 4. Generate seamless surrounding tiles around current pan view (5x3 grid for full card coverage)
  const tilePositions: { key: string; x: number; y: number; left: number; top: number }[] = [];
  const maxTile = Math.pow(2, MAP_ZOOM);

  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const curX = centerTileX + dx;
      const curY = centerTileY + dy;
      if (curX >= 0 && curX < maxTile && curY >= 0 && curY < maxTile) {
        tilePositions.push({
          key: `${MAP_ZOOM}_${curX}_${curY}`,
          x: curX,
          y: curY,
          left: Math.round(tileOriginX + dx * TILE_SIZE),
          top: Math.round(tileOriginY + dy * TILE_SIZE),
        });
      }
    }
  }

  // 5. Driver Pin Point Dot position on screen (stays locked to GPS road position)
  const driverScreenX = Math.round(centerX + panOffset.x);
  const driverScreenY = Math.round(centerY + panOffset.y);

  // Is map displaced from driver's GPS center?
  const isDisplaced =
    Math.abs(panOffset.x) > 6 || Math.abs(panOffset.y) > 6 || Math.abs(mapScale - 1) > 0.05;

  // Recenter back to driver's live GPS location & default scale
  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setMapScale(1);
  };

  return (
    <View
      style={styles.cardContainer}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
    >
      {/* ─── 1. Interactive Slippy Map Layer (Smooth Pinch Zoom & Free Drag) ─── */}
      <View style={StyleSheet.absoluteFillObject} {...panResponder.panHandlers}>
        {/* Continuous Smooth Scale View for Butter-Smooth Zoom */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ scale: mapScale }],
            },
          ]}
        >
          {tilePositions.map((tile) => (
            <MapTileItem
              key={tile.key}
              x={tile.x}
              y={tile.y}
              zoom={MAP_ZOOM}
              left={tile.left}
              top={tile.top}
              isDark={isDark}
            />
          ))}
        </View>

        {/* Soft Ambient Tint Overlay over Map */}
        <View
          style={[styles.mapOverlay, !isAvailable && styles.mapOverlayOffline]}
          pointerEvents="none"
        />

        {/* ─── 2. Driver Live GPS Pin Point Dot (Clean Static Dot • Zero Animation Circle) ─── */}
        <View
          style={[
            styles.driverDotAnchor,
            {
              left: driverScreenX - 7,
              top: driverScreenY - 7,
            },
          ]}
          pointerEvents="none"
        >
          {/* Crisp High-Contrast Static Driver GPS Dot */}
          <View style={[styles.driverPuckOuter, { borderColor: colors.primary }]}>
            <View style={[styles.driverPuckInner, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      {/* ─── 3. Top-Left Isolated Micro Radar (Zero Hitch • Butter Smooth 60 FPS) ─── */}
      <MicroRadarScanner isAvailable={isAvailable} colors={colors} styles={styles} />

      {/* ─── 4. Top-Right Recenter Button (Snaps back to Driver's Live Location) ─── */}
      <TouchableOpacity
        style={[
          styles.recenterButton,
          isDisplaced && styles.recenterButtonActive,
        ]}
        onPress={handleRecenter}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons
          name={isDisplaced ? 'my-location' : 'gps-fixed'}
          size={16}
          color={isDisplaced ? colors.primary : colors.textSecondary}
        />
        {isDisplaced && (
          <View style={[styles.activePuckDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tileStyle: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
});

const useStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  cardContainer: {
    height: 155,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.25)' : 'transparent',
  },
  mapOverlayOffline: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },

  // ─── Driver GPS Location Dot on Map (Clean Static Dot • Zero Pulse Ring) ───
  driverDotAnchor: {
    position: 'absolute',
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  driverPuckOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 3.5,
      },
    }),
  },
  driverPuckInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ─── Top-Left Original Radar Scanner (Preserved Exact Multi-Ring Design • Ultra-Compact) ───
  topLeftRadarAnchor: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  radarHalo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? colors.primary + '18' : colors.primary + '0E',
  },
  radarScopeTransparent: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_RADIUS,
    backgroundColor: isDark ? 'rgba(31, 168, 85, 0.14)' : 'rgba(31, 168, 85, 0.08)',
    borderWidth: 1.2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  gridCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: colors.primary + '75',
  },
  circleOuter: {
    width: 18,
    height: 18,
  },
  circleMiddle: {
    width: 12,
    height: 12,
  },
  circleInner: {
    width: 6,
    height: 6,
  },
  tickN: {
    position: 'absolute',
    top: 0,
    width: 0.9,
    height: 1.8,
    backgroundColor: colors.primary,
    alignSelf: 'center',
  },
  tickS: {
    position: 'absolute',
    bottom: 0,
    width: 0.9,
    height: 1.8,
    backgroundColor: colors.primary,
    alignSelf: 'center',
  },
  tickW: {
    position: 'absolute',
    left: 0,
    width: 1.8,
    height: 0.9,
    backgroundColor: colors.primary,
    alignSelf: 'center',
  },
  tickE: {
    position: 'absolute',
    right: 0,
    width: 1.8,
    height: 0.9,
    backgroundColor: colors.primary,
    alignSelf: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 0.6,
    backgroundColor: colors.primary + '55',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 0.6,
    backgroundColor: colors.primary + '55',
  },
  sweepContainer: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweepWedgeWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: RADAR_RADIUS,
    height: RADAR_RADIUS,
    overflow: 'hidden',
  },
  sweepWedge: {
    width: '100%',
    height: '100%',
    borderTopRightRadius: RADAR_RADIUS,
  },
  sweepLeadingLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
  },
  blipDot: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: colors.primary,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  centerPipRing: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    borderWidth: 0.8,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPipDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },

  // ─── Top-Right Recenter Button ───
  recenterButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.94)' : 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
    zIndex: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  recenterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#FFFFFF',
  },
  activePuckDot: {
    position: 'absolute',
    top: 2.5,
    right: 2.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
