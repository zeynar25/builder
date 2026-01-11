import React, { useEffect, useState } from "react";
import {
  View,
  Alert,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
  Modal,
  DeviceEventEmitter,
} from "react-native";
import { Text, Button, Card } from "react-native-paper";

import { globalStyles } from "@/src/globalstyles";
import { theme } from "@/src/theme";
import PageHeader from "@/src/components/PageHeader";
import PageFiller from "@/src/components/PageFiller";

import { Feather } from "@expo/vector-icons";
import { API_BASE_URL } from "../../src/config";
import isTokenValid from "../../src/useAuthGuard";
import apiFetch from "../../src/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getImageSource } from "../../src/imageMap";

const { width: screenWidth } = Dimensions.get("window");
const { height: screenHeight } = Dimensions.get("window");

const defaultTile = require("../../assets/images/road-connectors/default-tile.png");

export default function Account() {
  const router = useRouter();
  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGameName, setEditingGameName] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [savingGameName, setSavingGameName] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAccountDetail() {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          router.replace("/welcome");
          return;
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
          const detailRes = await apiFetch(
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("accountEmail");
        if (!cancelled) {
          setEmail(storedEmail);
        }
      } catch {
        if (!cancelled) {
          setEmail(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep header chrons in sync when other screens emit chronUpdated
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("chronUpdated", async () => {
      try {
        const accountDetailId = await AsyncStorage.getItem("accountDetailId");
        if (!accountDetailId) return;
        const detailRes = await apiFetch(
          `${API_BASE_URL}/api/account-detail/${accountDetailId}`
        );
        if (!detailRes.ok) return;
        const detailJson = await detailRes.json();
        setAccountDetail(detailJson);
      } catch {
        // ignore refresh errors
      }
    });
    return () => sub.remove();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch(`${API_BASE_URL}/api/account/signout`, {
        method: "POST",
      });
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
      const res = await apiFetch(
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

  async function handleSelectAvatar(filename: string) {
    if (savingAvatar) return;
    setSavingAvatar(true);
    try {
      const accountDetailId = await AsyncStorage.getItem("accountDetailId");
      if (!accountDetailId) throw new Error("no_accountDetailId");

      const res = await apiFetch(
        `${API_BASE_URL}/api/account-detail/${accountDetailId}/avatar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: filename }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Request failed (${res.status})`);
      }

      const json = await res.json();
      setAccountDetail(json);
      setAvatarModalVisible(false);
      Alert.alert("Success", "Profile picture updated!");
    } catch (e: any) {
      Alert.alert("Unable to update avatar", e.message || String(e));
    } finally {
      setSavingAvatar(false);
    }
  }

  function handleAvatarPress(filename: string) {
    if (savingAvatar) return;
    Alert.alert("Change avatar", "Do you want to use this avatar?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => handleSelectAvatar(filename) },
    ]);
  }

  if (loading) {
    return (
      <View
        style={[
          globalStyles.page,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
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

  const profileImg = `../../assets/images/profiles/${accountDetail?.accountDetail?.imageUrl}`;

  const avatarFiles = ["1.png", "2.png", "3.png", "4.png", "5.png"];

  return (
    <View style={globalStyles.page}>
      {/* Sticky Header */}
      <PageHeader accountDetail={accountDetail} />

      <PageFiller />

      <View style={styles.pageContainer}>
        <View style={styles.accountDetails}>
          <Pressable
            onPress={() => setAvatarModalVisible(true)}
            disabled={savingAvatar}
          >
            <View style={styles.imageContainer}>
              <Image
                source={getImageSource(profileImg) || defaultTile}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: theme.radii.pill,
                }}
                resizeMode="cover"
              />
            </View>
          </Pressable>

          {editingGameName ? (
            <View
              style={[
                styles.editNameActive,
                { width: "75%", alignSelf: "center" },
              ]}
            >
              <TextInput
                value={newGameName}
                onChangeText={setNewGameName}
                style={{
                  borderWidth: 0,
                  borderBottomWidth: 1,
                  borderColor: theme.colors.highlight,
                  flex: 1,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  color: theme.colors.text.secondary,
                  textAlign: "center",
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
                <Feather
                  name="x"
                  size={20}
                  color={theme.colors.text.secondary}
                />
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
                <Feather
                  name="edit-3"
                  size={theme.icon.form}
                  color={theme.colors.highlight}
                />
              </Pressable>
            </View>
          )}

          <Text variant="labelLarge" style={globalStyles.variantLabel}>
            {email ?? "@Email not available"}
          </Text>
        </View>

        <Card style={styles.cardMain}>
          <Card.Content style={{ alignItems: "center" }}>
            <Text variant="titleMedium" style={globalStyles.variantBalance}>
              Builder Apples
            </Text>

            {(() => {
              const exp = accountDetail?.accountDetail?.exp ?? 0;
              const level = Math.floor(exp / 1000);

              let appleSource;
              let tierName = "Bronze Apple";

              if (level >= 4) {
                appleSource = require("../../assets/images/levels/level4-apple.png");
                tierName = "Diamond Apple";
              } else if (level === 3) {
                appleSource = require("../../assets/images/levels/level3-apple.png");
                tierName = "Golden Apple";
              } else if (level === 2) {
                appleSource = require("../../assets/images/levels/level2-apple.png");
                tierName = "Silver Apple";
              } else {
                appleSource = require("../../assets/images/levels/default-apple.png");
                tierName = "Bronze Apple";
              }

              return (
                <View style={{ alignItems: "center", width: "100%" }}>
                  <View style={styles.appleContainer}>
                    <Image
                      source={appleSource}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </View>
                  <View
                    style={{
                      backgroundColor: theme.colors.accent_2,
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.radii.pill,
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <Text
                      variant="titleMedium"
                      style={globalStyles.variantBalance}
                    >
                      Level {level} | {tierName}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={globalStyles.variantBalance}
                  >
                    {exp} XP (Next Level: {(level + 1) * 1000} XP)
                  </Text>
                </View>
              );
            })()}
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="contained"
          buttonColor={theme.colors.accent_3}
          onPress={handleLogout}
          style={{ marginTop: screenHeight * 0.02, width: "100%" }}
        >
          Log Out
        </Button>
      </View>
      <PageFiller />

      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !savingAvatar && setAvatarModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !savingAvatar && setAvatarModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text variant="titleMedium" style={globalStyles.variantLabel}>
              Choose your Avatar:
            </Text>
            <View style={styles.avatarGrid}>
              {avatarFiles.map((file) => {
                const src = getImageSource(
                  `../../assets/images/profiles/${file}`
                );
                return (
                  <Pressable
                    key={file}
                    style={[
                      styles.avatarOption,
                      accountDetail?.accountDetail?.imageUrl === file &&
                      styles.avatarOptionSelected,
                    ]}
                    onPress={() => handleAvatarPress(file)}
                    disabled={savingAvatar}
                  >
                    <Image
                      source={src || defaultTile}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                );
              })}
            </View>
            {savingAvatar && (
              <ActivityIndicator
                size="small"
                style={{ marginTop: theme.spacing.sm }}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingBottom: screenHeight * 0.016,
    alignItems: "center",
    paddingHorizontal: screenWidth * 0.06,
  },

  accountDetails: {
    flexDirection: "column",
    marginTop: theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },

  imageContainer: {
    width: screenWidth * 0.28,
    height: screenWidth * 0.28,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.support,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: screenHeight * 0.01,
    borderWidth: theme.spacing.sm,
    borderColor: theme.colors.mono,
    shadowColor: theme.colors.accent_3,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },

  cardMain: {
    flexDirection: "column",
    justifyContent: "center",
    width: "80%",
    height: "auto",
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.mono,
    borderWidth: 4,
  },

  appleContainer: {
    backgroundColor: theme.colors.mono,
    borderRadius: theme.radii.pill,
    padding: theme.spacing.xs,
    marginVertical: theme.spacing.md,
    width: screenWidth * 0.32,
    height: screenWidth * 0.32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    width: "80%",
    backgroundColor: theme.colors.mono,
    borderRadius: 20,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: theme.spacing.md,
  },
  avatarOption: {
    width: "30%",
    aspectRatio: 1,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radii.pill,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: theme.colors.mono,
  },
  avatarOptionSelected: {
    borderColor: theme.colors.accent_4,
    borderWidth: 3,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
});
