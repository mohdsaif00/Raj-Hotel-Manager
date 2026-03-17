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
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Order } from "@/lib/api";
import Colors from "@/constants/colors";
import { Platform } from "react-native";

const MENU = [
  { category: "Breakfast", items: [
    { name: "Continental Breakfast", price: 299, icon: "cafe-outline" as const, desc: "Toast, eggs, juice & coffee" },
    { name: "Full English Breakfast", price: 449, icon: "sunny-outline" as const, desc: "Complete breakfast platter" },
    { name: "Idli Vada Sambar", price: 199, icon: "leaf-outline" as const, desc: "South Indian classic" },
  ]},
  { category: "Main Course", items: [
    { name: "Butter Chicken", price: 399, icon: "flame-outline" as const, desc: "Creamy tomato curry" },
    { name: "Paneer Tikka Masala", price: 349, icon: "leaf-outline" as const, desc: "Cottage cheese in spiced gravy" },
    { name: "Grilled Salmon", price: 599, icon: "fish-outline" as const, desc: "With herb butter & veggies" },
    { name: "Club Sandwich", price: 249, icon: "restaurant-outline" as const, desc: "Triple decker classic" },
  ]},
  { category: "Beverages", items: [
    { name: "Fresh Juice", price: 129, icon: "nutrition-outline" as const, desc: "Orange, Apple, or Watermelon" },
    { name: "Masala Chai", price: 79, icon: "cafe-outline" as const, desc: "Spiced Indian tea" },
    { name: "Cold Coffee", price: 149, icon: "snow-outline" as const, desc: "Chilled coffee delight" },
  ]},
  { category: "Desserts", items: [
    { name: "Gulab Jamun", price: 149, icon: "star-outline" as const, desc: "Warm milk dumplings in syrup" },
    { name: "Chocolate Lava Cake", price: 219, icon: "heart-outline" as const, desc: "With vanilla ice cream" },
  ]},
];

function MenuItem({ item, onOrder }: { item: { name: string; price: number; icon: any; desc: string }; onOrder: () => void }) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={item.icon} size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuName}>{item.name}</Text>
          <Text style={styles.menuDesc} numberOfLines={1}>{item.desc}</Text>
        </View>
      </View>
      <View style={styles.menuItemRight}>
        <Text style={styles.menuPrice}>₹{item.price}</Text>
        <TouchableOpacity style={styles.orderBtn} onPress={onOrder} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const isDelivered = order.status === "delivered";
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderLeft}>
        <Text style={styles.orderName}>{order.itemName}</Text>
        <Text style={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderPrice}>₹{order.price}</Text>
        <View style={[styles.orderStatus, { backgroundColor: isDelivered ? "#D1FAE5" : "#FEF3C7" }]}>
          <Text style={[styles.orderStatusText, { color: isDelivered ? Colors.success : Colors.warning }]}>
            {isDelivered ? "Delivered" : "Pending"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");

  const { data: orders, isLoading: ordersLoading, refetch, isRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: api.orders.list,
  });

  const orderMutation = useMutation({
    mutationFn: ({ name, price }: { name: string; price: number }) =>
      api.orders.create(name, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert("Order Placed!", "Your order has been placed. It will be delivered soon.");
    },
    onError: (e: any) => Alert.alert("Error", e.message || "Failed to place order"),
  });

  const handleOrder = (name: string, price: number) => {
    Alert.alert(
      "Confirm Order",
      `Order ${name} for ₹${price}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Order", onPress: () => orderMutation.mutate({ name, price }) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>Room Service</Text>
        <Text style={styles.headerSub}>Order delicious food to your room</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "menu" && styles.tabActive]}
          onPress={() => setActiveTab("menu")}
          activeOpacity={0.85}
        >
          <Ionicons name="restaurant-outline" size={16} color={activeTab === "menu" ? "#fff" : Colors.light.textSecondary} />
          <Text style={[styles.tabText, activeTab === "menu" && styles.tabTextActive]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.tabActive]}
          onPress={() => setActiveTab("orders")}
          activeOpacity={0.85}
        >
          <Ionicons name="receipt-outline" size={16} color={activeTab === "orders" ? "#fff" : Colors.light.textSecondary} />
          <Text style={[styles.tabText, activeTab === "orders" && styles.tabTextActive]}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "menu" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.menuContent, { paddingBottom: 100 + insets.bottom }]}
        >
          {MENU.map((section) => (
            <View key={section.category} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.category}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, idx) => (
                  <React.Fragment key={item.name}>
                    <MenuItem
                      item={item}
                      onOrder={() => handleOrder(item.name, item.price)}
                    />
                    {idx < section.items.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        ordersLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={orders || []}
            renderItem={({ item }) => <OrderCard order={item} />}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.ordersList, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={Colors.light.textMuted} />
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptyText}>Browse the menu and order food</Text>
              </View>
            }
          />
        )
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
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  menuContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  menuDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  menuItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  menuPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  orderBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 14,
  },
  ordersList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderLeft: {
    flex: 1,
  },
  orderName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  orderTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  orderPrice: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  orderStatus: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
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
