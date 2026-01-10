import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Rect, Line, Circle, Path, G } from 'react-native-svg';
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
const BUILDING_COLOR = '#4A90E2';
const CRANE_COLOR = '#F5A623';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
    running: boolean;
}

export default function BuildingAnimation({ running }: Props) {
    const craneRotation = useSharedValue(0);
    const cableLength = useSharedValue(0);
    const blockY = useSharedValue(0);
    const buildingOpacity = useSharedValue(0.5);

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

            // Building pulsating effect to simulate activity
            buildingOpacity.value = withRepeat(
                withTiming(1, { duration: 1000 }),
                -1,
                true
            );

        } else {
            craneRotation.value = withTiming(0);
            cableLength.value = withTiming(0);
            buildingOpacity.value = withTiming(0.5);
        }
    }, [running]);

    const craneProps = useAnimatedProps(() => {
        return {
            transform: [
                { translateX: 150 }, // Pivot point X
                { translateY: 100 }, // Pivot point Y
                { rotate: `${craneRotation.value}deg` },
                { translateX: -150 },
                { translateY: -100 },
            ] as any,
        };
    });

    const cableProps = useAnimatedProps(() => ({
        y2: 100 + cableLength.value
    }));

    const blockProps = useAnimatedProps(() => ({
        y: 90 + cableLength.value
    }));

    const buildingStyle = useAnimatedProps(() => ({
        opacity: buildingOpacity.value
    }));

    return (
        <View style={styles.container}>
            <Svg height="250" width={width} viewBox="0 0 300 250">
                {/* Ground */}
                <Line x1="0" y1="240" x2="300" y2="240" stroke="#333" strokeWidth="4" />

                {/* Building Structure */}
                <AnimatedRect
                    x="100"
                    y="140"
                    width="60"
                    height="100"
                    fill={BUILDING_COLOR}
                    animatedProps={buildingStyle}
                />
                <Rect x="110" y="150" width="10" height="15" fill="#fff" opacity="0.5" />
                <Rect x="140" y="150" width="10" height="15" fill="#fff" opacity="0.5" />
                <Rect x="110" y="180" width="10" height="15" fill="#fff" opacity="0.5" />
                <Rect x="140" y="180" width="10" height="15" fill="#fff" opacity="0.5" />
                <Rect x="110" y="210" width="10" height="15" fill="#fff" opacity="0.5" />
                <Rect x="140" y="210" width="10" height="15" fill="#fff" opacity="0.5" />

                {/* Crane Tower */}
                <Rect x="180" y="100" width="10" height="140" fill={CRANE_COLOR} />

                {/* Crane Arm Group */}
                <AnimatedG animatedProps={craneProps}>
                    {/* Back arm */}
                    <Line x1="185" y1="100" x2="140" y2="100" stroke={CRANE_COLOR} strokeWidth="5" />
                    {/* Counterweight */}
                    <Rect x="130" y="90" width="20" height="20" fill="#EDA800" />

                    {/* Front arm */}
                    <Line x1="185" y1="100" x2="260" y2="100" stroke={CRANE_COLOR} strokeWidth="5" />

                    {/* Cable */}
                    <Line x1="240" y1="100" x2="240" y2="120" stroke="#333" strokeWidth="2" />

                    {/* Moving Cable */}
                    <AnimatedLine x1="240" y1="100" x2="240" y2="140" stroke="#333" strokeWidth="2" animatedProps={cableProps} />

                    {/* Hook/Block */}
                    <AnimatedRect x="230" y="140" width="20" height="15" fill="#C0392B" animatedProps={blockProps} />
                </AnimatedG>

                {/* Crane Top Pivot */}
                <Circle cx="185" cy="100" r="4" fill="#333" />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
});
