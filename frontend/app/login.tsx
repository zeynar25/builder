import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Image,
  Dimensions,
} from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../src/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { theme } from "@/src/theme";
import { globalStyles } from "@/src/globalstyles";

const { height: screenHeight } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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

      // backend may return tokens in different shapes; normalize common forms
      const accessToken =
        body?.accessToken ??
        body?.tokens?.access ??
        body?.tokens?.accessToken ??
        body?.tokens?.access_token ??
        body?.access;

      if (accessToken) await AsyncStorage.setItem("accessToken", accessToken);

      // store account id and attempt to select a default map for the user
      const accountId =
        body?.account?.id ?? body?.account?._id ?? body?.id ?? null;

      const accountDetailId =
        body?.account?.detailId ??
        body?.account?.accountDetailId ??
        body?.account?.accountDetail ??
        body?.accountDetailId ??
        body?.accountDetail ??
        null;

      if (accountId) {
        await AsyncStorage.setItem("accountId", accountId);

        if (accountDetailId) {
          await AsyncStorage.setItem("accountDetailId", accountDetailId);
        }

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

      // Navigate to the tabs index screen
      router.replace("/");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Animated.View style={[globalStyles.main, animatedStyle]}>
      <View style={styles.headerContainer}>
        <Image
          source={require("../assets/images/Vector.png")}
          style={styles.headerImage}
          resizeMode="stretch"
        />
      </View>

      <View style={[globalStyles.userform, styles.formWithHeaderOffset]}>
        <Text style={globalStyles.textTitle}>Sign In</Text>
        <View style={globalStyles.titleUnderline} />

        <Text style={globalStyles.TextLabel}>Email or Username</Text>
        <View style={globalStyles.inputContainer}>
          <Feather
            name="mail"
            size={theme.icon.form}
            color={theme.colors.highlight}
          />

          <TextInput
            style={globalStyles.textInput}
            placeholder="demo@email.com"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={globalStyles.TextLabel}>Password</Text>
        <View style={globalStyles.inputContainer}>
          <Feather
            name="lock"
            size={theme.icon.form}
            color={theme.colors.highlight}
          />
          <TextInput
            ref={passwordRef}
            style={globalStyles.textInput}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.text.secondary}
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
              size={theme.icon.form}
              color={theme.colors.accent_1}
            />
          </Pressable>
        </View>

        {error && <Text style={globalStyles.textError}>{error}</Text>}

        <View style={styles.optionsRow}>
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.checkboxRow}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            >
              {rememberMe && (
                <Feather
                  name="check"
                  size={theme.icon.form}
                  color={theme.colors.mono}
                />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </Pressable>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </View>

        <Pressable
          style={[
            globalStyles.primaryButton,
            loading && globalStyles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.mono} />
          ) : (
            <Text style={globalStyles.primaryButtonText}>Login</Text>
          )}
        </Pressable>

        <Text style={styles.signupText}>
          Don&apos;t have an Account?{" "}
          <Text
            style={styles.signupLink}
            onPress={() => router.replace("/signup")}
          >
            Sign up
          </Text>
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.4,
    overflow: "hidden",
  },

  headerImage: {
    width: "100%",
    height: screenHeight * 0.4,
    position: "absolute",
    bottom: 0,
  },

  formWithHeaderOffset: {
    marginTop: 80,
  },

  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: theme.icon.form,
    height: theme.icon.form,
    borderWidth: 1,
    borderColor: theme.colors.highlight,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  checkboxChecked: {
    backgroundColor: theme.colors.highlight,
  },

  checkboxLabel: {
    fontSize: theme.typography.fontSize.detail,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },

  forgotPassword: {
    fontSize: theme.typography.fontSize.detail,
    color: theme.colors.highlight,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },

  signupText: {
    fontSize: theme.typography.fontSize.text,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: "center",
    width: "100%",
  },

  signupLink: {
    color: theme.colors.highlight,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
