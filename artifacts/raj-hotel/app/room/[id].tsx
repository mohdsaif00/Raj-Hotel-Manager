import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Colors from "@/constants/colors";

function DatePicker({ label, value, onChange }: { label: string; value: string; onChange: (d: string) => void }) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  return (
    <View style={dpStyles.container}>
      <Text style={dpStyles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {dates.map((d) => (
          <TouchableOpacity
            key={d}
            style={[dpStyles.dateChip, value === d && dpStyles.dateChipActive]}
            onPress={() => onChange(d)}
            activeOpacity={0.8}
          >
            <Text style={[dpStyles.dateDay, value === d && dpStyles.dateDayActive]}>
              {new Date(d).toLocaleDateString("en-IN", { weekday: "short" })}
            </Text>
            <Text style={[dpStyles.dateNum, value === d && dpStyles.dateNumActive]}>
              {new Date(d).getDate()}
            </Text>
            <Text style={[dpStyles.dateMon, value === d && dpStyles.dateMonActive]}>
              {new Date(d).toLocaleDateString("en-IN", { month: "short" })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const dpStyles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  dateChip: {
    width: 56,
    height: 72,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    gap: 2,
  },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDay: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.light.textMuted },
  dateDayActive: { color: "rgba(255,255,255,0.7)" },
  dateNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text },
  dateNumActive: { color: "#fff" },
  dateMon: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  dateMonActive: { color: "rgba(255,255,255,0.7)" },
});

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 1);
  const defaultCheckOut = new Date(today);
  defaultCheckOut.setDate(today.getDate() + 2);

  const [checkIn, setCheckIn] = useState(defaultCheckIn.toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(defaultCheckOut.toISOString().split("T")[0]);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: () => api.rooms.get(Number(id)),
  });

  const bookMutation = useMutation({
    mutationFn: () => api.bookings.create(Number(id), checkIn, checkOut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      Alert.alert(
        "Booking Requested!",
        "Your booking request has been submitted and is pending confirmation.",
        [{ text: "View Bookings", onPress: () => router.push("/(tabs)/bookings") }]
      );
    },
    onError: (e: any) => Alert.alert("Booking Failed", e.message || "Room may already be booked for these dates"),
  });

  const handleBook = () => {
    if (!checkIn || !checkOut) {
      Alert.alert("Error", "Please select check-in and check-out dates");
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      Alert.alert("Error", "Check-out must be after check-in");
      return;
    }
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const total = (room?.price || 0) * nights;
    Alert.alert(
      "Confirm Booking",
      `${room?.title}\n${nights} night(s) • ₹${total.toLocaleString()}\n\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book Now", onPress: () => bookMutation.mutate() },
      ]
    );
  };

  if (isLoading || !room) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const total = room.price * nights;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={styles.imageContainer}>
          {room.imageUrl ? (
            <Image source={{ uri: room.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="bed-outline" size={60} color={Colors.light.textMuted} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
            activeOpacity={0.9}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.availTag, { backgroundColor: room.isAvailable ? "#DCFCE7" : "#FEE2E2" }]}>
            <View style={[styles.availDot, { backgroundColor: room.isAvailable ? Colors.success : Colors.danger }]} />
            <Text style={[styles.availText, { color: room.isAvailable ? Colors.success : Colors.danger }]}>
              {room.isAvailable ? "Available" : "Unavailable"}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{room.title}</Text>
            <View>
              <Text style={styles.price}>₹{room.price.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>per night</Text>
            </View>
          </View>

          <Text style={styles.description}>{room.description}</Text>

          <View style={styles.amenities}>
            {[
              { icon: "wifi-outline" as const, label: "Free WiFi" },
              { icon: "snow-outline" as const, label: "AC" },
              { icon: "tv-outline" as const, label: "Smart TV" },
              { icon: "restaurant-outline" as const, label: "Room Service" },
            ].map((a) => (
              <View key={a.label} style={styles.amenityItem}>
                <Ionicons name={a.icon} size={18} color={Colors.primary} />
                <Text style={styles.amenityLabel}>{a.label}</Text>
              </View>
            ))}
          </View>

          {room.isAvailable && (
            <View style={styles.bookingSection}>
              <Text style={styles.bookingTitle}>Select Dates</Text>
              <DatePicker label="Check-In" value={checkIn} onChange={setCheckIn} />
              <DatePicker label="Check-Out" value={checkOut} onChange={setCheckOut} />

              {nights > 0 && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>₹{room.price.toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}</Text>
                    <Text style={styles.summaryValue}>₹{total.toLocaleString()}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotal}>Total</Text>
                    <Text style={styles.summaryTotalValue}>₹{total.toLocaleString()}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {room.isAvailable && (
        <View style={[styles.bookBar, { paddingBottom: insets.bottom + 16 }]}>
          <View>
            <Text style={styles.bookBarTotal}>₹{total > 0 ? total.toLocaleString() : room.price.toLocaleString()}</Text>
            <Text style={styles.bookBarNights}>{nights > 0 ? `${nights} night${nights !== 1 ? "s" : ""}` : "Select dates"}</Text>
          </View>
          <TouchableOpacity
            style={[styles.bookNowBtn, (bookMutation.isPending || !nights) && styles.bookNowBtnDisabled]}
            onPress={handleBook}
            disabled={bookMutation.isPending || !nights}
            activeOpacity={0.85}
          >
            {bookMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.bookNowBtnText}>Book Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 320,
  },
  imagePlaceholder: {
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  availTag: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  availDot: { width: 7, height: 7, borderRadius: 3.5 },
  availText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  content: { padding: 20, gap: 20 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    textAlign: "right",
  },
  priceUnit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  amenityLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  bookingSection: { gap: 16 },
  bookingTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  summaryValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.border },
  summaryTotal: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  summaryTotalValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.primary },
  bookBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  bookBarTotal: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.primary },
  bookBarNights: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  bookNowBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookNowBtnDisabled: { opacity: 0.5 },
  bookNowBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
