import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../src/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const passwordRef = useRef<TextInput | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/account/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body?.message || `Request failed (${res.status})`;
        setError(msg);
        return;
      }

      const { accessToken, refreshToken } = body || {};
      if (accessToken) await AsyncStorage.setItem("accessToken", accessToken);
      if (refreshToken)
        await AsyncStorage.setItem("refreshToken", refreshToken);

      // Navigate to root (home)
      router.replace("/");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign in</Text>
        <View style={styles.titleUnderline} />

        <Text style={styles.inputLabel}>Email or Username</Text>
        <View style={styles.inputRow}>
          <MaterialIcons name="mail-outline" size={24} color="#FFA500" />
          <TextInput
            style={styles.input}
            placeholder="demo@email.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputRow}>
          <MaterialIcons name="lock-outline" size={24} color="#FFA500" />
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="enter your password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={() => {
              handleSubmit();
              passwordRef.current?.blur();
              Keyboard.dismiss();
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="#666"
            />
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.optionsRow}>
          <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxRow}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <MaterialIcons name="check" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </Pressable>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        <Text style={styles.signupText}>
          Don&apos;t have an Account?{" "}
          <Text style={styles.signupLink} onPress={() => router.replace("/signup")}>
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFCFB",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    fontFamily: "Rubik",
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: "#FFA500",
    borderRadius: 2,
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
    alignSelf: "flex-start",
    fontFamily: "Rubik",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 24,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    fontFamily: "Rubik",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#FFA500",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#FFA500",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Rubik",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#FFA500",
    fontWeight: "500",
    fontFamily: "Rubik",
  },
  button: {
    backgroundColor: "#FFA500",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Rubik",
  },
  error: {
    color: "#cc0000",
    marginBottom: 16,
    fontSize: 14,
    fontFamily: "Rubik",
  },
  signupText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Rubik",
  },
  signupLink: {
    color: "#FFA500",
    fontWeight: "500",
  },
});
