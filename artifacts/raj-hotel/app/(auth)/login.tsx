import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="business" size={40} color="#fff" />
          </View>
          <Text style={styles.hotelName}>Raj Hotel</Text>
          <Text style={styles.tagline}>Luxury. Comfort. Excellence.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor={Colors.light.textMuted}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.light.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.signupBtnText}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.background,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  hotelName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.accent,
    letterSpacing: 2,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontFamily: "Inter_400Regular",
  },
  signupBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  signupBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
