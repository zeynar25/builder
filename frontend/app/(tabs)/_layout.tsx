import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import { View, Dimensions, StyleSheet } from "react-native";

import { theme } from "@/src/theme";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        
        tabBarActiveTintColor: theme.colors.mono,
        tabBarInactiveTintColor: theme.colors.text.secondary,

        tabBarStyle: {
          position: 'absolute',
          height: 72,
          paddingTop: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.mono,
          borderRadius: theme.radii.pill,
          marginHorizontal: screenWidth * 0.08,
          marginBottom: theme.spacing.xl,
        },
      }}
    >

      <Tabs.Screen
        name="stopwatch"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="clock" size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="home" size={size} color={color} />
            </View>
          ),
        }}
      />


      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="shopping-bag" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: theme.icon.navbar,
    height: theme.icon.navbar,
    borderRadius: theme.icon.navbar / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: theme.colors.highlight,
  },
});