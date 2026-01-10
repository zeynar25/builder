import React, { useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import { View, Dimensions, StyleSheet, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from "react-native-reanimated";

import { theme } from "@/src/theme";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const AnimatedIcon = ({ name, color, size, focused }: { name: keyof typeof Feather.glyphMap; color: string; size: number; focused: boolean }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.2, { damping: 10, stiffness: 200 });
      rotation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    } else {
      scale.value = withSpring(1);
      rotation.value = withTiming(0);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
      <Animated.View style={animatedStyle}>
        <Feather name={name} size={size} color={color} />
      </Animated.View>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });

  // 4 tabs total
  const tabWidth = layout.width / 4;

  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    // Animate indicator to the center of the selected tab
    // Tab index * width + half width - half indicator size
    // But easier: translate the whole indicator wrapper
    if (layout.width > 0) {
      indicatorPosition.value = withSpring(state.index * tabWidth, {
        damping: 30, // Increased damping to reduce bounce
        stiffness: 150,
      });
    }
  }, [state.index, layout.width]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  return (
    <View
      style={styles.tabBar}
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
    >
      {/* Sliding Indicator */}
      {layout.width > 0 && (
        <Animated.View style={[styles.indicatorWrapper, { width: tabWidth }, indicatorStyle]}>
          <View style={styles.indicator} />
        </Animated.View>
      )}

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            {/* Pass focused state to icon for wiggle animation */}
            {options.tabBarIcon && options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? theme.colors.text.primary : theme.colors.text.secondary,
              size: 24
            })}
          </Pressable>
        );
      })}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="stopwatch"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="clock" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="shopping-bag" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="user" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: screenWidth * 0.08,
    right: screenWidth * 0.08,
    height: 72,
    backgroundColor: theme.colors.mono,
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // paddingHorizontal removed to ensure accurate tab width calculation
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorWrapper: {
    position: 'absolute',
    height: '100%',
    top: 0,
    left: 0, // removed theme.spacing.xs reference here, handled by wrapper positioning logic or just 0 if tab bar padding matches
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: theme.icon.navbar,
    height: theme.icon.navbar,
    borderRadius: theme.icon.navbar / 2,
    backgroundColor: theme.colors.highlight,
  },
  iconContainer: {
    width: theme.icon.navbar,
    height: theme.icon.navbar,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    // No longer needed, handled by indicator
  },
});