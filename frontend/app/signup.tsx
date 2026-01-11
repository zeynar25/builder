import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Keyboard,
  Platform,
  Image,
  Dimensions,
} from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../src/config";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { theme } from "@/src/theme";
import { globalStyles } from "@/src/globalstyles";

const { height: screenHeight } = Dimensions.get("window");

export default function Signup() {
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

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/account/signup`, {
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

      if (Platform.OS === "web") {
        // React Native's Alert isn't fully supported on web; use window.alert
        // and then redirect so the user sees the message.
        window.alert("Account created. Welcome!");
        router.replace("/onboarding");
      } else {
        Alert.alert("Success", "Account created. Let's get started!", [
          { text: "OK", onPress: () => router.replace("/onboarding") },
        ]);
      }
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
        <Text style={globalStyles.textTitle}>Sign Up</Text>
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

        <Pressable
          style={[
            globalStyles.primaryButton,
            styles.customButton,
            loading && globalStyles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.mono} />
          ) : (
            <Text style={globalStyles.primaryButtonText}>Create Account</Text>
          )}
        </Pressable>

        <Text style={styles.signupText}>
          Already have an account?{" "}
          <Text
            style={styles.signupLink}
            onPress={() => router.replace("/login")}
          >
            Sign in
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
  customButton: {
    marginTop: theme.spacing.xl,
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
