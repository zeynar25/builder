import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";

import { Card, Text, Button } from "react-native-paper";

import { API_BASE_URL } from "../../src/config";
import isTokenValid from "../../src/useAuthGuard";
import { getImageSource } from "../../src/imageMap";
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
          const detailRes = await fetch(
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/items`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (!cancelled) setItems(json.items ?? []);
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
                  onPress={() => handleBuild(item)}
                  style={globalStyles.secondaryButton}
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
