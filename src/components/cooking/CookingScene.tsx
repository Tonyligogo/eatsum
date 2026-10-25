import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

import { useReducedMotion } from "@/features/cooking/useReducedMotion";
import { useEffect, useRef } from "react";
import { EatSumMascot } from "../companion/EatSumMascot";

type Props = {
  width: number;
  height: number;
  active?: boolean;
};

export function CookingScene({ width, height, active = true }: Props) {
  const sceneWidth = Math.max(0, width);
  const sceneHeight = Math.max(0, height);

  const mascotWidth = Math.min(sceneWidth * 0.94, sceneHeight * 1.13, 390);

  const mascotHeight = mascotWidth * (550 / 780);

  // Move the mascot and cooker cluster higher
  //   const visualBaseOffset = Math.min(sceneHeight * 0.22, 96);
  const visualBaseOffset = Math.min(sceneHeight * 0.25, 122);

  // Keep steam closer to the pot
  const steamBottom =
    visualBaseOffset + Math.min(155, sceneHeight * 0.34) * 0.01;

  const reduceMotion = useReducedMotion();

  const mascotY = useRef(new Animated.Value(0)).current;

  const steamY = useRef(new Animated.Value(0)).current;

  const steamOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    mascotY.stopAnimation();
    steamY.stopAnimation();
    steamOpacity.stopAnimation();

    mascotY.setValue(0);
    steamY.setValue(0);
    steamOpacity.setValue(0.8);

    if (!active || reduceMotion) return;

    const mascotAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotY, {
          toValue: -7,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(mascotY, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    );

    const steamAnimation = Animated.loop(
      Animated.parallel([
        Animated.timing(steamY, {
          toValue: -28,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(steamOpacity, {
            toValue: 0.9,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(steamOpacity, {
            toValue: 0,
            duration: 2850,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    mascotAnimation.start();
    steamAnimation.start();

    return () => {
      mascotAnimation.stop();
      steamAnimation.stop();
    };
  }, [active, reduceMotion, mascotY, steamY, steamOpacity]);

  return (
    <View
      style={[
        styles.scene,
        {
          width: sceneWidth,
          height: sceneHeight,
        },
      ]}
      pointerEvents="none"
    >
      {/* Decorative background wave */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 420"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Path
          d="
            M-35 265
            C45 170 84 135 148 210
            C205 280 230 348 305 266
            C355 208 384 174 435 185
          "
          stroke="#E8D9FF"
          strokeWidth={12}
          strokeLinecap="round"
          opacity={0.8}
          fill="none"
        />

        <Path
          d="
            M-45 365
            C45 315 92 350 150 386
            C225 435 313 367 435 300
          "
          stroke="#BFA5FF"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.45}
          fill="none"
        />

        <Circle cx={340} cy={92} r={45} fill="#FFFFFF" opacity={0.07} />

        <Circle cx={55} cy={130} r={25} fill="#FFFFFF" opacity={0.07} />
      </Svg>

      {/* Mascot */}
      <Animated.View
        style={[
          styles.mascot,
          {
            width: mascotWidth,
            height: mascotHeight,
            bottom: visualBaseOffset,
            transform: [{ translateY: mascotY }],
          },
        ]}
      >
        <EatSumMascot mood="chef" width={mascotWidth} />
      </Animated.View>

      {/* Cooking counter and stove */}
      <Svg
        width={sceneWidth}
        height={Math.min(155, sceneHeight * 0.32)}
        viewBox="0 0 390 155"
        style={[
          styles.stove,
          {
            bottom: visualBaseOffset - 100,
          },
        ]}
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Stove shadow */}
        <Ellipse
          cx={195}
          cy={144}
          rx={170}
          ry={11}
          fill="#3C1B80"
          opacity={0.3}
        />

        {/* Back of cooktop */}
        <Rect x={47} y={57} width={296} height={35} rx={17} fill="#51309C" />

        {/* Top surface */}
        <Rect x={28} y={81} width={334} height={24} rx={12} fill="#442780" />

        {/* Main stove body */}
        <Rect x={38} y={96} width={314} height={53} rx={17} fill="#5A35AF" />

        <Path
          d="M48 107 H342"
          stroke="#A88AE7"
          strokeWidth={3}
          opacity={0.65}
          strokeLinecap="round"
        />

        {/* Pot */}
        <Ellipse cx={195} cy={63} rx={90} ry={17} fill="#332750" />

        <Path
          d="
            M110 63
            L124 91
            Q195 113 266 91
            L280 63
            Z
          "
          fill="#DDD4F5"
        />

        <Ellipse cx={195} cy={62} rx={85} ry={13} fill="#41365D" />

        <Ellipse cx={195} cy={59} rx={69} ry={8} fill="#9885C2" />

        {/* Pot handles */}
        <Path
          d="M114 74 H94 M276 74 H296"
          stroke="#DED4F2"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {/* Control knobs */}
        <Circle cx={83} cy={123} r={8} fill="#EDE9FE" />
        <Circle cx={111} cy={123} r={8} fill="#EDE9FE" />

        <Circle cx={83} cy={123} r={3} fill="#7C3AED" />

        <Circle cx={111} cy={123} r={3} fill="#7C3AED" />

        {/* Small status indicator */}
        <Circle cx={304} cy={122} r={5} fill="#C4B5FD" />
      </Svg>

      {/* Steam closer to pot */}

      <Animated.View
        style={[
          styles.steam,
          {
            bottom:
              visualBaseOffset - 100 + Math.min(155, sceneHeight * 0.34) * 0.62,
            width: 115,
            height: 100,
            opacity: steamOpacity,
            transform: [{ translateY: steamY }],
          },
        ]}
      >
        <Svg width={115} height={100} viewBox="0 0 115 100">
          <G fill="none" stroke="#FFFFFF" strokeLinecap="round" opacity={0.72}>
            <Path
              d="M25 96 C9 72 38 63 25 42 C16 25 28 19 34 7"
              strokeWidth={5}
            />

            <Path
              d="M58 96 C43 70 76 60 58 37 C46 22 63 15 66 3"
              strokeWidth={6}
            />

            <Path
              d="M91 96 C73 73 105 60 90 41 C80 27 92 18 95 9"
              strokeWidth={5}
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  mascot: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 2,
  },

  stove: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 3,
  },

  steam: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 4,
  },
});
