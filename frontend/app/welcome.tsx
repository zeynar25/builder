import React from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Image,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { theme } from "@/src/theme";
import { globalStyles } from "@/src/globalstyles";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

export default function Welcome() {
    const router = useRouter();
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        opacity.value = withTiming(1, { duration: 600 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[globalStyles.main, animatedStyle]}>
            <View style={styles.headerContainer}>
                <Image
                    source={require("../assets/images/Vector.png")}
                    style={styles.headerImage}
                    resizeMode="stretch"
                />
            </View>

            <View style={[styles.content, styles.contentWithHeaderOffset]}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Text style={styles.brandText}>Builder App</Text>

                <View style={styles.imagePlaceholder}>
                    <Image
                        source={require("../assets/images/builder-logo.png")}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.description}>
                    The best way to manage your progress and build your future.
                </Text>

                <Pressable
                    style={globalStyles.primaryButton}
                    onPress={() => router.replace("/login")}
                >
                    <Text style={globalStyles.primaryButtonText}>Next</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: screenHeight * 0.4,
        overflow: "hidden",
    },
    headerImage: {
        width: "100%",
        height: screenHeight * 0.4,
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
        paddingTop: screenHeight * 0.1,
    },
    welcomeText: {
        fontSize: theme.typography.fontSize.title,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.primary,
        textAlign: "center",
    },
    brandText: {
        fontSize: 42,
        fontWeight: "800",
        color: theme.colors.highlight,
        marginBottom: theme.spacing.xl,
        textAlign: "center",
    },
    imagePlaceholder: {
        width: screenWidth * 0.6,
        height: screenWidth * 0.6,
        marginBottom: theme.spacing.xl,
        justifyContent: "center",
        alignItems: "center",
    },
    illustration: {
        width: "100%",
        height: "100%",
    },
    description: {
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.secondary,
        textAlign: "center",
        marginBottom: theme.spacing.xxl,
        lineHeight: 24,
    },
});
