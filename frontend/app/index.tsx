import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { API_BASE_URL } from "../src/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGameName, setEditingGameName] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [savingGameName, setSavingGameName] = useState(false);
  const [showExp, setShowExp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkAndFetch() {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        // validate token expiry (JWT `exp` in seconds)
        function isTokenValid(tok: string | null) {
          if (!tok) return false;
          try {
            const parts = tok.split(".");
            if (parts.length !== 3) return false;
            const payload = parts[1];
            // base64url -> base64
            const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            // atob should be available in Expo; wrap in try/catch
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
            // exp is seconds since epoch
            return obj.exp * 1000 > Date.now();
          } catch {
            return false;
          }
        }

        if (!isTokenValid(token)) {
          // token missing or expired — notify user, clear token and force login
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
          console.log(detailJson);
          setAccountDetail(detailJson);
        }

        // try to load a map if we have a currentMapId stored
        const mapId = await AsyncStorage.getItem("currentMapId");
        if (mapId) {
          const res = await fetch(`${API_BASE_URL}/api/maps/${mapId}`);
          if (res.ok) {
            const json = await res.json();
            if (!cancelled) setMapData(json);
          } else {
            // fallback to server root
            const text = await fetch(`${API_BASE_URL}/`).then((r) => r.text());
            if (!cancelled) setData(text);
          }
        } else {
          const res = await fetch(`${API_BASE_URL}/`);
          const text = await res.text();
          if (!cancelled) setData(text);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAndFetch();
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

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <Pressable
        onPress={handleLogout}
        style={{ position: "absolute", top: 16, right: 16, padding: 8 }}
      >
        <Text style={{ color: "#FFA500", fontWeight: "600" }}>Logout</Text>
      </Pressable>
      <View style={{ width: "100%", paddingHorizontal: 8, marginBottom: 8 }}>
        {editingGameName ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              value={newGameName}
              onChangeText={setNewGameName}
              placeholder="Game name"
              style={{ borderBottomWidth: 1, flex: 1, paddingVertical: 4 }}
              editable={!savingGameName}
            />
            <Pressable
              onPress={async () => {
                if (!newGameName) return Alert.alert("Please enter a name");
                setSavingGameName(true);
                try {
                  const accountDetailId = await AsyncStorage.getItem(
                    "accountDetailId"
                  );
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
                    throw new Error(
                      err?.error || `Request failed (${res.status})`
                    );
                  }
                  const json = await res.json();
                  setAccountDetail(json);
                  setEditingGameName(false);
                } catch (e: any) {
                  Alert.alert("Unable to save", e.message || String(e));
                } finally {
                  setSavingGameName(false);
                }
              }}
              style={{ padding: 8, marginLeft: 8 }}
            >
              <FontAwesome5 name="check" size={16} color="#22C55E" />
            </Pressable>
            <Pressable
              onPress={() => setEditingGameName(false)}
              style={{ padding: 8, marginLeft: 8 }}
            >
              <FontAwesome5 name="times" size={16} color="#888" />
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 16, flex: 1 }}>
              {accountDetail ? `${accountDetail.accountDetail.gameName}` : ""}
            </Text>
            <Pressable
              onPress={() => {
                setNewGameName(accountDetail?.accountDetail?.gameName ?? "");
                setEditingGameName(true);
              }}
              style={{ padding: 6 }}
            >
              <FontAwesome5 name="edit" size={16} color="#FFA500" />
            </Pressable>
          </View>
        )}

        <Text style={{ marginTop: 8 }}>
          {accountDetail
            ? `${
                accountDetail.accountDetail.chron === 1 ? "Chron" : "Chrons"
              }: ${accountDetail.accountDetail.chron}`
            : ""}
        </Text>
        <Pressable
          onPress={() => {
            const exp = accountDetail?.accountDetail?.exp ?? 0;
            Alert.alert("Experience", `${exp}`);
          }}
          onHoverIn={() => setShowExp(true)}
          onHoverOut={() => setShowExp(false)}
          style={{ paddingVertical: 6 }}
        >
          <Text>
            {accountDetail
              ? `Level: ${Math.floor(
                  (accountDetail.accountDetail.exp ?? 0) / 100
                )}`
              : ""}
            {showExp && accountDetail
              ? ` (${accountDetail.accountDetail.exp} XP)`
              : ""}
          </Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text>{`Error: ${error}`}</Text>
      ) : mapData ? (
        <View style={{ width: "100%", padding: 8 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8 }}>
            {mapData.map?.name || "Map"}
          </Text>
          {Array.isArray(mapData.grid) ? (
            mapData.grid.map((row: any[], y: number) => (
              <Text key={`row-${y}`}>
                {row
                  .map((cell: any) => {
                    if (!cell) return "|_";
                    const label = cell.item?.name || "#";
                    return label.length > 1 ? label[0] : label;
                  })
                  .join("")
                  .concat("|")}
              </Text>
            ))
          ) : (
            <Text>No grid available</Text>
          )}
        </View>
      ) : (
        <Text>{data}</Text>
      )}
    </View>
  );
}
