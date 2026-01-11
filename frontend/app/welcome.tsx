import React from "react";
import {
    View,
    Pressable,
    StyleSheet,
    Image,
    Dimensions,
} from "react-native";

import { Text, Button } from "react-native-paper";

import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { theme } from "@/src/theme";
import { globalStyles } from "@/src/globalstyles";
import { Background } from "@react-navigation/elements";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

export default function Welcome() {
    const router = useRouter();
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        // Content fades in
        opacity.value = withTiming(1, { duration: 500 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={{ flex: 1 }}>
            {/* 1. Original content structure inside an Animated.View for fade-in */}
            <Animated.View style={[styles.main, animatedStyle]}>
                <View style={styles.headerContainer}>
                    <Image
                        source={require("../assets/images/Vector.png")}
                        style={styles.headerImage}
                        resizeMode="stretch"
                    />
                </View>

                <View style={[styles.content, styles.contentWithHeaderOffset]}>
                    <View style={styles.welcomeTextContainer}>
                        <Text variant="titleLarge" style={globalStyles.variantLabel}>Welcome to</Text>
                        <Text variant="displayLarge" style={{...globalStyles.variantTitle, fontWeight: theme.typography.fontWeight.bold}}>
                            Bu
                            <Text style={{ color: theme.colors.highlight }}>i</Text>
                            lder
                        </Text>

                        <Text variant="titleSmall" style={globalStyles.variantLabel}>
                            The best way to manage your progress and build your habits.
                        </Text>
                    </View>

                    <Pressable
                        style={globalStyles.primaryButton}
                        onPress={() => router.replace("/login")}
                    >
                        <Text style={globalStyles.primaryButtonText}>Next</Text>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    main: {
        backgroundColor: theme.colors.mono,
        flex: 1,
    },
    
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: screenHeight * 0.8,
        overflow: "hidden",
    },
    headerImage: {
        width: "100%",
        height: screenHeight * 0.8,
        position: "absolute",
        bottom: 0,
    },
    
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },

    contentWithHeaderOffset: {
        marginBottom: screenHeight * 0.04,
        justifyContent: "flex-end",
        alignItems: "flex-start",
    },

    welcomeTextContainer: {
        marginBottom: theme.spacing.lg,
    },
    welcomeText: {
        fontSize: theme.typography.fontSize.title,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.primary,
        textAlign: "center",
    },


    description: {
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.secondary,
        textAlign: "center",
        marginBottom: theme.spacing.xxl,
        lineHeight: 24,
    },
});
