import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = "success", visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(30);
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, damping: 20 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 30, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [visible, message]);

  if (!visible) return null;

  const bg =
    type === "success" ? Colors.success :
    type === "error" ? Colors.danger :
    Colors.primary;

  const icon =
    type === "success" ? "checkmark-circle" as const :
    type === "error" ? "close-circle" as const :
    "information-circle" as const;

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: bg, opacity, transform: [{ translateY }] }]}
    >
      <Ionicons name={icon} size={22} color="#fff" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 9999,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    flex: 1,
  },
});
