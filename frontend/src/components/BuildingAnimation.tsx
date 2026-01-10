import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Rect, Line, Circle, Path, G, Polygon } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    Easing,
    withSequence,
    useAnimatedStyle
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Color Configuration
const THEME = {
    sky: {
        clouds: {
            light: "#c9edff",
            medium: "#d8f2ff",
            dark: "#a7e2ff",
        },
        sun: {
            center: "#FFD54F",
            glow: "#FFEB3B",
        }
    },
    ground: {
        top: "#dbb370cc", // Top surface
        bushes: {
            light: "#a1cf3e",
            medium: "#7fb624",
            dark: "#63a315",
        }
    },
    house: {
        roof: {
            front: "#ffc656",
            side: "#f98425",
        },
        wall: {
            front: "#FFF8E1",
            side: "#FFE0B2",
            trim: "#FFFFFF",
        },
        detail: {
            door: "#bd8871",
            knob: "#fcc565",
            window: "#8D6E63",
            frame: "#FFFFFF",
        }
    },
    crane: {
        structure: "#F4D03F",
        counterweight: "#efa5b4",
        cable: "#333333",
        hook: "#89A0BC",
        pivot: "#333333",
    }
};

interface Props {
    running: boolean;
}

export default function BuildingAnimation({ running }: Props) {
    const craneRotation = useSharedValue(0);
    const cableLength = useSharedValue(0);
    const cloudX1 = useSharedValue(0); // Fast clouds
    const cloudX2 = useSharedValue(0); // Medium clouds
    const cloudX3 = useSharedValue(0); // Slow clouds
    const sunY = useSharedValue(0); // Sun bobbing
    const birdX = useSharedValue(-50); // Flying birds

    useEffect(() => {
        if (running) {
            // Crane arm rotation
            craneRotation.value = withRepeat(
                withSequence(
                    withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(15, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Cable lifting effect
            cableLength.value = withRepeat(
                withSequence(
                    withTiming(40, { duration: 1500 }),
                    withTiming(10, { duration: 1500 })
                ),
                -1,
                true
            );

            // Cloud animations with different speeds
            cloudX1.value = withRepeat(
                withTiming(width + 250, { duration: 8000, easing: Easing.linear }),
                -1,
                false
            );
            cloudX2.value = withRepeat(
                withTiming(width + 250, { duration: 12000, easing: Easing.linear }),
                -1,
                false
            );
            cloudX3.value = withRepeat(
                withTiming(width + 250, { duration: 18000, easing: Easing.linear }),
                -1,
                false
            );

            // Sun bobbing animation
            sunY.value = withRepeat(
                withSequence(
                    withTiming(8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Flying birds
            birdX.value = withRepeat(
                withTiming(width + 100, { duration: 6000, easing: Easing.linear }),
                -1,
                false
            );

        } else {
            craneRotation.value = withTiming(0);
            cableLength.value = withTiming(0);
            // cloudX.value = withTiming(0); // Optional: keep clouds floating or stop
        }
    }, [running]);

    const craneProps = useAnimatedProps(() => {
        return {
            transform: [
                { translateX: 150 },
                { translateY: 100 },
                { rotate: `${craneRotation.value}deg` },
                { translateX: -150 },
                { translateY: -100 },
            ] as any,
        };
    });

    // Cable hangs from y=120 (arm level) and extends down by cableLength
    const cableProps = useAnimatedProps(() => ({
        y2: 120 + 20 + cableLength.value  // Starts 20 below arm, extends with animation
    }));

    // Hook attaches to bottom of cable
    const blockProps = useAnimatedProps(() => ({
        y: 120 + 20 + cableLength.value - 5  // Slightly above cable end
    }));

    // Sun bobbing
    const sunProps = useAnimatedProps(() => ({
        transform: [{ translateY: sunY.value }]
    }));

    // Flying birds
    const birdProps = useAnimatedProps(() => ({
        transform: [{ translateX: birdX.value }]
    }));


    // Bird shape component
    const BirdShape = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
        <G transform={`translate(${x}, ${y}) scale(${scale})`}>
            <Path d="M0,0 Q5,-8 10,0 Q15,-8 20,0" stroke="#333" strokeWidth="2" fill="none" />
        </G>
    );

    // Cloud layers with different speeds
    const cloudStyleFast = useAnimatedProps(() => ({
        transform: [{ translateX: cloudX1.value - 100 }]
    }));

    const cloudStyleMedium = useAnimatedProps(() => ({
        transform: [{ translateX: cloudX2.value - 80 }]
    }));

    const cloudStyleSlow = useAnimatedProps(() => ({
        transform: [{ translateX: cloudX3.value - 60 }]
    }));

    // Reusing cloud shape for bushes (with flat bottom)
    const BushShape = ({ color }: { color: string }) => (
        <G>
            {/* Circles for top fluffiness */}
            <Circle cx="0" cy="0" r="15" fill={color} />
            <Circle cx="20" cy="-5" r="18" fill={color} />
            <Circle cx="40" cy="0" r="15" fill={color} />
            {/* Flat bottom rect to sit on ground */}
            <Rect x="-10" y="0" width="60" height="15" fill={color} />
        </G>
    );

    const CloudShape = ({ color }: { color: string }) => (
        <G>
            <Circle cx="0" cy="0" r="15" fill={color} />
            <Circle cx="20" cy="-5" r="18" fill={color} />
            <Circle cx="40" cy="0" r="15" fill={color} />
        </G>
    );

    const svgWidth = width * 0.85; // 85% of screen width for bigger frame

    return (
        <View style={styles.container}>
            {/* ViewBox sized for bigger frame */}
            <Svg height="260" width={svgWidth} viewBox="0 0 350 260" preserveAspectRatio="xMidYMid meet">

                {/* Sun with bobbing animation */}
                <AnimatedG animatedProps={sunProps}>
                    <Circle cx="300" cy="45" r="30" fill={THEME.sky.sun.glow} opacity="0.4" />
                    <Circle cx="300" cy="45" r="22" fill={THEME.sky.sun.center} />
                </AnimatedG>

                {/* Flying birds */}
                <AnimatedG animatedProps={birdProps}>
                    <BirdShape x={30} y={60} scale={0.8} />
                    <BirdShape x={50} y={45} scale={1} />
                    <BirdShape x={80} y={55} scale={0.7} />
                </AnimatedG>

                {/* 3D Ground Platform - covers ~80% of 350 viewBox width = 280 */}
                <G transform="translate(175, 230) skewX(-25)">
                    {/* Top Surface */}
                    <Rect x="-140" y="0" width="280" height="40" rx="12" fill={THEME.ground.top} />
                </G>

                {/* Bushes (Horizon) - Static on ground */}
                <G y="222">
                    <G transform="translate(60, 0) scale(0.6)"><BushShape color={THEME.ground.bushes.light} /></G>
                    <G transform="translate(100, 0) scale(0.7)"><BushShape color={THEME.ground.bushes.medium} /></G>
                    <G transform="translate(145, 0) scale(0.6)"><BushShape color={THEME.ground.bushes.light} /></G>
                    <G transform="translate(190, 0) scale(0.6)"><BushShape color={THEME.ground.bushes.light} /></G>
                    <G transform="translate(235, 0) scale(0.7)"><BushShape color={THEME.ground.bushes.medium} /></G>
                    <G transform="translate(275, 0) scale(0.6)"><BushShape color={THEME.ground.bushes.light} /></G>
                </G>

                {/* Animated Clouds - Variety in size, color, and speed */}
                {/* Fast clouds (front layer) */}
                <AnimatedG animatedProps={cloudStyleFast}>
                    <G x="50" y="40" transform="scale(1.1)"><CloudShape color={THEME.sky.clouds.light} /></G>
                    <G x="220" y="60" transform="scale(0.9)"><CloudShape color={THEME.sky.clouds.medium} /></G>
                </AnimatedG>

                {/* Medium speed clouds (middle layer) */}
                <AnimatedG animatedProps={cloudStyleMedium}>
                    <G x="0" y="80" opacity="0.8" transform="scale(0.85)"><CloudShape color={THEME.sky.clouds.medium} /></G>
                    <G x="180" y="30" opacity="0.9" transform="scale(1.0)"><CloudShape color={THEME.sky.clouds.light} /></G>
                </AnimatedG>

                {/* Slow clouds (back layer, darker/smaller) */}
                <AnimatedG animatedProps={cloudStyleSlow}>
                    <G x="100" y="50" opacity="0.6" transform="scale(0.7)"><CloudShape color={THEME.sky.clouds.dark} /></G>
                    <G x="280" y="70" opacity="0.5" transform="scale(0.6)"><CloudShape color={THEME.sky.clouds.dark} /></G>
                </AnimatedG>

                {/* Houses - Bigger with variety in sizes */}

                {/* Small House Left 1 */}
                <G transform="translate(55, 200) scale(0.5)">
                    <Rect x="-5" y="75" width="70" height="10" fill={THEME.house.wall.trim} />
                    <Polygon points="60,30 75,20 75,85 60,85" fill={THEME.house.wall.side} />
                    <Rect x="0" y="30" width="60" height="50" fill={THEME.house.wall.front} />
                    <Polygon points="60,30 30,0 45,-10 75,20" fill={THEME.house.roof.side} />
                    <Polygon points="-5,30 30,-5 65,30" fill={THEME.house.roof.front} />
                    <Rect x="22" y="50" width="16" height="30" fill={THEME.house.detail.door} />
                    <Rect x="20" y="48" width="20" height="34" fill="none" stroke={THEME.house.detail.frame} strokeWidth="2" />
                </G>

                {/* Medium House Left 2 */}
                <G transform="translate(100, 205) scale(0.55)">
                    <Rect x="-5" y="75" width="70" height="10" fill={THEME.house.wall.trim} />
                    <Polygon points="60,30 75,20 75,85 60,85" fill={THEME.house.wall.side} />
                    <Rect x="0" y="30" width="60" height="50" fill={THEME.house.wall.front} />
                    <Polygon points="60,30 30,0 45,-10 75,20" fill={THEME.house.roof.side} />
                    <Polygon points="-5,30 30,-5 65,30" fill={THEME.house.roof.front} />
                    <Rect x="22" y="50" width="16" height="30" fill={THEME.house.detail.door} />
                </G>

                {/* Crane (Centered) - Tower touches ground at y=230 */}
                <G>
                    {/* Tower: starts at y=120, height=110 so ends at y=230 (touches ground) */}
                    <Rect x="171" y="120" width="8" height="110" fill={THEME.crane.structure} />


                    <AnimatedG animatedProps={craneProps}>
                        {/* Back arm with counterweight */}
                        <Line x1="175" y1="120" x2="140" y2="120" stroke={THEME.crane.structure} strokeWidth="4" />
                        <Rect x="132" y="112" width="14" height="14" fill={THEME.crane.counterweight} />
                        {/* Front arm */}
                        <Line x1="175" y1="120" x2="230" y2="120" stroke={THEME.crane.structure} strokeWidth="4" />
                        {/* Cable hanging from arm at x=210, starts at y=120 (arm level) */}
                        <AnimatedLine x1="210" y1="120" x2="210" y2="160" stroke={THEME.crane.cable} strokeWidth="2" animatedProps={cableProps} />
                        {/* Hook at end of cable */}
                        <AnimatedRect x="203" y="155" width="14" height="10" fill={THEME.crane.hook} animatedProps={blockProps} />
                    </AnimatedG>
                    <Circle cx="175" cy="120" r="3" fill={THEME.crane.pivot} />
                </G>

                {/* Main House (Right - Big) */}
                <G transform="translate(195, 190) scale(0.7)">
                    <Rect x="-5" y="75" width="70" height="10" fill={THEME.house.wall.trim} />
                    <Polygon points="60,30 80,15 80,85 60,85" fill={THEME.house.wall.side} />
                    <Rect x="0" y="30" width="60" height="50" fill={THEME.house.wall.front} />
                    <Polygon points="60,30 30,0 50,-15 80,15" fill={THEME.house.roof.side} />
                    <Polygon points="-5,30 30,-5 65,30" fill={THEME.house.roof.front} />
                    <Rect x="20" y="48" width="20" height="34" fill={THEME.house.detail.frame} />
                    <Rect x="22" y="50" width="16" height="30" fill={THEME.house.detail.door} />
                    <Circle cx="36" cy="65" r="1.5" fill={THEME.house.detail.knob} />
                    <Polygon points="65,40 75,35 75,55 65,60" fill={THEME.house.detail.window} opacity="0.3" />
                </G>

                {/* Small House Far Right */}
                <G transform="translate(260, 205) scale(0.45)">
                    <Rect x="-5" y="75" width="70" height="10" fill={THEME.house.wall.trim} />
                    <Polygon points="60,30 75,20 75,85 60,85" fill={THEME.house.wall.side} />
                    <Rect x="0" y="30" width="60" height="50" fill={THEME.house.wall.front} />
                    <Polygon points="60,30 30,0 45,-10 75,20" fill={THEME.house.roof.side} />
                    <Polygon points="-5,30 30,-5 65,30" fill={THEME.house.roof.front} />
                    <Rect x="22" y="50" width="16" height="30" fill={THEME.house.detail.door} />
                </G>

            </Svg>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
});
