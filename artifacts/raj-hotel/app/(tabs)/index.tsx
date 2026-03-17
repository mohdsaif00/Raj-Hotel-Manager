import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api, Room } from "@/lib/api";
import Colors from "@/constants/colors";

function RoomCard({ room }: { room: Room }) {
  return (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/room/${room.id}`)}
      activeOpacity={0.9}
    >
      {room.imageUrl ? (
        <Image source={{ uri: room.imageUrl }} style={styles.roomImage} />
      ) : (
        <View style={[styles.roomImage, styles.roomImagePlaceholder]}>
          <Ionicons name="bed-outline" size={32} color={Colors.light.textMuted} />
        </View>
      )}
      <View style={styles.roomInfo}>
        <Text style={styles.roomTitle} numberOfLines={1}>{room.title}</Text>
        <Text style={styles.roomPrice}>₹{room.price.toLocaleString()}<Text style={styles.roomPriceUnit}>/night</Text></Text>
        <View style={[styles.availBadge, { backgroundColor: room.isAvailable ? "#DCFCE7" : "#FEE2E2" }]}>
          <View style={[styles.availDot, { backgroundColor: room.isAvailable ? Colors.success : Colors.danger }]} />
          <Text style={[styles.availText, { color: room.isAvailable ? Colors.success : Colors.danger }]}>
            {room.isAvailable ? "Available" : "Booked"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: api.rooms.list,
  });

  const availableRooms = rooms?.filter((r) => r.isAvailable) || [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push("/(tabs)/bookings")}>
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerLabel}>Raj Hotel</Text>
            <Text style={styles.bannerTitle}>Experience Luxury{"\n"}Like Never Before</Text>
            <Text style={styles.bannerSub}>Premium rooms starting at ₹2,999/night</Text>
            <TouchableOpacity
              style={styles.bannerBtn}
              onPress={() => router.push("/(tabs)/rooms")}
              activeOpacity={0.85}
            >
              <Text style={styles.bannerBtnText}>Explore Rooms</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.bannerDecor}>
            <Ionicons name="business" size={80} color="rgba(255,255,255,0.15)" />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="bed-outline" size={22} color={Colors.accent} />
          <Text style={styles.statNumber}>{rooms?.length || 0}</Text>
          <Text style={styles.statLabel}>Rooms</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
          <Text style={styles.statNumber}>{availableRooms.length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={22} color={Colors.warning} />
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Rooms</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/rooms")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : availableRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={40} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>No rooms available</Text>
          </View>
        ) : (
          <FlatList
            data={availableRooms.slice(0, 5)}
            renderItem={({ item }) => <RoomCard room={item} />}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, gap: 12 }}
            scrollEnabled={availableRooms.length > 1}
          />
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/rooms")} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="bed-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Book Room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/food")} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="restaurant-outline" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionLabel}>Order Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/bookings")} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="calendar-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionLabel}>My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/bookings")} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: "#FFF1F2" }]}>
              <Ionicons name="card-outline" size={24} color={Colors.danger} />
            </View>
            <Text style={styles.actionLabel}>Payments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginTop: 2,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    lineHeight: 30,
    marginBottom: 8,
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  bannerDecor: {
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  roomCard: {
    width: 200,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginRight: 4,
  },
  roomImage: {
    width: "100%",
    height: 120,
  },
  roomImagePlaceholder: {
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  roomInfo: {
    padding: 12,
    gap: 6,
  },
  roomTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  roomPrice: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  roomPriceUnit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    fontFamily: "Inter_400Regular",
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },
  actionCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    textAlign: "center",
  },
});
