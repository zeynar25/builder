import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  DeviceEventEmitter,
} from "react-native";

import { Card, Text, Button } from "react-native-paper";

import { API_BASE_URL } from "../../src/config";
import isTokenValid from "../../src/useAuthGuard";
import { getImageSource } from "../../src/imageMap";
import apiFetch from "../../src/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { globalStyles } from "@/src/globalstyles";
import { theme } from "@/src/theme";
import PageHeader from "@/src/components/PageHeader";
import PageFiller from "@/src/components/PageFiller";

const defaultTile = require("../../assets/images/road-connectors/default-tile.png");
const chronIcon = require("../../assets/images/chrons.png");

const { width } = Dimensions.get("window");
const padding = 16;
const gap = 16;

// Calculate card width: (total width - left/right padding - gaps between cards) / number of columns
const cardWidth = (width - padding * 2 - gap * 2) / 3;

export default function Shop() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [expandingMap, setExpandingMap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          if (!cancelled) router.replace("/welcome");
          return;
        }

        if (!isTokenValid(token)) {
          await AsyncStorage.removeItem("accessToken");
          if (!cancelled) {
            Alert.alert(
              "Session expired",
              "Your session has expired and you have been logged out. Please sign in again.",
              [{ text: "OK", onPress: () => router.replace("/welcome") }]
            );
          }
        }
      } catch {
        // ignore auth errors here; they can be handled on next interaction
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    async function fetchAccountDetail() {
      try {
        const accountDetailId = await AsyncStorage.getItem("accountDetailId");
        if (accountDetailId) {
          const detailRes = await apiFetch(
            `${API_BASE_URL}/api/account-detail/${accountDetailId}`
          );
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            setAccountDetail(detailJson);
          }
        }
      } catch (error) {
        console.error("Failed to fetch account details:", error);
      }
    }

    fetchAccountDetail();
  }, []);

  // Keep header chrons in sync when other screens (e.g. Stopwatch) emit chronUpdated
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/items`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          const baseItems = json.items ?? [];
          const mapExpansionItem = {
            id: "map-expansion",
            name: "Map Expansion",
            description: "+1 tile to width and height",
            price: 300,
            imageUrl: null,
            isMapExpansion: true,
          };
          setItems([...baseItems, mapExpansionItem]);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleBuild(item: any) {
    try {
      const payload = {
        itemId: item._id ?? item.id,
        name: item.name,
        imageUrl: item.imageUrl ?? null,
      };
      await AsyncStorage.setItem("pendingBuildItem", JSON.stringify(payload));
      router.push("/");
    } catch (e) {
      // silently ignore for now; could surface an alert if desired
      console.error(e);
    }
  }

  async function handleExpandMap() {
    if (expandingMap) return;

    try {
      setExpandingMap(true);
      const [accountDetailId, mapId] = await Promise.all([
        AsyncStorage.getItem("accountDetailId"),
        AsyncStorage.getItem("currentMapId"),
      ]);

      if (!accountDetailId || !mapId) {
        Alert.alert(
          "Cannot expand map",
          "Missing account or map information. Please re-open your map and try again."
        );
        return;
      }

      const res = await apiFetch(`${API_BASE_URL}/api/maps/${mapId}/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountDetailsId: accountDetailId }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success !== true) {
        const msg = json?.error || "Unable to expand map";
        if (msg === "insufficient_chrons") {
          Alert.alert(
            "Not enough chrons",
            "You need 300 chrons to expand your map."
          );
        } else {
          Alert.alert("Cannot expand map", msg);
        }
        return;
      }

      // Refresh account detail so header shows updated chrons
      try {
        const detailRes = await apiFetch(
          `${API_BASE_URL}/api/account-detail/${accountDetailId}`
        );
        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          setAccountDetail(detailJson);
        }
      } catch {
        // ignore refresh errors
      }

      // Notify map screen to refresh its map data
      DeviceEventEmitter.emit("mapExpanded", { mapId, accountDetailId });

      Alert.alert(
        "Map expanded",
        "Your map has been expanded by 1 tile in each direction."
      );
    } catch (e: any) {
      Alert.alert("Cannot expand map", e.message || String(e));
    } finally {
      setExpandingMap(false);
    }
  }

  function formatPrice(price: any) {
    if (price == null) return "0";
    if (typeof price === "number") return String(price);
    if (typeof price === "string") return price;
    if (typeof price === "object") {
      if ((price as any).$numberDecimal != null)
        return String((price as any).$numberDecimal);
      try {
        const s = String(price);
        if (s && s !== "[object Object]") return s;
      } catch {}
      // fallback to JSON
      try {
        return JSON.stringify(price);
      } catch {
        return String(price);
      }
    }
    return String(price);
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text>{`Error: ${error}`}</Text>
      </View>
    );

  if (!items || items.length === 0)
    return (
      <View style={styles.center}>
        <Text>No items available</Text>
      </View>
    );

  return (
    <View style={globalStyles.page}>
      {/* Sticky Header */}
      <PageHeader accountDetail={accountDetail} />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id ?? item.id ?? String(item.name)}
        numColumns={3}
        contentContainerStyle={styles.container}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View>
            <PageFiller />

            <View style={globalStyles.pageContainer}>
              <Text variant="titleLarge" style={globalStyles.variantTitle}>
                Builders Shop
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={<PageFiller />}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isLastInRow = (index + 1) % 3 === 0;
          return (
            <Card style={[styles.card, isLastInRow && styles.cardLast]}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={
                    getImageSource(item.imageUrl) ||
                    (item.imageUrl && String(item.imageUrl).startsWith("http")
                      ? { uri: item.imageUrl }
                      : defaultTile)
                  }
                  style={styles.image}
                  resizeMode="cover"
                />

                <Text variant="titleSmall" style={globalStyles.variantTitle}>
                  {item.name}
                </Text>

                {item.description ? (
                  <Text variant="bodySmall" style={globalStyles.variantLabel}>
                    {item.description}
                  </Text>
                ) : null}
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() =>
                    item.isMapExpansion ? handleExpandMap() : handleBuild(item)
                  }
                  style={globalStyles.secondaryButton}
                  disabled={item.isMapExpansion && expandingMap}
                >
                  <View style={styles.buttonContent}>
                    <Image source={chronIcon} style={styles.chronIcon} />
                    <Text variant="bodyMedium" style={styles.price}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                </Button>
              </Card.Actions>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  container: {},

  row: {
    justifyContent: "space-between",
  },

  card: {
    width: cardWidth,
    marginBottom: gap,
    marginRight: gap,
  },

  cardLast: {
    marginRight: 0,
  },

  cardContent: {
    alignItems: "center",
    paddingBottom: 8,
  },

  image: {
    width: cardWidth - 36,
    height: cardWidth - 36,
    borderRadius: 8,
    marginBottom: 4,
  },

  price: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  chronIcon: {
    width: 16,
    height: 16,
  },

  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
});
