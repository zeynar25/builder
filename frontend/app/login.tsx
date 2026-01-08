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

      // backend may return tokens in different shapes; normalize common forms
      const accessToken =
        body?.accessToken ??
        body?.tokens?.access ??
        body?.tokens?.accessToken ??
        body?.tokens?.access_token ??
        body?.access;
      const refreshToken =
        body?.refreshToken ??
        body?.tokens?.refresh ??
        body?.tokens?.refreshToken ??
        body?.tokens?.refresh_token ??
        body?.refresh;

      if (accessToken) await AsyncStorage.setItem("accessToken", accessToken);
      if (refreshToken)
        await AsyncStorage.setItem("refreshToken", refreshToken);

      // store account id and attempt to select a default map for the user
      const accountId =
        body?.account?.id ?? body?.account?._id ?? body?.id ?? null;
      if (accountId) {
        await AsyncStorage.setItem("accountId", accountId);
        // try to pick the first map for this account and save as currentMapId
        try {
          const mapsRes = await fetch(
            `${API_BASE_URL}/api/maps/account/${accountId}`
          );
          if (mapsRes.ok) {
            const json = await mapsRes.json().catch(() => null);
            const firstMap = json?.maps?.[0];
            const firstMapId = firstMap?._id ?? firstMap?.id ?? null;
            if (firstMapId) {
              await AsyncStorage.setItem("currentMapId", firstMapId);
              console.log("firstMapId:", firstMapId);
            }
          }
        } catch {
          // ignore map fetch failures; user can pick later
        }
      }

      console.log("accountId:", accountId);
      console.log("access token:", accessToken);

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
      <Text style={styles.title}>Sign in</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        ref={passwordRef}
        style={styles.input}
        placeholder="Password"
        secureTextEntry
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>

      <View style={styles.link}>
        <Text>
          Don&apos;t have an account?{" "}
          <Text
            style={styles.linkText}
            onPress={() => router.replace("/signup")}
          >
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
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#cc0000",
    marginBottom: 8,
    textAlign: "center",
  },
  link: {
    marginTop: 12,
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
  },
});
