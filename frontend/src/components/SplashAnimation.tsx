import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    withSpring,
    runOnJS,
    interpolate,
    useAnimatedProps,
    Easing,
    SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

import { theme } from "@/src/theme";

const { width, height } = Dimensions.get('window');

const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- EASY COLOR EDITING SPACE ---
const COLORS = {
    background: theme.colors.mono,

    // House Building Blocks
    block1: theme.colors.accent_4,
    block2: theme.colors.support,
    block3: theme.colors.accent_1,
    block4: theme.colors.highlight,
    block5: theme.colors.accent_4,
    block6: theme.colors.accent_3,
    block7: theme.colors.highlight,
    block8: theme.colors.support,

    waveGradientStart: theme.colors.highlight,
    waveGradientEnd: theme.colors.highlight,
};

// --- TIMING CONFIGURATION ---
const TIMING = {
    SETTLE_HOUSE: 1500,    // Time blocks stay assembled before expansion
    EXPAND_DURATION: 1000,  // Duration of center square expansion
    SETTLE_LOGO: 2000,      // Time logo stays on screen before wave starts
    LOGO_FADE_IN: 800,      // Duration of logo fade in
    WAVE_DURATION: 800,    // Duration of top-to-bottom wave
};

interface BlockProps {
    id: number;
    finalX: number;
    finalY: number;
    width: number;
    height: number;
    color: string;
    delay: number;
    containerOpacity: SharedValue<number>;
    expansionProgress: SharedValue<number>;
    isCenter: boolean;
}

const Block = ({ finalX, finalY, width: w, height: h, color, delay, containerOpacity, expansionProgress, isCenter }: BlockProps) => {
    const translateY = useSharedValue(-height);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withSpring(finalY, {
                damping: 15,
                stiffness: 100,
            })
        );
        opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }, [delay, finalY]);

    const animatedStyle = useAnimatedStyle(() => {
        if (isCenter && expansionProgress.value > 0) {
            const maxDim = Math.max(width, height) * 2; // Increase multiplier for safe coverage
            const scale = 1 + (maxDim / w) * expansionProgress.value;

            return {
                transform: [
                    { translateY: translateY.value },
                    { scale: scale }
                ],
                zIndex: 10,
                opacity: 1,
            };
        }

        return {
            transform: [{ translateY: translateY.value }],
            opacity: opacity.value * containerOpacity.value,
            zIndex: isCenter ? 5 : 1,
        };
    });

    return (
        <Animated.View
            style={[
                styles.block,
                {
                    left: finalX,
                    width: w,
                    height: h,
                    backgroundColor: color,
                    position: 'absolute',
                    borderRadius: expansionProgress.value > 0.01 ? 0 : 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                },
                animatedStyle,
            ]}
        />
    );
};

const BLOCK_SIZE = 40;
const HOUSE_WIDTH = BLOCK_SIZE * 3;
const CENTER_X = width / 2 - HOUSE_WIDTH / 2;
const CENTER_Y = height / 2 - (BLOCK_SIZE * 2.5);

const BLOCKS_CONFIG = [
    { id: 1, x: 0, y: BLOCK_SIZE * 2, w: BLOCK_SIZE, h: BLOCK_SIZE, color: COLORS.block1, delay: 0 },
    { id: 2, x: BLOCK_SIZE, y: BLOCK_SIZE * 2, w: BLOCK_SIZE, h: BLOCK_SIZE, color: COLORS.block2, delay: 100, isCenter: true },
    { id: 3, x: BLOCK_SIZE * 2, y: BLOCK_SIZE * 2, w: BLOCK_SIZE, h: BLOCK_SIZE, color: COLORS.block3, delay: 200 },
    { id: 4, x: 0, y: BLOCK_SIZE, w: BLOCK_SIZE, h: BLOCK_SIZE, color: COLORS.block4, delay: 300 },
    { id: 5, x: BLOCK_SIZE * 2, y: BLOCK_SIZE, w: BLOCK_SIZE, h: BLOCK_SIZE, color: COLORS.block5, delay: 400 },
    { id: 6, x: 0, y: 0, w: BLOCK_SIZE * 1.5, h: BLOCK_SIZE, color: COLORS.block6, delay: 600 },
    { id: 7, x: BLOCK_SIZE * 1.5, y: 0, w: BLOCK_SIZE * 1.5, h: BLOCK_SIZE, color: COLORS.block7, delay: 700 },
    { id: 8, x: BLOCK_SIZE * 1.1, y: BLOCK_SIZE * 2.2, w: BLOCK_SIZE * 0.8, h: BLOCK_SIZE * 0.8, color: COLORS.block8, delay: 900 },
];

export const SplashAnimation = ({ onFinish }: { onFinish: () => void }) => {
    const houseOpacity = useSharedValue(1);
    const expansionProgress = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.5);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const waveProgress = useSharedValue(0);
    const [phase, setPhase] = useState<'house' | 'expand' | 'logo' | 'wave'>('house');

    useEffect(() => {
        // Phase 1 to Phase 2: Wait for assembly to settle then Expand
        const houseFinishTime = 900 + 500; // Last block delay + spring time
        const timeout = setTimeout(() => {
            runOnJS(setPhase)('expand');
        }, houseFinishTime + TIMING.SETTLE_HOUSE);

        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (phase === 'expand') {
            expansionProgress.value = withTiming(1, {
                duration: TIMING.EXPAND_DURATION,
                easing: Easing.bezier(0.4, 0, 0.2, 1)
            }, () => {
                runOnJS(setPhase)('logo');
            });
            // Fade out other blocks quickly
            houseOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'logo') {
            // Smooth Logo Reveal after expansion is done
            logoOpacity.value = withTiming(1, { duration: TIMING.LOGO_FADE_IN });
            logoScale.value = withSpring(1, {
                damping: 12,
                stiffness: 90,
            });

            // "Builder" text appears 1 second after logo starts
            textOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
            textTranslateY.value = withDelay(1000, withSpring(0, { damping: 15 }));

            // Phase 3 to Phase 4: Wait for logo to settle then trigger Wave
            // We extend settle time slightly to accommodate text appearing
            const waveTimeout = setTimeout(() => {
                runOnJS(setPhase)('wave');
            }, TIMING.LOGO_FADE_IN + TIMING.SETTLE_LOGO + 1000);

            return () => clearTimeout(waveTimeout);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'wave') {
            waveProgress.value = withTiming(1, {
                duration: TIMING.WAVE_DURATION,
                easing: Easing.out(Easing.quad)
            }, () => {
                runOnJS(onFinish)();
            });
        }
    }, [phase, onFinish]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }, { translateY: -40 }],
        zIndex: 25,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
        zIndex: 26,
    }));

    const waveAnimatedProps = useAnimatedProps(() => {
        const p = waveProgress.value;
        const waveDepth = 150;
        // currentY starts above the screen and moves down to cover the entire screen
        const currentY = -waveDepth + (p * (height + waveDepth * 2));

        // Wave moving from TOP to BOTTOM
        // The "filled" part is the rectangle from the top down to this wave line
        const d = `M 0 0
               H ${width}
               V ${currentY}
               Q ${width * 0.75} ${currentY + 60} ${width * 0.5} ${currentY}
               T 0 ${currentY}
               V 0
               Z`;

        return { d, opacity: p > 0 ? 1 : 0 };
    });

    return (
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
            {/* Phase 1 & 2: House and Expansion */}
            <View style={[styles.houseContainer, { left: CENTER_X, top: CENTER_Y }]}>
                {BLOCKS_CONFIG.map((block) => (
                    <Block
                        key={block.id}
                        id={block.id}
                        finalX={block.x}
                        finalY={block.y}
                        width={block.w}
                        height={block.h}
                        color={block.color}
                        delay={block.delay}
                        containerOpacity={houseOpacity}
                        expansionProgress={expansionProgress}
                        isCenter={!!block.isCenter}
                    />
                ))}
            </View>

            {/* Phase 3: Logo and Text Reveal */}
            {(phase === 'logo' || phase === 'wave') && (
                <>
                    <Animated.View style={[styles.logoContainer, logoStyle]}>
                        <Image
                            source={require('../../assets/images/builder-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>
                    <Animated.View style={[styles.textContainer, textStyle]}>
                        <Animated.Text style={styles.builderText}>Builder</Animated.Text>
                    </Animated.View>
                </>
            )}

            {/* Phase 4: Liquid Wave Transition */}
            <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="none">
                <Svg width={width} height={height}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={COLORS.waveGradientStart} stopOpacity="1" />
                            <Stop offset="1" stopColor={COLORS.waveGradientEnd} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <AnimatedPath animatedProps={waveAnimatedProps} fill="url(#grad)" />
                </Svg>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    houseContainer: {
        width: HOUSE_WIDTH,
        height: BLOCK_SIZE * 3,
        position: 'absolute',
    },
    block: {
        // Base styles handled in props
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: width,
        height: height,
    },
    logo: {
        width: 220,
        height: 220,
    },
    textContainer: {
        position: 'absolute',
        top: height / 2 + 80,
        width: width,
        alignItems: 'center',
    },
    builderText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#333',
        letterSpacing: 2,
    },
});
