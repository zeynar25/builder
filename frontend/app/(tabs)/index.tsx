import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  Image,
  Platform,
  DeviceEventEmitter,
  Dimensions,
  PanResponder,
} from "react-native";

import { Text } from "react-native-paper";
import { globalStyles } from "@/src/globalstyles";
import PageHeader from "@/src/components/PageHeader";
import PageFiller from "@/src/components/PageFiller";

import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE_URL } from "../../src/config";
import isTokenValid from "../../src/useAuthGuard";
import { getImageSource } from "../../src/imageMap";
import apiFetch from "../../src/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { theme } from "@/src/theme";

const defaultTile = require("../../assets/images/road-connectors/default-tile.png");

function resolveTileImage(imageUrl: any) {
  if (!imageUrl) return defaultTile;
  const mapped = getImageSource(imageUrl);
  if (mapped) return mapped;
  const s = String(imageUrl);
  if (s && s.startsWith("http")) return { uri: s };
  return defaultTile;
}

function confirmDialog(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      const g: any = globalThis as any;
      if (g && typeof g.confirm === "function") {
        const ok = g.confirm((title ? title + "\n\n" : "") + message);
        return Promise.resolve(!!ok);
      }
    } catch {
      // fall through to native-style alert
    }
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", onPress: () => resolve(true) },
    ]);
  });
}

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
  const [editingMapName, setEditingMapName] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [savingMapName, setSavingMapName] = useState(false);
  const [centerX, setCenterX] = useState<number | null>(null);
  const [centerY, setCenterY] = useState<number | null>(null);
  const [tileSize, setTileSize] = useState<number>(48); // px per tile (zoomable)

  const panLastDxRef = React.useRef(0);
  const panLastDyRef = React.useRef(0);
  const pinchInitialDistanceRef = React.useRef<number | null>(null);
  const pinchInitialTileSizeRef = React.useRef<number>(tileSize);

  const [buildItem, setBuildItem] = useState<any | null>(null);
  const [placing, setPlacing] = useState(false);
  const [buildX, setBuildX] = useState<number | null>(null);
  const [buildY, setBuildY] = useState<number | null>(null);
  const [buildFollowHover, setBuildFollowHover] = useState<boolean>(true);
  const [moveSource, setMoveSource] = useState<any | null>(null);
  const [moving, setMoving] = useState(false);
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
    cell: any;
  } | null>(null);
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkAndFetch() {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          router.replace("/welcome");
          return;
        }

        // validate token expiry (JWT `exp` in seconds)
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
          setAccountDetail(detailJson);
        }

        // try to load a map if we have a currentMapId stored
        const mapId = await AsyncStorage.getItem("currentMapId");
        if (mapId) {
          const res = await apiFetch(`${API_BASE_URL}/api/maps/${mapId}`);
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

  const { width: screenWidth } = Dimensions.get("window");
  const containerSize = screenWidth * 0.9;

  // Derive map metadata for zoom limits
  const mapWidth = Number(
    mapData?.map?.widthTiles ??
    mapData?.map?.width ??
    mapData?.grid?.[0]?.length ??
    0
  );
  const mapHeight = Number(
    mapData?.map?.heightTiles ??
    mapData?.map?.height ??
    mapData?.grid?.length ??
    0
  );

  // When fully zoomed out, show the entire map (max of width/height) inside the square.
  const maxTiles = Math.max(mapWidth || 1, mapHeight || 1);
  const minTileSize = containerSize / maxTiles;

  // maxTileSize: Exactly one tile fills the entire container when fully zoomed in.
  const maxTileSize = containerSize;

  useEffect(() => {
    function computeViewport() {
      if (!mapWidth || !mapHeight) return;
      // Ensure current tileSize adheres to the dynamic limits
      let effectiveTileSize = clamp(tileSize, minTileSize, maxTileSize);
      if (effectiveTileSize !== tileSize) {
        setTileSize(effectiveTileSize);
      }
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
  }, [tileSize, mapData, minTileSize, maxTileSize, mapWidth, mapHeight]);

  // Listen for chron updates emitted from other components (e.g. the Stopwatch)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "chronUpdated",
      async (payload: any) => {
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
          // ignore errors from refresh
        }
      }
    );
    return () => sub.remove();
  }, []);

  // Refresh map data whenever a map expansion is purchased from the shop
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("mapExpanded", async () => {
      try {
        const mapId = await AsyncStorage.getItem("currentMapId");
        if (!mapId) return;

        const res = await apiFetch(`${API_BASE_URL}/api/maps/${mapId}`);
        if (!res.ok) return;
        const json = await res.json();
        setMapData(json);
      } catch {
        // ignore refresh errors
      }
    });
    return () => sub.remove();
  }, []);

  // initialize center when mapData is loaded
  useEffect(() => {
    if (!mapData?.map) return;
    if (mapWidth > 0 && mapHeight > 0) {
      // start in the top-left corner
      setCenterX(0);
      setCenterY(0);
    }
  }, [mapData, mapWidth, mapHeight]);

  // when map is available, see if there is a pending build item from the shop
  useEffect(() => {
    async function loadPendingBuild() {
      try {
        const raw = await AsyncStorage.getItem("pendingBuildItem");
        if (raw) {
          const parsed = JSON.parse(raw);
          setBuildItem(parsed);
        }
      } catch {
        // ignore
      }
    }
    if (mapData) {
      loadPendingBuild();
    }
  }, [mapData]);

  // keep build target in sync with camera center when build starts
  useEffect(() => {
    if (buildItem && centerX != null && centerY != null) {
      setBuildX(centerX);
      setBuildY(centerY);
      setBuildFollowHover(true);
    }
    if (!buildItem) {
      setBuildX(null);
      setBuildY(null);
      setBuildFollowHover(true);
    }
  }, [buildItem, centerX, centerY]);

  // also refresh pending build item whenever this screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem("pendingBuildItem");
          if (!active) return;
          if (raw) {
            const parsed = JSON.parse(raw);
            setBuildItem(parsed);
          } else {
            setBuildItem(null);
          }
        } catch {
          // ignore
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }

  const pan = React.useCallback(
    (dx: number, dy: number) => {
      if (centerX === null || centerY === null || !mapData?.map) return;
      setCenterX((cx) => clamp((cx ?? 0) + dx, 0, Math.max(0, mapWidth - 1)));
      setCenterY((cy) => clamp((cy ?? 0) + dy, 0, Math.max(0, mapHeight - 1)));
    },
    [mapData, centerX, centerY, mapWidth, mapHeight]
  );

  // drag-to-pan support (touch / mouse drag)
  const dragResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!mapData,
        onMoveShouldSetPanResponder: () => !!mapData,
        onPanResponderGrant: (evt) => {
          panLastDxRef.current = 0;
          panLastDyRef.current = 0;

          const native: any = evt.nativeEvent as any;
          const touches = native?.touches;
          if (touches && touches.length >= 2) {
            const [t1, t2] = touches;
            const dx = t2.pageX - t1.pageX;
            const dy = t2.pageY - t1.pageY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            pinchInitialDistanceRef.current = dist;
            pinchInitialTileSizeRef.current = tileSize;
          } else {
            pinchInitialDistanceRef.current = null;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          if (!mapData) return;

          const native: any = evt.nativeEvent as any;
          const touches = native?.touches;

          // Pinch to zoom when using two or more touches
          if (touches && touches.length >= 2) {
            const [t1, t2] = touches;
            const dx = t2.pageX - t1.pageX;
            const dy = t2.pageY - t1.pageY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (pinchInitialDistanceRef.current == null) {
              pinchInitialDistanceRef.current = dist;
              pinchInitialTileSizeRef.current = tileSize;
              return;
            }

            const scale = dist / (pinchInitialDistanceRef.current || 1);
            let nextSize = pinchInitialTileSizeRef.current * scale;
            if (!Number.isFinite(nextSize)) return;
            nextSize = clamp(nextSize, minTileSize, maxTileSize);
            setTileSize(nextSize);
            return;
          }

          // Single-finger behavior
          // Use a threshold based on tile size and at most one tile of
          // movement per update. In build/move mode, require roughly
          // double the drag distance per tile to slow ghost movement.
          const isGhostMode = !!(buildItem || moveSource);
          const threshold = tileSize * (isGhostMode ? 2 : 1);
          const dx = gestureState.dx - panLastDxRef.current;
          const dy = gestureState.dy - panLastDyRef.current;

          let stepsX =
            Math.abs(dx) >= threshold ? Math.trunc(dx / threshold) : 0;
          let stepsY =
            Math.abs(dy) >= threshold ? Math.trunc(dy / threshold) : 0;

          // Clamp to a single-tile step per update in each direction
          if (stepsX !== 0) stepsX = stepsX > 0 ? 1 : -1;
          if (stepsY !== 0) stepsY = stepsY > 0 ? 1 : -1;

          if (stepsX === 0 && stepsY === 0) {
            return;
          }

          panLastDxRef.current += stepsX * threshold;
          panLastDyRef.current += stepsY * threshold;

          // When not in build or move mode, drag continues to pan the map.
          if (!buildItem && !moveSource) {
            if (stepsX !== 0) {
              pan(-stepsX, 0);
            }
            if (stepsY !== 0) {
              pan(0, -stepsY);
            }
            return;
          }

          // In build or move mode, drag moves the ghost target across the map.
          // The viewport will follow it based on buildX/buildY when rendering.
          if (!mapData?.map) return;

          if (!mapWidth || !mapHeight) return;

          let targetX = buildX ?? centerX ?? 0;
          let targetY = buildY ?? centerY ?? 0;

          if (stepsX !== 0) {
            targetX = clamp(targetX + stepsX, 0, mapWidth - 1);
          }
          if (stepsY !== 0) {
            targetY = clamp(targetY + stepsY, 0, mapHeight - 1);
          }

          setBuildX(targetX);
          setBuildY(targetY);
        },
        onPanResponderRelease: () => {
          pinchInitialDistanceRef.current = null;
          panLastDxRef.current = 0;
          panLastDyRef.current = 0;
        },
      }),
    [
      mapData,
      tileSize,
      pan,
      buildItem,
      moveSource,
      buildX,
      buildY,
      centerX,
      centerY,
      minTileSize,
      maxTileSize,
      mapWidth,
      mapHeight,
    ]
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

  // Touchpad / mouse wheel support for panning and pinch-zoom on web
  useEffect(() => {
    if (Platform.OS !== "web") return;

    let accumX = 0;
    let accumY = 0;

    function onWheel(e: any) {
      if (!mapData) return;

      // Treat pinch-zoom on trackpads (often comes through as wheel + ctrlKey)
      if (e.ctrlKey) {
        if (e.preventDefault) e.preventDefault();
        setTileSize((current) => {
          let next = current;
          if (e.deltaY < 0) {
            next = current * 1.1;
          } else if (e.deltaY > 0) {
            next = current / 1.1;
          }
          if (!Number.isFinite(next)) return current;
          next = clamp(next, minTileSize, maxTileSize);
          return Math.round(next);
        });
        return;
      }

      // Two-finger scroll to pan the map
      const threshold = tileSize / 2;
      accumX += e.deltaX;
      accumY += e.deltaY;

      if (Math.abs(accumX) >= threshold) {
        const stepsX = Math.trunc(accumX / threshold);
        if (stepsX !== 0) {
          // invert horizontal scroll so scrolling left moves the view left
          pan(-stepsX, 0);
          accumX -= stepsX * threshold;
        }
      }

      if (Math.abs(accumY) >= threshold) {
        const stepsY = Math.trunc(accumY / threshold);
        if (stepsY !== 0) {
          // invert vertical scroll so scrolling up moves the view up
          pan(0, -stepsY);
          accumY -= stepsY * threshold;
        }
      }
    }

    try {
      window.addEventListener("wheel", onWheel, { passive: false } as any);
    } catch {
      window.addEventListener("wheel", onWheel as any);
    }

    return () => {
      window.removeEventListener("wheel", onWheel as any);
    };
  }, [mapData, pan, tileSize, minTileSize, maxTileSize]);

  const cancelBuild = React.useCallback(async () => {
    setBuildItem(null);
    try {
      await AsyncStorage.removeItem("pendingBuildItem");
    } catch {
      // ignore
    }
  }, []);

  const cancelMove = React.useCallback(() => {
    setMoveSource(null);
    setBuildX(null);
    setBuildY(null);
    setBuildFollowHover(true);
  }, []);

  const confirmBuild = React.useCallback(async () => {
    if (!buildItem) return;
    const targetX = buildX ?? centerX;
    const targetY = buildY ?? centerY;

    if (targetX == null || targetY == null) {
      Alert.alert("Cannot place", "Map is not ready yet.");
      return;
    }

    // Check if the target tile is already occupied on the client grid
    try {
      if (mapData?.grid) {
        const cy = targetY;
        const cx = targetX;
        const existingCell = mapData.grid[cy]?.[cx];
        if (existingCell?.item) {
          Alert.alert(
            "Tile occupied",
            "There is already an item on this tile. Please move to an empty tile before building."
          );
          return;
        }
      }
    } catch {
      // if anything goes wrong reading the grid, fall through to server validation
    }

    try {
      setPlacing(true);
      const [accountId, accountDetailId, mapId] = await Promise.all([
        AsyncStorage.getItem("accountId"),
        AsyncStorage.getItem("accountDetailId"),
        AsyncStorage.getItem("currentMapId"),
      ]);

      if (!accountId || !accountDetailId || !mapId) {
        throw new Error("Missing account or map information");
      }

      const res = await apiFetch(`${API_BASE_URL}/api/items/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          accountDetailsId: accountDetailId,
          mapId,
          x: targetX,
          y: targetY,
          itemId: buildItem.itemId,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || "Unable to place item";
        throw new Error(msg);
      }

      // refresh map
      try {
        const mapRes = await apiFetch(`${API_BASE_URL}/api/maps/${mapId}`);
        if (mapRes.ok) {
          const mapJson = await mapRes.json();
          setMapData(mapJson);
        }
      } catch {
        // ignore map refresh failures
      }

      // refresh account detail (for updated chrons)
      try {
        if (accountDetailId) {
          const detailRes = await apiFetch(
            `${API_BASE_URL}/api/account-detail/${accountDetailId}`
          );
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            setAccountDetail(detailJson);
            try {
              const newChron =
                (detailJson as any)?.accountDetail?.chron ?? undefined;
              DeviceEventEmitter.emit("chronUpdated", { newChron });
            } catch {
              // ignore event errors
            }
          }
        }
      } catch {
        // ignore
      }

      await AsyncStorage.removeItem("pendingBuildItem");
      setBuildItem(null);
      Alert.alert("Success", "Item placed on the map.");
    } catch (e: any) {
      Alert.alert("Cannot build", e.message || String(e));
    } finally {
      setPlacing(false);
    }
  }, [buildItem, centerX, centerY, buildX, buildY, mapData]);

  const confirmMove = React.useCallback(async () => {
    if (!moveSource) return;

    const fromX = moveSource.x;
    const fromY = moveSource.y;
    const targetX = buildX ?? centerX;
    const targetY = buildY ?? centerY;

    if (targetX == null || targetY == null) {
      Alert.alert("Cannot move", "Map is not ready yet.");
      return;
    }

    // no-op if destination is same as source
    if (targetX === fromX && targetY === fromY) {
      cancelMove();
      return;
    }

    // Check if the destination tile is already occupied on the client grid
    try {
      if (mapData?.grid) {
        const existingCell = mapData.grid[targetY]?.[targetX];
        if (existingCell?.item) {
          Alert.alert(
            "Tile occupied",
            "There is already an item on this tile. Please move to an empty tile before relocating."
          );
          return;
        }
      }
    } catch {
      // if anything goes wrong reading the grid, fall through to server validation
    }

    try {
      setMoving(true);

      const [accountId, mapId] = await Promise.all([
        AsyncStorage.getItem("accountId"),
        AsyncStorage.getItem("currentMapId"),
      ]);

      if (!accountId || !mapId) {
        throw new Error("Missing account or map information");
      }

      const res = await apiFetch(`${API_BASE_URL}/api/items/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          mapId,
          fromX,
          fromY,
          toX: targetX,
          toY: targetY,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || "Unable to move item";
        throw new Error(msg);
      }

      // refresh map
      try {
        const mapRes = await apiFetch(`${API_BASE_URL}/api/maps/${mapId}`);
        if (mapRes.ok) {
          const mapJson = await mapRes.json();
          setMapData(mapJson);
        }
      } catch {
        // ignore map refresh failures
      }

      setMoveSource(null);
      setBuildX(null);
      setBuildY(null);
      setSelectedTile(null);
      Alert.alert("Moved", "Item has been relocated.");
    } catch (e: any) {
      Alert.alert("Cannot move", e.message || String(e));
    } finally {
      setMoving(false);
    }
  }, [moveSource, buildX, buildY, centerX, centerY, mapData, cancelMove]);

  const handleSellSelectedTile = React.useCallback(async () => {
    if (!selectedTile) return;
    const { x, y, cell } = selectedTile;
    if (!cell?.item) return;

    try {
      setSelling(true);

      const [accountId, accountDetailId, mapId] = await Promise.all([
        AsyncStorage.getItem("accountId"),
        AsyncStorage.getItem("accountDetailId"),
        AsyncStorage.getItem("currentMapId"),
      ]);

      if (!accountId || !accountDetailId || !mapId) {
        throw new Error("Missing account or map information");
      }

      const res = await apiFetch(`${API_BASE_URL}/api/items/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          accountDetailsId: accountDetailId,
          mapId,
          x,
          y,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error || "Unable to sell item";
        throw new Error(msg);
      }

      // refresh map
      try {
        const mapRes = await apiFetch(`${API_BASE_URL}/api/maps/${mapId}`);
        if (mapRes.ok) {
          const mapJson = await mapRes.json();
          setMapData(mapJson);
        }
      } catch {
        // ignore map refresh failures
      }

      // refresh account detail (for updated chrons)
      try {
        if (accountDetailId) {
          const detailRes = await apiFetch(
            `${API_BASE_URL}/api/account-detail/${accountDetailId}`
          );
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            setAccountDetail(detailJson);
            try {
              const newChron =
                (detailJson as any)?.accountDetail?.chron ?? undefined;
              DeviceEventEmitter.emit("chronUpdated", { newChron });
            } catch {
              // ignore event errors
            }
          }
        }
      } catch {
        // ignore
      }

      setSelectedTile(null);
      Alert.alert("Item sold", "You received a 50% refund.");
    } catch (e: any) {
      Alert.alert("Cannot sell", e.message || String(e));
    } finally {
      setSelling(false);
    }
  }, [selectedTile]);

  return (
    <View style={globalStyles.page}>
      <PageHeader accountDetail={accountDetail} />
      <PageFiller />
      <View style={globalStyles.pageContainer}>
        <Text variant="headlineMedium" style={{ ...globalStyles.variantLabel, fontWeight: theme.typography.fontWeight.bold }}>
          Bu
          <Text style={{ color: theme.colors.highlight, fontWeight: theme.typography.fontWeight.bold }}>i</Text>
          lder
          <Text style={{ color: theme.colors.highlight, fontWeight: theme.typography.fontWeight.bold }}> Village</Text>
        </Text>
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
                      borderBottomColor: theme.colors.highlight,
                      flex: 1,
                      paddingVertical: 4,
                      textAlign: "center",
                      fontSize: 18,
                      color: theme.colors.text.secondary,
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
                        const res = await apiFetch(
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
                    <Feather name="check" size={20} color="#11aa49" />
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingMapName(false)}
                    style={{ padding: 8, marginLeft: 8 }}
                  >
                    <Feather name="x" size={20} color={theme.colors.text.secondary} />
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
                    <Text variant="titleLarge" style={{ fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text.primary }}>
                      {mapData.map?.name
                        ? `${mapData.map.name}`
                        : "Someone's Domain"}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setNewMapName(mapData?.map?.name ?? "");
                        setEditingMapName(true);
                      }}
                      style={{ padding: 6, marginLeft: 8 }}
                    >
                      <FontAwesome5 name="edit" size={16} color={theme.colors.highlight} />
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
          {Array.isArray(mapData.grid) ? (
            <View
              style={{
                width: containerSize,
                height: containerSize,
                borderWidth: 1,
                borderColor: theme.colors.accent_3,
                borderRadius: 8,
                padding: 4,
                alignSelf: "center",
                backgroundColor: theme.colors.support,
                overflow: "hidden", // Crucial: hide tiles that overflow the square
              }}
            >
              {(() => {
                // Render only the visible window of the map (for performance)
                const w = mapData.grid[0]?.length ?? 0;
                const h = mapData.grid.length;
                const centerCol = centerX ?? Math.floor(w / 2);
                const centerRow = centerY ?? Math.floor(h / 2);

                // visible counts (how many tiles fit inside the fixed square container)
                const visibleCols = Math.max(
                  1,
                  Math.min(w, Math.floor(containerSize / tileSize))
                );
                const visibleRows = Math.max(
                  1,
                  Math.min(h, Math.floor(containerSize / tileSize))
                );

                // Decide the viewport start based on ghost target (build/move)
                // if present, otherwise use the camera center.
                let startRow: number;
                let startCol: number;

                if ((buildItem || moveSource) && buildY != null) {
                  startRow = buildY - 1;
                } else {
                  startRow = centerRow - Math.floor(visibleRows / 2);
                }

                if ((buildItem || moveSource) && buildX != null) {
                  startCol = buildX - 1;
                } else {
                  startCol = centerCol - Math.floor(visibleCols / 2);
                }

                const maxStartRow = Math.max(0, h - visibleRows);
                const maxStartCol = Math.max(0, w - visibleCols);
                if (startRow < 0) startRow = 0;
                if (startCol < 0) startCol = 0;
                if (startRow > maxStartRow) startRow = maxStartRow;
                if (startCol > maxStartCol) startCol = maxStartCol;

                // Expand render window by 2 tiles on each side so
                // tiles are already rendered as you pan into them.
                const buffer = 2;
                const renderStartRow = Math.max(0, startRow - buffer);
                const renderStartCol = Math.max(0, startCol - buffer);
                const renderEndRow = Math.min(
                  h,
                  startRow + visibleRows + buffer
                );
                const renderEndCol = Math.min(
                  w,
                  startCol + visibleCols + buffer
                );

                const rows = [] as any[];
                const activeGhostItem = moveSource?.item || buildItem;
                const hasGhost = !!activeGhostItem;
                for (let r = renderStartRow; r < renderEndRow; r++) {
                  const cols = [] as any[];
                  for (let c = renderStartCol; c < renderEndCol; c++) {
                    const cell = mapData.grid[r][c];
                    const targetCol = buildX ?? centerCol;
                    const targetRow = buildY ?? centerRow;
                    const isGhostTarget =
                      hasGhost && r === targetRow && c === targetCol;
                    const isOccupiedTarget = isGhostTarget && !!cell?.item;
                    const isSelected =
                      !!selectedTile &&
                      selectedTile.x === c &&
                      selectedTile.y === r;
                    const source = isGhostTarget
                      ? resolveTileImage(activeGhostItem?.imageUrl)
                      : resolveTileImage(cell?.item?.imageUrl);
                    const borderColor = isGhostTarget
                      ? isOccupiedTarget
                        ? "#ca2525" // red when trying to build over an occupied tile
                        : "#22C55E" // green when empty
                      : isSelected
                        ? "#2569d7" // blue highlight for selected occupied tile
                        : "transparent";
                    cols.push(
                      <Pressable
                        key={`cell-${r}-${c}`}
                        onPress={() => {
                          if (buildItem || moveSource) {
                            // in build or move mode, tapping moves the ghost target
                            // and (on web) toggles whether it keeps following hover
                            if (Platform.OS === "web") {
                              setBuildFollowHover((prev) => !prev);
                            }
                            setBuildX(c);
                            setBuildY(r);
                          } else if (cell?.item) {
                            setSelectedTile({ x: c, y: r, cell });
                          } else {
                            setSelectedTile(null);
                          }
                        }}
                        onHoverIn={() => {
                          if (
                            Platform.OS === "web" &&
                            (buildItem || moveSource) &&
                            buildFollowHover
                          ) {
                            setBuildX(c);
                            setBuildY(r);
                          }
                        }}
                      >
                        <Image
                          source={source}
                          style={{
                            width: tileSize,
                            height: tileSize,
                            borderWidth: isGhostTarget || isSelected ? 2 : 0,
                        
                          }}
                          resizeMode="cover"
                        />
                      </Pressable>
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
                  <View
                    style={{
                      width: containerSize,
                      height: containerSize,
                      overflow: "hidden",
                    }}
                    {...dragResponder.panHandlers}
                  >
                    {rows}
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
      {selectedTile && selectedTile.cell?.item && !moveSource && (
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: "#111",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", marginBottom: 4 }}>
            Selected: {selectedTile.cell.item?.name || "Item"} at (
            {selectedTile.x}, {selectedTile.y})
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => {
                (async () => {
                  const ok = await confirmDialog(
                    "Sell item?",
                    "You will receive 50% of this item's price."
                  );
                  if (ok) {
                    await handleSellSelectedTile();
                  }
                })();
              }}
              disabled={selling}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "#F97316",
                borderRadius: 6,
                opacity: selling ? 0.6 : 1,
                marginRight: 8,
              }}
            >
              <Text style={{ color: "#111", fontWeight: "600" }}>Sell</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!selectedTile?.cell?.item) return;
                setMoveSource({
                  x: selectedTile.x,
                  y: selectedTile.y,
                  item: selectedTile.cell.item,
                });
                setBuildX(selectedTile.x);
                setBuildY(selectedTile.y);
                setBuildFollowHover(true);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "#4B5563",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff" }}>Move</Text>
            </Pressable>
          </View>
        </View>
      )}
      {(buildItem || moveSource) && (
        <View
          style={{
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "center",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: theme.colors.highlight,
          }}
        >
          <Pressable
            onPress={moveSource ? cancelMove : cancelBuild}
            style={{ padding: 6, marginRight: 4 }}
            disabled={placing || moving}
          >
            <FontAwesome5 name="times" size={16} color="#EF4444" />
          </Pressable>
          <Text variant="labelLarge" style={{ marginHorizontal: 8, color: theme.colors.text.inverse, fontWeight: theme.typography.fontWeight.bold }}>
            {placing || moving
              ? moveSource
                ? "Moving..."
                : "Placing..."
              : moveSource
                ? `Moving: ${moveSource.item?.name ?? "Item"}`
                : `Placing: ${buildItem?.name ?? "Item"}`}
          </Text>
          <Pressable
            onPress={moveSource ? confirmMove : confirmBuild}
            style={{ padding: 6, opacity: placing || moving ? 0.5 : 1 }}
            disabled={placing || moving}
          >
            <FontAwesome5 name="check" size={16} color="#22C55E" />
          </Pressable>
        </View>
      )}
      {(buildItem || moveSource) &&
        mapData?.grid &&
        (buildX != null || centerX != null) &&
        (buildY != null || centerY != null) &&
        (() => {
          const tx = buildX ?? centerX!;
          const ty = buildY ?? centerY!;
          const cell = mapData.grid[ty]?.[tx];
          const sameSource =
            moveSource && tx === moveSource.x && ty === moveSource.y;
          return cell?.item && !sameSource;
        })() && (
          <Text variant="labelMedium" style={{ textAlign: "center", marginTop: 6, color: theme.colors.text.error }}>
            Selected tile is already occupied.
          </Text>
        )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
          alignSelf: "flex-end",
          borderRadius: 20,
          padding: 4,
        }}
      >
        <Pressable
          onPress={() =>
            setTileSize((s) =>
              clamp(Math.round(s / 1.25), minTileSize, maxTileSize)
            )
          }
          style={{ padding: 10, marginRight: 6 }}
        >
          <Feather name="zoom-out" size={24} color="#FFA500" />
        </Pressable>
        <Pressable
          onPress={() =>
            setTileSize((s) =>
              clamp(Math.round(s * 1.25), minTileSize, maxTileSize)
            )
          }
          style={{ padding: 10 }}
        >
          <Feather name="zoom-in" size={24} color="#FFA500" />
        </Pressable>
      </View>
      <PageFiller />
    </View>
  );
}