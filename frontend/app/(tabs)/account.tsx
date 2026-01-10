import React, { useEffect, useState } from "react";
import { View, Alert, TextInput, Pressable, ActivityIndicator, Image } from "react-native";
import { Text, Button } from "react-native-paper";

import { globalStyles } from "@/src/globalstyles";
import { theme } from "@/src/theme";

import { StyleSheet } from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../src/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const chronIcon = require("../../assets/images/chrons.png");

export default function Account() {
  const router = useRouter();
  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGameName, setEditingGameName] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [savingGameName, setSavingGameName] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchAccountDetail() {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        // Validate token expiry
        function isTokenValid(tok: string | null) {
          if (!tok) return false;
          try {
            const parts = tok.split(".");
            if (parts.length !== 3) return false;
            const payload = parts[1];
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
              atob(base64)
                .split("")
                .map(function (c) {
                  return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
            );
            const obj = JSON.parse(json);
            if (!obj.exp) return false;
            return obj.exp * 1000 > Date.now();
          } catch {
            return false;
          }
        }

        if (!isTokenValid(token)) {
          await AsyncStorage.removeItem("accessToken");
          Alert.alert(
            "Session expired",
            "Your session has expired and you have been logged out. Please sign in again.",
            [{ text: "OK", onPress: () => router.replace("/login") }]
          );
          return;
        }

        const accountDetailId = await AsyncStorage.getItem("accountDetailId");
        if (accountDetailId) {
          const detailRes = await fetch(
            `${API_BASE_URL}/api/account-detail/${accountDetailId}`
          );

          if (!detailRes.ok) {
            const errBody = await detailRes.json().catch(() => null);
            throw new Error(
              errBody?.error ||
              `Failed to fetch account details (${detailRes.status})`
            );
          }
          const detailJson = await detailRes.json();
          if (!cancelled) {
            setAccountDetail(detailJson);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAccountDetail();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await fetch(`${API_BASE_URL}/api/account/signout`, { method: "POST" });
    } catch {
      // ignore network errors; continue clearing client state
    }
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("accountId");
    await AsyncStorage.removeItem("accountDetailId");
    await AsyncStorage.removeItem("currentMapId");
    router.replace("/login");
  }

  async function handleSaveGameName() {
    if (!newGameName) return Alert.alert("Please enter a name");
    setSavingGameName(true);
    try {
      const accountDetailId = await AsyncStorage.getItem("accountDetailId");
      if (!accountDetailId) throw new Error("no_accountDetailId");
      const res = await fetch(
        `${API_BASE_URL}/api/account-detail/${accountDetailId}/game-name`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameName: newGameName }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      setAccountDetail(json);
      setEditingGameName(false);
      Alert.alert("Success", "Game name updated successfully!");
    } catch (e: any) {
      Alert.alert("Unable to save", e.message || String(e));
    } finally {
      setSavingGameName(false);
    }
  }

  if (loading) {
    return (
      <View style={[globalStyles.page, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={globalStyles.page}>
        <Text style={{ color: "#EF4444", padding: 16 }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.page}>
      {/* Sticky Header */}
      <View style={globalStyles.pageHeader}>
        <View style={globalStyles.headerContent}>
          <View style={globalStyles.accountInfoContainer}>
            <Text variant="titleMedium" style={globalStyles.variantAccountName}>
              {accountDetail?.accountDetail?.gameName || "Player"}
            </Text>
            <Text variant="bodyMedium" style={globalStyles.variantLabel}>
              {accountDetail?.account?.email || ""}Hinde nalabas email sads
            </Text>
          </View>

          <View style={globalStyles.chronContainer}>
            <Image
              source={chronIcon}
              style={{ width: 16, height: 16, marginRight: 6 }}
              resizeMode="contain"
            />
            <Text variant="titleSmall" style={globalStyles.variantBalance}>
              {accountDetail?.accountDetail?.chron ?? 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={globalStyles.pageFiller} />

      <View>
        <View style={styles.account}>
          <View style={{ alignItems: "center", marginBottom: theme.spacing.md }}>
            <View
              style={{
                width: 124,
                height: 124,
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.support,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 4,
                borderColor: theme.colors.mono,
                shadowColor: theme.colors.accent_2,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Image
                source={require("../../assets/images/default-profile.png")}
                style={{ width: "100%", height: "100%", borderRadius: 50 }}
                resizeMode="cover"
              />
            </View>
          </View>

          {editingGameName ? (
            <View style={styles.editNameActive}>

              <TextInput
                value={newGameName}
                onChangeText={setNewGameName}
                placeholder="Enter your Name"
                style={{
                  borderWidth: 0,
                  borderBottomWidth: 1,
                  borderColor: theme.colors.highlight,
                  flex: 1,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  color: theme.colors.text.secondary,
                }}
                editable={!savingGameName}
              />
              <Pressable
                onPress={handleSaveGameName}
                style={{ padding: 8, marginLeft: 8 }}
                disabled={savingGameName}
              >
                <Feather name="check" size={20} color="#11aa49" />
              </Pressable>
              <Pressable
                onPress={() => setEditingGameName(false)}
                style={{ padding: 8, marginLeft: 8 }}
                disabled={savingGameName}
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.editNameInactive}>
              <Text variant="titleLarge" style={globalStyles.variantProfile}>
                {accountDetail?.accountDetail?.gameName || "Not set"}
              </Text>
              <Pressable
                onPress={() => {
                  setNewGameName(accountDetail?.accountDetail?.gameName ?? "");
                  setEditingGameName(true);
                }}
                style={{ padding: 6 }}
              >
                <Feather name="edit-3" size={theme.icon.form} color={theme.colors.highlight} />
              </Pressable>
            </View>
          )}
          <Text variant="labelLarge" style={globalStyles.variantLabel}>
            {accountDetail?.account?.email || "@Email not available"}
          </Text>

          
        </View>

        {/* Account Info */}
        <View style={{ marginTop: theme.spacing.xl }}>
          

          <Text>
            Level: {Math.floor((accountDetail?.accountDetail?.exp ?? 0) / 100)}
          </Text>
          <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
            ({accountDetail?.accountDetail?.exp ?? 0} XP)
          </Text>
        </View>

        {/* Logout Button */}
        <Button
          mode="contained"
          buttonColor="#FF5252"
          onPress={handleLogout}
          style={{ marginTop: 24 }}
        >
          Sign Out
        </Button>
      </View>

      <View style={globalStyles.pageFiller} />
    </View>
  );
}

const styles = StyleSheet.create({

  account: {
    flexDirection: "column",
    marginTop: theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },

  editNameActive: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },

  editNameInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  }
});
