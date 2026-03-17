import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, Room } from "@/lib/api";
import Colors from "@/constants/colors";

function RoomCard({ room }: { room: Room }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/room/${room.id}`)}
      activeOpacity={0.9}
    >
      {room.imageUrl ? (
        <Image source={{ uri: room.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="bed-outline" size={40} color={Colors.light.textMuted} />
        </View>
      )}
      <View style={[styles.availTag, { backgroundColor: room.isAvailable ? "#DCFCE7" : "#FEE2E2" }]}>
        <Text style={[styles.availTagText, { color: room.isAvailable ? Colors.success : Colors.danger }]}>
          {room.isAvailable ? "Available" : "Unavailable"}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{room.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{room.description}</Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardPrice}>₹{room.price.toLocaleString()}</Text>
            <Text style={styles.cardPriceSub}>per night</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push(`/room/${room.id}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>View</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "booked">("all");

  const { data: rooms, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["rooms"],
    queryFn: api.rooms.list,
  });

  const filtered = (rooms || []).filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "available" ? r.isAvailable : !r.isAvailable);
    return matchSearch && matchFilter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>Our Rooms</Text>
        <Text style={styles.headerSub}>{rooms?.length || 0} rooms available</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.light.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search rooms..."
            placeholderTextColor={Colors.light.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["all", "available", "booked"] as const).map((f) => (
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
          renderItem={({ item }) => <RoomCard room={item} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bed-outline" size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No rooms found</Text>
              <Text style={styles.emptyText}>Try a different search or filter</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.background,
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
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
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
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: 200,
  },
  cardImagePlaceholder: {
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  availTag: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  availTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  cardBody: {
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  cardPrice: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  cardPriceSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  bookBtnText: {
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
});
