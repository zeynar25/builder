import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Pressable,
  Alert,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from "react-native";

import { Text } from "react-native-paper";
import { globalStyles } from "@/src/globalstyles";
import { theme } from "@/src/theme";
import PageHeader from "@/src/components/PageHeader";
import PageFiller from "@/src/components/PageFiller";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../src/config";
import isTokenValid from "../../src/useAuthGuard";
import apiFetch from "../../src/api";
import BuildingAnimation from "../../src/components/BuildingAnimation";
import { useRouter } from "expo-router";

export default function StopWatch() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef<any>(null);

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
              [{ text: "OK", onPress: () => router.replace("/login") }]
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

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function awardChron(flooredMinutes: number) {
    try {
      const accountDetailId = await AsyncStorage.getItem("accountDetailId");
      if (!accountDetailId)
        return showAlert("No account detail", "Please log in first.");

      const res = await apiFetch(
        `${API_BASE_URL}/api/account-detail/${accountDetailId}/chron`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ minutes: flooredMinutes }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      const newChron = json?.accountDetail?.chron;
      // Update local header immediately
      if (json) {
        setAccountDetail(json);
      }
      showAlert(
        "Chron awarded",
        `Awarded ${flooredMinutes} chron. New total: ${newChron}`
      );
      try {
        DeviceEventEmitter.emit("chronUpdated", { newChron });
      } catch {}
    } catch (e: any) {
      showAlert("Unable to award chron", e.message || String(e));
    }
  }

  // Show only one control at a time: Start when stopped, Stop & Earn when running
  // web-compatible confirm and alert helpers
  function showAlert(title: string, message?: string) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(title + (message ? "\n\n" + message : ""));
    } else {
      Alert.alert(title, message);
    }
  }

  function confirmPrompt(title: string, message?: string) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return Promise.resolve(
        window.confirm(title + (message ? "\n\n" + message : ""))
      );
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert(title, message || "", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "OK", onPress: () => resolve(true) },
      ]);
    });
  }

  async function confirmStopAndEarn() {
    const minutes = Math.floor(elapsed / 60);
    if (minutes <= 0) {
      const ok = await confirmPrompt(
        "Stop",
        "Less than one minute recorded. Stop the stopwatch? No chron will be awarded."
      );
      if (!ok) return;
      setRunning(false);
      setElapsed(0);
      showAlert("Stopped", "No chron awarded.");
      return;
    }

    const ok = await confirmPrompt(
      "Stop & Earn",
      `Stop the stopwatch and award ${minutes} chron?`
    );
    if (!ok) return;
    setRunning(false);
    await awardChron(minutes);
    setElapsed(0);
  }

  return (
    <View style={globalStyles.page}>
      <PageHeader accountDetail={accountDetail} />

      <PageFiller />

      <View style={globalStyles.pageContainer}>
        <Text variant="titleLarge" style={globalStyles.variantTitle}>
          Builders Timer
        </Text>
      </View>

      <View style={styles.container}>
        <BuildingAnimation running={running} />
        <View style={styles.controls}>
          <Text variant="displayMedium" style={globalStyles.variantTitle}>
            {formatTime(elapsed)}
          </Text>

          <View style={styles.buttonContainer}>
            {!running ? (
              <Pressable
                onPress={() => setRunning(true)}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.buttonText}>Start</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={confirmStopAndEarn}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="titleMedium" style={styles.buttonText}>
                  Stop & Earn
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      <PageFiller />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    marginTop: theme.spacing.lg,
    alignItems: "center",
    flexDirection: "column",
    gap: theme.spacing.sm,
  },

  buttonContainer: {
    flexDirection: "row",
  },

  button: {
    backgroundColor: theme.colors.highlight,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  pressed: { opacity: 0.7 },

  buttonText: {
    color: theme.colors.mono,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
