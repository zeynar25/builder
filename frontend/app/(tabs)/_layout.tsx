import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import { View, Dimensions, Platform } from "react-native";

import { theme } from "@/src/theme";
import { globalStyles } from "@/src/globalstyles";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Responsive values
const TAB_BAR_HEIGHT = screenHeight * 0.12;
const IS_TABLET = screenWidth >= 768;
const BUTTON_SIZE = IS_TABLET ? 100 : 72;
const FLOAT_OFFSET = TAB_BAR_HEIGHT * 0.7;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FEAA00",
        tabBarInactiveTintColor: "#9B9B9B",
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingTop: 15,
          paddingHorizontal: 50,
          borderTopWidth: 0,
        },
      }}
    >

      <Tabs.Screen
        name="stopwatch"
        options={{
          title: "Stopwatch",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <View
              style={{
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                borderRadius: BUTTON_SIZE / 2,
                backgroundColor: theme.colors.highlight,
                justifyContent: "center",
                alignItems: "center",
                position: "absolute",
                top: -FLOAT_OFFSET,
                elevation: 6, // Android shadow
                shadowColor: theme.colors.accent_2, // iOS shadow
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              <Feather name="home" size={BUTTON_SIZE * 0.5} color="#fff" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-bag" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
