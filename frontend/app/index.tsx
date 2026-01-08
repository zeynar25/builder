import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { API_BASE_URL } from "../src/config";

export default function Index() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRoot() {
      try {
        const res = await fetch(`${API_BASE_URL}/`);
        const text = await res.text();
        if (!cancelled) setData(text);
      } catch (e: any) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRoot();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text>{`Error: ${error}`}</Text>
      ) : (
        <Text>{data}</Text>
      )}
    </View>
  );
}
