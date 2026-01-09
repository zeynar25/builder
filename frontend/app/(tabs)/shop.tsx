import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { API_BASE_URL } from "../../src/config";
import { getImageSource } from "../../src/imageMap";

const defaultTile = require("../../assets/images/road-connectors/default-tile.png");

export default function Shop() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <FlatList
      data={items}
      keyExtractor={(item) => item._id ?? item.id ?? String(item.name)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.row}>
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
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.desc}>{item.description}</Text>
            ) : null}
            <Text style={styles.price}>{`Price: ${formatPrice(
              item.price
            )}`}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: { flexDirection: "row", marginBottom: 12, alignItems: "center" },
  image: { width: 64, height: 64, borderRadius: 6, marginRight: 12 },
  info: { flex: 1 },
  name: { fontWeight: "700", fontSize: 16 },
  desc: { color: "#555", marginTop: 4 },
  price: { marginTop: 6, fontWeight: "600" },
  imgUrl: { marginTop: 4, color: "#007AFF", fontSize: 12 },
});
