import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
    FlatList,
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
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Plan Your Vision',
        description: 'Transform your ideas into structured plans. Builder helps you organize every brick of your project.',
        icon: 'edit-3',
        color: theme.colors.highlight,
    },
    {
        id: '2',
        title: 'Track Progress',
        description: 'Monitor your development in real-time. See your growth and hit your milestones faster.',
        icon: 'trending-up',
        color: theme.colors.accent_1,
    },
    {
        id: '3',
        title: 'Collaborate Easily',
        description: 'Work with your team seamlessly. Share progress and build together in one unified space.',
        icon: 'users',
        color: theme.colors.accent_3,
    },
    {
        id: '4',
        title: 'Build the Future',
        description: 'Your masterpieces are just a few steps away. Start building your dream project today.',
        icon: 'zap',
        color: theme.colors.support,
        isLast: true,
    },
];

const Slide = ({ item, scrollX, index }: { item: typeof SLIDES[0], scrollX: SharedValue<number>, index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.8, 1, 0.8],
            Extrapolate.CLAMP
        );
        const opacity = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.4, 1, 0.4],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <View style={styles.slideContainer}>
            <Animated.View style={[styles.card, animatedStyle, { borderColor: item.color }]}>
                <View style={[styles.iconWrapper, { backgroundColor: item.color + '20' }]}>
                    <Feather name={item.icon as any} size={80} color={item.color} />
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
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.primary,
    },
    slideContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        padding: 40,
        borderRadius: 32,
        backgroundColor: theme.colors.mono,
        alignItems: 'center',
        borderWidth: 2,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    iconWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 16,
        textAlign: 'center',
        fontFamily: theme.typography.fontFamily.primary,
    },
    description: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: theme.typography.fontFamily.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    indicatorContainer: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.highlight,
        marginHorizontal: 4,
    },
    button: {
        backgroundColor: theme.colors.highlight,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
    },
    buttonLast: {
        backgroundColor: theme.colors.accent_1,
    },
    buttonText: {
        color: theme.colors.mono,
        fontSize: 18,
        fontWeight: '700',
        fontFamily: theme.typography.fontFamily.primary,
    },
});
