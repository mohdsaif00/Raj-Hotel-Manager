import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Image,
  FlatList,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import { api, Room, BookingWithDetails, PaymentWithDetails, Order } from "@/lib/api";
import Colors from "@/constants/colors";
import { Platform } from "react-native";

type AdminTab = "dashboard" | "rooms" | "bookings" | "payments" | "orders";

function StatCard({ icon, color, bg, value, label }: { icon: any; color: string; bg: string; value: string | number; label: string }) {
  return (
    <View style={[statStyles.card, { borderLeftColor: color }]}>
      <View style={[statStyles.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={statStyles.value}>{value}</Text>
        <Text style={statStyles.label}>{label}</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    flex: 1,
    minWidth: "45%",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});

function RoomModal({ visible, room, onClose, onSave }: {
  visible: boolean;
  room: Room | null;
  onClose: () => void;
  onSave: (data: Partial<Room>, imageBase64?: string) => void;
}) {
  const [title, setTitle] = useState(room?.title || "");
  const [desc, setDesc] = useState(room?.description || "");
  const [price, setPrice] = useState(String(room?.price || ""));
  const [available, setAvailable] = useState(room?.isAvailable !== false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  React.useEffect(() => {
    setTitle(room?.title || "");
    setDesc(room?.description || "");
    setPrice(String(room?.price || ""));
    setAvailable(room?.isAvailable !== false);
    setImageUri(null);
    setImageBase64(null);
  }, [room, visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      if (result.assets[0].base64) {
        setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    }
  };

  const handleSave = () => {
    if (!title.trim() || !desc.trim() || !price) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    onSave({ title: title.trim(), description: desc.trim(), price: parseFloat(price), isAvailable: available }, imageBase64 || undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{room ? "Edit Room" : "Add Room"}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.content}>
          <TouchableOpacity style={modalStyles.imageBtn} onPress={pickImage} activeOpacity={0.85}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={modalStyles.previewImg} resizeMode="cover" />
            ) : room?.imageUrl ? (
              <Image source={{ uri: room.imageUrl }} style={modalStyles.previewImg} resizeMode="cover" />
            ) : (
              <View style={modalStyles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                <Text style={modalStyles.imagePlaceholderText}>Add Room Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Room Title</Text>
            <TextInput style={modalStyles.input} value={title} onChangeText={setTitle} placeholder="e.g., Deluxe Suite" placeholderTextColor={Colors.light.textMuted} />
          </View>
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Description</Text>
            <TextInput style={[modalStyles.input, modalStyles.textarea]} value={desc} onChangeText={setDesc} placeholder="Describe the room..." placeholderTextColor={Colors.light.textMuted} multiline numberOfLines={3} />
          </View>
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Price per Night (₹)</Text>
            <TextInput style={modalStyles.input} value={price} onChangeText={setPrice} placeholder="2999" placeholderTextColor={Colors.light.textMuted} keyboardType="numeric" />
          </View>
          <View style={modalStyles.switchRow}>
            <Text style={modalStyles.label}>Available</Text>
            <Switch value={available} onValueChange={setAvailable} trackColor={{ true: Colors.success, false: Colors.light.border }} thumbColor="#fff" />
          </View>
          <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={modalStyles.saveBtnText}>{room ? "Save Changes" : "Add Room"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  imageBtn: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: "dashed",
    height: 180,
  },
  previewImg: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.primary },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  textarea: { height: 90, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

export default function AdminScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: api.analytics.get,
  });
  const { data: rooms, refetch: refetchRooms, isRefetching: roomsRefetching } = useQuery({
    queryKey: ["rooms"],
    queryFn: api.rooms.list,
  });
  const { data: bookings, refetch: refetchBookings, isRefetching: bookingsRefetching } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings.list,
  });
  const { data: payments, refetch: refetchPayments, isRefetching: paymentsRefetching } = useQuery({
    queryKey: ["payments"],
    queryFn: api.payments.list,
  });
  const { data: orders, refetch: refetchOrders, isRefetching: ordersRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: api.orders.list,
  });

  const createRoomMutation = useMutation({
    mutationFn: async ({ data, imageBase64 }: { data: Partial<Room>; imageBase64?: string }) => {
      if (imageBase64) {
        const uploaded = await api.upload.image(imageBase64, "rooms");
        data.imageUrl = uploaded.url;
      }
      return api.rooms.create(data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rooms"] }); queryClient.invalidateQueries({ queryKey: ["analytics"] }); setRoomModal(false); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data, imageBase64 }: { id: number; data: Partial<Room>; imageBase64?: string }) => {
      if (imageBase64) {
        const uploaded = await api.upload.image(imageBase64, "rooms");
        data.imageUrl = uploaded.url;
      }
      return api.rooms.update(id, data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rooms"] }); queryClient.invalidateQueries({ queryKey: ["analytics"] }); setRoomModal(false); setEditingRoom(null); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => api.rooms.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rooms"] }); queryClient.invalidateQueries({ queryKey: ["analytics"] }); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.bookings.update(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); queryClient.invalidateQueries({ queryKey: ["analytics"] }); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.payments.update(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["analytics"] }); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.orders.update(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const handleSaveRoom = (data: Partial<Room>, imageBase64?: string) => {
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data, imageBase64 });
    } else {
      createRoomMutation.mutate({ data, imageBase64 });
    }
  };

  const handleDeleteRoom = (room: Room) => {
    Alert.alert("Delete Room", `Delete "${room.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteRoomMutation.mutate(room.id) },
    ]);
  };

  const TABS: { key: AdminTab; icon: any; label: string }[] = [
    { key: "dashboard", icon: "grid-outline", label: "Dashboard" },
    { key: "rooms", icon: "bed-outline", label: "Rooms" },
    { key: "bookings", icon: "calendar-outline", label: "Bookings" },
    { key: "payments", icon: "card-outline", label: "Payments" },
    { key: "orders", icon: "restaurant-outline", label: "Orders" },
  ];

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.tabContent, { paddingBottom: 40 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={analyticsLoading} onRefresh={refetchAnalytics} tintColor={Colors.primary} />}
    >
      <View style={styles.adminProfile}>
        <View style={styles.adminAvatar}>
          <Ionicons name="person" size={28} color="#fff" />
        </View>
        <View>
          <Text style={styles.adminName}>{user?.name}</Text>
          <Text style={styles.adminRole}>Hotel Administrator</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert("Logout", "Sign out?", [{ text: "Cancel", style: "cancel" }, { text: "Sign Out", style: "destructive", onPress: logout }])}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {analyticsLoading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : (
        <>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="calendar-outline" color={Colors.primary} bg="#EEF2FF" value={analytics?.totalBookings || 0} label="Total Bookings" />
            <StatCard icon="cash-outline" color={Colors.success} bg="#F0FDF4" value={`₹${(analytics?.totalRevenue || 0).toLocaleString()}`} label="Revenue" />
            <StatCard icon="bed-outline" color={Colors.accent} bg="#FFFBEB" value={analytics?.activeRooms || 0} label="Active Rooms" />
            <StatCard icon="time-outline" color={Colors.warning} bg="#FFFBEB" value={analytics?.pendingPayments || 0} label="Pending Payments" />
          </View>

          {analytics && analytics.monthlyRevenue.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Monthly Revenue</Text>
              <View style={styles.barChart}>
                {analytics.monthlyRevenue.slice(-6).map((r) => {
                  const max = Math.max(...analytics.monthlyRevenue.map((x) => x.revenue), 1);
                  const h = Math.max(4, (r.revenue / max) * 100);
                  return (
                    <View key={r.month} style={styles.barItem}>
                      <Text style={styles.barValue}>₹{r.revenue >= 1000 ? `${Math.round(r.revenue / 1000)}k` : r.revenue}</Text>
                      <View style={[styles.bar, { height: h }]} />
                      <Text style={styles.barLabel}>{r.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {analytics && analytics.bookingTrends.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Booking Trends</Text>
              <View style={styles.barChart}>
                {analytics.bookingTrends.slice(-6).map((r) => {
                  const max = Math.max(...analytics.bookingTrends.map((x) => x.count), 1);
                  const h = Math.max(4, (r.count / max) * 100);
                  return (
                    <View key={r.month} style={styles.barItem}>
                      <Text style={styles.barValue}>{r.count}</Text>
                      <View style={[styles.bar, { height: h, backgroundColor: Colors.accent }]} />
                      <Text style={styles.barLabel}>{r.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderRooms = () => (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingRoom(null); setRoomModal(true); }} activeOpacity={0.85}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Add Room</Text>
      </TouchableOpacity>
      <FlatList
        data={rooms || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.tabContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={roomsRefetching} onRefresh={refetchRooms} tintColor={Colors.primary} />}
        renderItem={({ item: room }) => (
          <View style={styles.adminCard}>
            <View style={styles.adminCardLeft}>
              {room.imageUrl ? (
                <Image source={{ uri: room.imageUrl }} style={styles.roomThumb} />
              ) : (
                <View style={[styles.roomThumb, styles.roomThumbPlaceholder]}>
                  <Ionicons name="bed-outline" size={20} color={Colors.light.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.adminCardTitle} numberOfLines={1}>{room.title}</Text>
                <Text style={styles.adminCardSub}>₹{room.price.toLocaleString()}/night</Text>
                <View style={[styles.miniTag, { backgroundColor: room.isAvailable ? "#DCFCE7" : "#FEE2E2" }]}>
                  <Text style={[styles.miniTagText, { color: room.isAvailable ? Colors.success : Colors.danger }]}>
                    {room.isAvailable ? "Available" : "Booked"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.adminCardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingRoom(room); setRoomModal(true); }}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRoom(room)}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="bed-outline" size={40} color={Colors.light.textMuted} /><Text style={styles.emptyText}>No rooms yet</Text></View>}
      />
    </View>
  );

  const STATUS_COLORS: Record<string, string> = {
    pending: Colors.warning, confirmed: Colors.success, rejected: Colors.danger,
    approved: Colors.success, delivered: Colors.success,
  };

  const renderBookings = () => (
    <FlatList
      data={bookings || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.tabContent, { paddingBottom: 40 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={bookingsRefetching} onRefresh={refetchBookings} tintColor={Colors.primary} />}
      renderItem={({ item: b }) => (
        <View style={styles.adminCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.adminCardHeader}>
              <Text style={styles.adminCardTitle} numberOfLines={1}>{b.room?.title || "Room"}</Text>
              <View style={[styles.miniTag, { backgroundColor: STATUS_COLORS[b.status] + "22" }]}>
                <Text style={[styles.miniTagText, { color: STATUS_COLORS[b.status] }]}>{b.status}</Text>
              </View>
            </View>
            <Text style={styles.adminCardSub}>{b.user?.name} • {b.checkIn} to {b.checkOut}</Text>
          </View>
          {b.status === "pending" && (
            <View style={styles.actionBtns}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => updateBookingMutation.mutate({ id: b.id, status: "confirmed" })}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => updateBookingMutation.mutate({ id: b.id, status: "rejected" })}>
                <Ionicons name="close" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="calendar-outline" size={40} color={Colors.light.textMuted} /><Text style={styles.emptyText}>No bookings</Text></View>}
    />
  );

  const renderPayments = () => (
    <FlatList
      data={payments || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.tabContent, { paddingBottom: 40 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={paymentsRefetching} onRefresh={refetchPayments} tintColor={Colors.primary} />}
      renderItem={({ item: p }) => (
        <View style={styles.adminCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.adminCardHeader}>
              <Text style={styles.adminCardTitle}>{p.booking?.room?.title || "Room"}</Text>
              <View style={[styles.miniTag, { backgroundColor: STATUS_COLORS[p.status] + "22" }]}>
                <Text style={[styles.miniTagText, { color: STATUS_COLORS[p.status] }]}>{p.status}</Text>
              </View>
            </View>
            <Text style={styles.adminCardSub}>{p.booking?.user?.name} • ₹{p.amount.toLocaleString()}</Text>
            {p.screenshotUrl && (
              <TouchableOpacity onPress={() => Alert.alert("Screenshot", p.screenshotUrl || "")}>
                <Text style={styles.viewScreenshot}>View Screenshot</Text>
              </TouchableOpacity>
            )}
          </View>
          {p.status === "pending" && (
            <View style={styles.actionBtns}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => updatePaymentMutation.mutate({ id: p.id, status: "approved" })}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => updatePaymentMutation.mutate({ id: p.id, status: "rejected" })}>
                <Ionicons name="close" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="card-outline" size={40} color={Colors.light.textMuted} /><Text style={styles.emptyText}>No payments</Text></View>}
    />
  );

  const renderOrders = () => (
    <FlatList
      data={orders || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.tabContent, { paddingBottom: 40 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={ordersRefetching} onRefresh={refetchOrders} tintColor={Colors.primary} />}
      renderItem={({ item: o }) => (
        <View style={styles.adminCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.adminCardHeader}>
              <Text style={styles.adminCardTitle}>{o.itemName}</Text>
              <View style={[styles.miniTag, { backgroundColor: STATUS_COLORS[o.status] + "22" }]}>
                <Text style={[styles.miniTagText, { color: STATUS_COLORS[o.status] }]}>{o.status}</Text>
              </View>
            </View>
            <Text style={styles.adminCardSub}>₹{o.price} • {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</Text>
          </View>
          {o.status === "pending" && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => updateOrderMutation.mutate({ id: o.id, status: "delivered" })}>
              <Ionicons name="checkmark" size={16} color={Colors.success} />
            </TouchableOpacity>
          )}
        </View>
      )}
      ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="restaurant-outline" size={40} color={Colors.light.textMuted} /><Text style={styles.emptyText}>No orders</Text></View>}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? "#fff" : Colors.light.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === tab.key && styles.tabItemTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "rooms" && renderRooms()}
      {activeTab === "bookings" && renderBookings()}
      {activeTab === "payments" && renderPayments()}
      {activeTab === "orders" && renderOrders()}

      <RoomModal
        visible={roomModal}
        room={editingRoom}
        onClose={() => { setRoomModal(false); setEditingRoom(null); }}
        onSave={handleSaveRoom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  tabBar: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabItemText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  tabItemTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  tabContent: {
    padding: 20,
    gap: 12,
  },
  adminProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  adminAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  adminName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  adminRole: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginTop: 4,
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chartSection: {
    gap: 10,
    marginTop: 4,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 16,
    minHeight: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barValue: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  bar: {
    width: "100%",
    maxWidth: 30,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-end",
    margin: 20,
    marginBottom: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  adminCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  adminCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  adminCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    flex: 1,
  },
  adminCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  adminCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  roomThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  roomThumbPlaceholder: {
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  miniTag: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  miniTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtns: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  viewScreenshot: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
  },
});
