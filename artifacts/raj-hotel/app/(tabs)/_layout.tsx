import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const isAdmin = user.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#fff",
          borderTopWidth: 0,
          elevation: 0,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.light.border }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color }) => <Ionicons name="bed-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: "Food",
          tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons name="shield-outline" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
