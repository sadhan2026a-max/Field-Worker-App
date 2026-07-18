import { Dimensions, PixelRatio, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

export const widthSize = width;
export const heightSize = height;

export const wp = (widthPercent: number) => {
  return PixelRatio.roundToNearestPixel(width * widthPercent / 100);
};

export const hp = (heightPercent: number) => {
  return PixelRatio.roundToNearestPixel(height * heightPercent / 100);
};

export const isIos = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
