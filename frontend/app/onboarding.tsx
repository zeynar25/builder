import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
    FlatList,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate,
    SharedValue,
} from 'react-native-reanimated';
import { theme } from '@/src/theme';
const { width: screenWidth } = Dimensions.get('window');

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Start Building!',
        description: 'You’re all set. Your journey to better focus starts now.',
        image: require('../assets/images/onboarding/onboard-01.png'),
        color: theme.colors.highlight,
    },
    {
        id: '2',
        title: 'Build Your Focus',
        description: 'Start a timer, stay distraction-free, and watch your village come to life with every completed session.',
        image: require('../assets/images/onboarding/onboard-02.png'),
        color: theme.colors.accent_1,
    },
    {
        id: '3',
        title: 'Level Up as You Progress',
        description: 'Each focus session adds new display to your village. More focus = more upgrades.',
        image: require('../assets/images/onboarding/onboard-03.png'),
        color: theme.colors.accent_3,
    },
    {
        id: '4',
        title: 'Ready to Build?',
        description: 'Begin your first focus session and start building your world.',
        image: require('../assets/images/onboarding/onboard-04.png'),
        color: theme.colors.support,
        isLast: true,
    },
];

const Slide = ({ item, scrollX, index }: { item: typeof SLIDES[0], scrollX: SharedValue<number>, index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.9, 1, 0.9],
            Extrapolate.CLAMP
        );
        const opacity = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0, 1, 0],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <View style={styles.slideContainer}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <View style={styles.imageWrapper}>
                    <Image source={item.image} style={styles.illustration} resizeMode="contain" />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
        </View>
    );
};

export default function Onboarding() {
    const router = useRouter();
    const scrollX = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    React.useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
    }, []);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollX.value = event.nativeEvent.contentOffset.x;
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace('/');
        }
    };

    const skip = () => {
        router.replace('/');
    };

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
            <Pressable style={styles.skipButton} onPress={skip}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item, index }) => (
                    <Slide item={item} scrollX={scrollX} index={index} />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                <View style={styles.indicatorContainer}>
                    {SLIDES.map((_, index) => {
                        const dotStyle = useAnimatedStyle(() => {
                            const dotWidth = interpolate(
                                scrollX.value,
                                [(index - 1) * width, index * width, (index + 1) * width],
                                [8, 24, 8],
                                Extrapolate.CLAMP
                            );
                            const opacity = interpolate(
                                scrollX.value,
                                [(index - 1) * width, index * width, (index + 1) * width],
                                [0.4, 1, 0.4],
                                Extrapolate.CLAMP
                            );
                            return { width: dotWidth, opacity };
                        });
                        return <Animated.View key={index} style={[styles.dot, dotStyle]} />;
                    })}
                </View>

                <Pressable
                    style={[styles.button, currentIndex === SLIDES.length - 1 && styles.buttonLast]}
                    onPress={handleNext}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Start Building' : 'Next'}
                    </Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.mono,
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 30,
        zIndex: 10,
    },
    skipText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.text,
        fontFamily: theme.typography.fontFamily.primary,
    },

    slideContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: "transparent",
    },
    card: {
        width: '100%',
        alignItems: 'center',
    },

    imageWrapper: {
        width: '100%',
        height: width * 0.75,
        justifyContent: 'center',
        alignItems: 'center',
    },

    illustration: {
        width: '100%',
        height: '100%',
    },

    title: {
        fontSize: theme.typography.fontSize.onboard,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
        fontFamily: theme.typography.fontFamily.primary,
    },
    description: {
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        fontFamily: theme.typography.fontFamily.primary,
        paddingHorizontal: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: screenWidth * 0.1,
    },
    indicatorContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.xxl,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.accent_4,
        marginHorizontal: 4,
    },
    button: {
        backgroundColor: theme.colors.highlight,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radii.md,
        width: '100%',
        alignItems: 'center',
    },
    buttonLast: {
        backgroundColor: theme.colors.accent_3,
    },
    buttonText: {
        color: theme.colors.mono,
        fontSize: theme.typography.fontSize.text,
        fontWeight: theme.typography.fontWeight.bold,
        fontFamily: theme.typography.fontFamily.primary,
    },
});
