import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Colors from "@/constants/colors";

const STATUS_CONFIG = {
  pending: { color: Colors.warning, bg: "#FEF3C7", icon: "time-outline" as const, label: "Pending" },
  confirmed: { color: Colors.success, bg: "#D1FAE5", icon: "checkmark-circle-outline" as const, label: "Confirmed" },
  rejected: { color: Colors.danger, bg: "#FEE2E2", icon: "close-circle-outline" as const, label: "Rejected" },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings.list,
  });

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: api.payments.list,
  });

  const booking = bookings?.find((b) => b.id === Number(id));
  const payment = payments?.find((p) => p.bookingId === Number(id));

  if (isLoading || !booking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const cfg = STATUS_CONFIG[booking.status];
  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  const total = (booking.room?.price || 0) * nights;

  const PAYMENT_CFG = {
    pending: { color: Colors.warning, label: "Pending" },
    approved: { color: Colors.success, label: "Approved" },
    rejected: { color: Colors.danger, label: "Rejected" },
  };
  const payCfg = payment ? PAYMENT_CFG[payment.status] : null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.bookingId}>Booking #{booking.id}</Text>
          <Text style={styles.createdAt}>
            Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="bed-outline" size={16} color={Colors.light.textMuted} />
              <Text style={styles.detailLabel}>Room</Text>
              <Text style={styles.detailValue}>{booking.room?.title}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={16} color={Colors.light.textMuted} />
              <Text style={styles.detailLabel}>Rate</Text>
              <Text style={styles.detailValue}>₹{booking.room?.price.toLocaleString()}/night</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stay Duration</Text>
          <View style={styles.datesCard}>
            <View style={styles.dateBox}>
              <Text style={styles.dateBoxLabel}>Check-In</Text>
              <Text style={styles.dateBoxDate}>{new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text>
              <Text style={styles.dateBoxYear}>{new Date(booking.checkIn).getFullYear()}</Text>
            </View>
            <View style={styles.nightsBadge}>
              <Text style={styles.nightsText}>{nights}</Text>
              <Text style={styles.nightsLabel}>night{nights !== 1 ? "s" : ""}</Text>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateBoxLabel}>Check-Out</Text>
              <Text style={styles.dateBoxDate}>{new Date(booking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text>
              <Text style={styles.dateBoxYear}>{new Date(booking.checkOut).getFullYear()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="calculator-outline" size={16} color={Colors.light.textMuted} />
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>₹{total.toLocaleString()}</Text>
            </View>
            {payment && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Ionicons name="card-outline" size={16} color={Colors.light.textMuted} />
                  <Text style={styles.detailLabel}>Payment</Text>
                  <Text style={[styles.detailValue, { color: payCfg?.color }]}>{payCfg?.label}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {booking.status === "confirmed" && !payment && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => router.push(`/payment/${booking.id}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="card-outline" size={20} color="#fff" />
            <Text style={styles.payBtnText}>Proceed to Payment</Text>
          </TouchableOpacity>
        )}

        {booking.status === "rejected" && (
          <View style={styles.rejectedNote}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.danger} />
            <Text style={styles.rejectedNoteText}>Your booking was rejected. Please contact the hotel for more information.</Text>
          </View>
        )}
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
  content: { padding: 20, gap: 20 },
  statusCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  bookingId: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  createdAt: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  detailCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  detailLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.border, marginHorizontal: 14 },
  datesCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateBox: { alignItems: "center", gap: 4 },
  dateBoxLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  dateBoxDate: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  dateBoxYear: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  nightsBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  nightsText: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  nightsLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.success,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  rejectedNote: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
  rejectedNoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.danger,
    lineHeight: 20,
  },
});
