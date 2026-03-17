import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/lib/api";
import Colors from "@/constants/colors";

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings.list,
  });

  const booking = bookings?.find((b) => b.id === Number(id));

  const payMutation = useMutation({
    mutationFn: async (screenshotUrl?: string) => {
      if (!booking) throw new Error("Booking not found");
      const nights = Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      const amount = (booking.room?.price || 0) * nights;
      return api.payments.create(booking.id, amount, screenshotUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      Alert.alert("Payment Submitted!", "Your payment is under review.", [
        { text: "OK", onPress: () => router.push("/(tabs)/bookings") },
      ]);
    },
    onError: (e: any) => Alert.alert("Error", e.message || "Payment submission failed"),
  });

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let screenshotUrl: string | undefined;
      if (screenshotUri) {
        const response = await fetch(screenshotUri);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onloadend = () => { resolve(); };
          reader.readAsDataURL(blob);
        });
        const base64 = reader.result as string;
        const uploaded = await api.upload.image(base64, "payment-screenshots");
        screenshotUrl = uploaded.url;
      }
      payMutation.mutate(screenshotUrl);
    } catch (e: any) {
      Alert.alert("Upload Error", e.message || "Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  const amount = (booking.room?.price || 0) * nights;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.bookingSummary}>
          <Text style={styles.roomName}>{booking.room?.title}</Text>
          <Text style={styles.dates}>{booking.checkIn} — {booking.checkOut} ({nights} nights)</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{amount.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Scan & Pay</Text>
          <Text style={styles.qrSub}>Use any UPI app to pay the amount</Text>
          <View style={styles.qrBox}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={[styles.qrCell, (i === 0 || i === 2 || i === 6 || i === 8) && styles.qrCellDark]} />
              ))}
            </View>
            <View style={styles.qrCenter}>
              <Ionicons name="business" size={32} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.upiId}>UPI: rajhotel@upi</Text>
          <View style={styles.amountBadge}>
            <Text style={styles.amountBadgeText}>₹{amount.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Upload Payment Screenshot</Text>
          <Text style={styles.uploadSub}>After payment, upload your screenshot for verification</Text>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickScreenshot} activeOpacity={0.85}>
            {screenshotUri ? (
              <Image source={{ uri: screenshotUri }} style={styles.previewImg} resizeMode="contain" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                <Text style={styles.uploadBtnText}>Tap to upload screenshot</Text>
                <Text style={styles.uploadBtnSub}>JPEG, PNG supported</Text>
              </>
            )}
          </TouchableOpacity>

          {screenshotUri && (
            <TouchableOpacity style={styles.changeBtn} onPress={pickScreenshot} activeOpacity={0.8}>
              <Text style={styles.changeBtnText}>Change Screenshot</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (uploading || payMutation.isPending) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={uploading || payMutation.isPending}
          activeOpacity={0.85}
        >
          {uploading || payMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  bookingSummary: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  roomName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  dates: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
  },
  qrCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  qrSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  qrBox: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 4,
  },
  qrGrid: {
    position: "absolute",
    width: 136,
    height: 136,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  qrCell: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: Colors.light.background,
  },
  qrCellDark: {
    backgroundColor: Colors.primary,
  },
  qrCenter: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upiId: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  amountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  amountBadgeText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  uploadSection: {
    gap: 10,
  },
  uploadTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  uploadSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  uploadBtn: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 140,
  },
  previewImg: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  uploadBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  uploadBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
  },
  changeBtn: {
    alignItems: "center",
  },
  changeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
