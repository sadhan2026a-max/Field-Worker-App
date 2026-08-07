import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, Borders } from '@/core/theme';

export interface SignaturePadHandle {
  clear: () => void;
}

interface SignaturePadProps {
  onChange?: (hasSignature: boolean, pathData: string) => void;
  height?: number;
  initialValue?: string;
}

interface Point { x: number; y: number; }

function createSmoothPath(points: Point[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L${points[0].x.toFixed(1)},${(points[0].y + 0.1).toFixed(1)}`;

  // We use L (straight lines) but rely on strokeLinejoin="round" in the SVG 
  // to make the lines perfectly smooth. This ensures the line tracks the 
  // exact pixel the finger touched without "cutting the corners".
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
  }
  return d;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ onChange, height = 160, initialValue }, ref) => {
    const { colors } = useTheme();
    const styles = React.useMemo(() => useStyles(colors), [colors]);
    const [paths, setPaths] = useState<string[]>(initialValue ? [initialValue] : []);
    const currentPoints = useRef<Point[]>([]);
    const currentPathRef = useRef<any>(null);

    useEffect(() => {
      onChange?.(paths.length > 0, paths.join(' '));
    }, [paths, onChange]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          currentPoints.current = [{ x: locationX, y: locationY }];
          // Instantly draw the first dot
          currentPathRef.current?.setNativeProps({ d: createSmoothPath(currentPoints.current) });
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const pts = currentPoints.current;
          
          if (pts.length > 0) {
            const lastPt = pts[pts.length - 1];
            const dx = locationX - lastPt.x;
            const dy = locationY - lastPt.y;
            // Ignore tiny micro-movements to keep the path string optimized
            if (dx * dx + dy * dy < 4) return;
          }

          pts.push({ x: locationX, y: locationY });
          // Bypass React state entirely for 60FPS native drawing
          currentPathRef.current?.setNativeProps({ d: createSmoothPath(pts) });
        },
        onPanResponderRelease: () => {
          const finalPath = createSmoothPath(currentPoints.current);
          if (finalPath) {
            setPaths((prev) => [...prev, finalPath]);
          }
          currentPoints.current = [];
          currentPathRef.current?.setNativeProps({ d: '' });
        },
      }),
    ).current;

    useImperativeHandle(ref, () => ({
      clear: () => {
        setPaths([]);
        currentPoints.current = [];
        currentPathRef.current?.setNativeProps({ d: '' });
      },
    }));

    return (
      <View style={[styles.pad, { height }]} {...panResponder.panHandlers}>
        <Svg width="100%" height="100%">
          {/* Completed strokes */}
          {paths.map((d, index) => (
            <Path 
              key={index} 
              d={d} 
              stroke={colors.textPrimary} 
              strokeWidth={3} 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          ))}
          {/* Active stroke currently being drawn (bypasses React state) */}
          <Path
            ref={currentPathRef}
            stroke={colors.textPrimary}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  },
);

SignaturePad.displayName = 'SignaturePad';

const useStyles = (colors: any) => StyleSheet.create({
  pad: {
    backgroundColor: colors.surface,
    borderRadius: Borders.radius1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
});
