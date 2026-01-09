import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  Image,
  Platform,
  DeviceEventEmitter,
  Dimensions,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { API_BASE_URL } from "../../src/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
// default tile asset
const defaultTile = require("../../assets/images/road-connectors/default-tile.png");

export default function Index() {
  const router = useRouter();
  const [accountDetail, setAccountDetail] = useState<any | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  {
    /* pan controls (render inside the returned JSX) */
  }
  const [editingGameName, setEditingGameName] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [savingGameName, setSavingGameName] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [editingMapName, setEditingMapName] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [savingMapName, setSavingMapName] = useState(false);
  const [centerX, setCenterX] = useState<number | null>(null);
  const [centerY, setCenterY] = useState<number | null>(null);
  const [tileSize, setTileSize] = useState<number>(48); // px per tile (zoomable)
  const MIN_VIEWPORT = 3; // minimum viewport dimension

  const [viewportCols, setViewportCols] = useState<number>(5);
  const [viewportRows, setViewportRows] = useState<number>(5);

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

  useEffect(() => {
    function computeViewport() {
      const { width, height } = Dimensions.get("window");
      const horizontalPadding = 40; // approximate horizontal chrome + paddings
      const verticalPadding = 300; // approximate header/controls height
      const availableCols = Math.max(
        1,
        Math.floor((width - horizontalPadding) / tileSize)
      );
      const availableRows = Math.max(
        1,
        Math.floor((height - verticalPadding) / tileSize)
      );

      const mapW = Number(
        mapData?.map?.widthTiles ??
          mapData?.map?.width ??
          mapData?.grid?.[0]?.length ??
          0
      );
      const mapH = Number(
        mapData?.map?.heightTiles ??
          mapData?.map?.height ??
          mapData?.grid?.length ??
          0
      );

      // Cap viewport to available screen tiles, but never exceed actual map size when known.
      let cols = availableCols;
      let rows = availableRows;

      if (mapW > 0) cols = Math.min(availableCols, mapW);
      if (mapH > 0) rows = Math.min(availableRows, mapH);

      // ensure at least 1 tile shown
      cols = Math.max(1, cols);
      rows = Math.max(1, rows);

      setViewportCols(cols);
      setViewportRows(rows);
    }

    computeViewport();
    const sub = Dimensions.addEventListener("change", computeViewport);
    return () => {
      try {
        sub?.remove?.();
      } catch {
        // ignore
      }
    };
  }, [tileSize, mapData]);

  // Listen for chron updates emitted from other components (e.g. the Stopwatch)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "chronUpdated",
      async (payload: any) => {
        try {
          const accountDetailId = await AsyncStorage.getItem("accountDetailId");
          if (!accountDetailId) return;
          const detailRes = await fetch(
            `${API_BASE_URL}/api/account-detail/${accountDetailId}`
          );
          if (!detailRes.ok) return;
          const detailJson = await detailRes.json();
          setAccountDetail(detailJson);
        } catch {
          // ignore errors from refresh
        }
      }
    );
    return () => sub.remove();
  }, []);

  // initialize center when mapData is loaded
  useEffect(() => {
    if (!mapData?.map) return;
    const w = Number(
      mapData.map.widthTiles ??
        mapData.map.width ??
        mapData.grid?.[0]?.length ??
        0
    );
    const h = Number(
      mapData.map.heightTiles ?? mapData.map.height ?? mapData.grid?.length ?? 0
    );
    if (w > 0 && h > 0) {
      setCenterX(Math.floor(w / 2));
      setCenterY(Math.floor(h / 2));
    }
  }, [mapData]);

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }

  const pan = React.useCallback(
    (dx: number, dy: number) => {
      if (centerX === null || centerY === null || !mapData?.map) return;
      const w = Number(
        mapData.map.widthTiles ??
          mapData.map.width ??
          mapData.grid?.[0]?.length ??
          0
      );
      const h = Number(
        mapData.map.heightTiles ??
          mapData.map.height ??
          mapData.grid?.length ??
          0
      );
      setCenterX((cx) => clamp((cx ?? 0) + dx, 0, Math.max(0, w - 1)));
      setCenterY((cy) => clamp((cy ?? 0) + dy, 0, Math.max(0, h - 1)));
    },
    [mapData, centerX, centerY]
  );

  // keyboard panning support for web (WASD, QE, ZC for diagonals and arrows)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    function onKey(e: KeyboardEvent) {
      if (!mapData) return;
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") pan(0, -1);
      else if (key === "arrowdown" || key === "s") pan(0, 1);
      else if (key === "arrowleft" || key === "a") pan(-1, 0);
      else if (key === "arrowright" || key === "d") pan(1, 0);
      else if (key === "q") pan(-1, -1);
      else if (key === "e") pan(1, -1);
      else if (key === "z") pan(-1, 1);
      else if (key === "c") pan(1, 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapData, centerX, centerY, pan]);

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
      <View
        style={{
          width: "100%",
          paddingHorizontal: 8,
          marginBottom: 8,
          position: "relative",
        }}
      >
        <Pressable
          onPress={handleLogout}
          style={{ position: "absolute", top: 8, right: 8, padding: 8 }}
        >
          <Text style={{ color: "#FFA500", fontWeight: "600" }}>Logout</Text>
        </Pressable>
        {editingGameName ? (
          <View>
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            {editingMapName ? (
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "60%",
                    maxWidth: 420,
                  }}
                >
                  <TextInput
                    value={newMapName}
                    onChangeText={setNewMapName}
                    placeholder="Map name"
                    style={{
                      borderBottomWidth: 1,
                      flex: 1,
                      paddingVertical: 4,
                      textAlign: "center",
                    }}
                    editable={!savingMapName}
                  />
                  <Pressable
                    onPress={async () => {
                      if (!newMapName)
                        return Alert.alert("Please enter a map name");
                      setSavingMapName(true);
                      try {
                        const mapId = mapData?.map?._id ?? mapData?.map?.id;
                        if (!mapId) throw new Error("no_map_id");
                        const res = await fetch(
                          `${API_BASE_URL}/api/maps/${mapId}/name`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newMapName }),
                          }
                        );
                        if (!res.ok) {
                          const err = await res.json().catch(() => null);
                          throw new Error(
                            err?.error || `Request failed (${res.status})`
                          );
                        }
                        const json = await res.json();
                        setMapData((m: any) => ({
                          ...(m || {}),
                          map: json.map,
                        }));
                        setEditingMapName(false);
                      } catch (e: any) {
                        Alert.alert("Unable to save", e.message || String(e));
                      } finally {
                        setSavingMapName(false);
                      }
                    }}
                    style={{ padding: 8, marginLeft: 8 }}
                  >
                    <FontAwesome5 name="check" size={16} color="#22C55E" />
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingMapName(false)}
                    style={{ padding: 8, marginLeft: 8 }}
                  >
                    <FontAwesome5 name="times" size={16} color="#888" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                      {mapData.map?.name
                        ? `${mapData.map.name}'s Domain`
                        : "Someone's Domain"}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setNewMapName(mapData?.map?.name ?? "");
                        setEditingMapName(true);
                      }}
                      style={{ padding: 6, marginLeft: 8 }}
                    >
                      <FontAwesome5 name="edit" size={16} color="#FFA500" />
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
          {Array.isArray(mapData.grid) ? (
            <View
              style={{
                borderWidth: 2,
                borderColor: "#333",
                borderRadius: 8,
                padding: 4,
                alignSelf: "center",
                backgroundColor: "#fff",
              }}
            >
              {(() => {
                // render the full map grid, but show a clipped viewport and translate the inner grid
                const w = mapData.grid[0]?.length ?? 0;
                const h = mapData.grid.length;
                const cx = centerX ?? Math.floor(w / 2);
                const cy = centerY ?? Math.floor(h / 2);

                // visible counts (how many tiles fit on screen)
                const visibleCols = Math.min(viewportCols, w || viewportCols);
                const visibleRows = Math.min(viewportRows, h || viewportRows);

                let startRow = cy - Math.floor(visibleRows / 2);
                let startCol = cx - Math.floor(visibleCols / 2);

                const maxStartRow = Math.max(0, h - visibleRows);
                const maxStartCol = Math.max(0, w - visibleCols);
                if (startRow < 0) startRow = 0;
                if (startCol < 0) startCol = 0;
                if (startRow > maxStartRow) startRow = maxStartRow;
                if (startCol > maxStartCol) startCol = maxStartCol;

                const viewportStyle = {
                  width: visibleCols * tileSize,
                  height: visibleRows * tileSize,
                  overflow: "hidden" as const,
                };

                const translateStyle = {
                  transform: [
                    { translateX: -startCol * tileSize },
                    { translateY: -startRow * tileSize },
                  ],
                };

                const rows = [] as any[];
                for (let r = 0; r < h; r++) {
                  const cols = [] as any[];
                  for (let c = 0; c < w; c++) {
                    const cell = mapData.grid[r][c];
                    const source =
                      cell && cell.item && cell.item.imageUrl
                        ? { uri: cell.item.imageUrl }
                        : defaultTile;
                    cols.push(
                      <Image
                        key={`cell-${c}-${r}`}
                        source={source}
                        style={{
                          width: tileSize,
                          height: tileSize,
                          marginRight: 1,
                          marginBottom: 1,
                        }}
                        resizeMode="cover"
                      />
                    );
                  }
                  rows.push(
                    <View
                      key={`row-full-${r}`}
                      style={{ flexDirection: "row" }}
                    >
                      {cols}
                    </View>
                  );
                }

                return (
                  <View style={viewportStyle}>
                    <View style={translateStyle}>{rows}</View>
                  </View>
                );
              })()}
            </View>
          ) : (
            <Text>No grid available</Text>
          )}
        </View>
      ) : (
        <Text>{data}</Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => setTileSize((s) => Math.max(12, Math.round(s / 1.25)))}
          style={{ padding: 6, marginRight: 6 }}
        >
          <FontAwesome5 name="search-minus" size={16} color="#FFA500" />
        </Pressable>
        <Pressable
          onPress={() =>
            setTileSize((s) => Math.min(128, Math.round(s * 1.25)))
          }
          style={{ padding: 6, marginRight: 6 }}
        >
          <FontAwesome5 name="search-plus" size={16} color="#FFA500" />
        </Pressable>
      </View>
    </View>
  );
}
