import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, BookingWithDetails } from "@/lib/api";
import Colors from "@/constants/colors";
import { Platform } from "react-native";

const STATUS_CONFIG = {
  pending: { color: Colors.warning, bg: "#FEF3C7", icon: "time-outline" as const, label: "Pending" },
  confirmed: { color: Colors.success, bg: "#D1FAE5", icon: "checkmark-circle-outline" as const, label: "Confirmed" },
  rejected: { color: Colors.danger, bg: "#FEE2E2", icon: "close-circle-outline" as const, label: "Rejected" },
};

function BookingCard({ booking }: { booking: BookingWithDetails }) {
  const cfg = STATUS_CONFIG[booking.status];
  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  const total = (booking.room?.price || 0) * nights;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/booking/${booking.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardRoom} numberOfLines={1}>{booking.room?.title || "Room"}</Text>
          <Text style={styles.cardId}>Booking #{booking.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={14} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Check-In</Text>
          <Text style={styles.dateValue}>{new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
        </View>
        <View style={styles.dateDivider}>
          <Ionicons name="arrow-forward" size={16} color={Colors.light.textMuted} />
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Check-Out</Text>
          <Text style={styles.dateValue}>{new Date(booking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.nights}>{nights} night{nights !== 1 ? "s" : ""}</Text>
        <Text style={styles.total}>₹{total.toLocaleString()}</Text>
      </View>

      {booking.status === "confirmed" && (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => router.push(`/payment/${booking.id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="card-outline" size={16} color="#fff" />
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");

  const { data: bookings, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings.list,
  });

  const filtered = (bookings || []).filter(
    (b) => filter === "all" || b.status === filter
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>{bookings?.length || 0} bookings total</Text>
      </View>

      <View style={styles.filterRow}>
        {(["all", "pending", "confirmed", "rejected"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={({ item }) => <BookingCard booking={item} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Browse our rooms to make a booking</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)/rooms")} activeOpacity={0.85}>
                <Text style={styles.browseBtnText}>Browse Rooms</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardRoom: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    maxWidth: 180,
  },
  cardId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  dateDivider: {
    paddingHorizontal: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nights: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  total: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 12,
  },
  payBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
  },
  browseBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  browseBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
