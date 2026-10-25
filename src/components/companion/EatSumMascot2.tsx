import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

import { palette } from "../../theme";

import type { CompanionMood } from "@/features/companion/moods";

type EatSumMascotProps = {
  width?: number;
  height?: number;
  mood?: CompanionMood;
};

const BODY_COLOR = palette.purple[500];
const DARK = "#0B0B19";
const PUPIL = "#090F38";
const MOUTH = "#17203D";

export function EatSumMascot2({
  width = 390,
  height,
  mood = "relaxed",
}: EatSumMascotProps) {
  const isSleepy = mood === "sleepy";
  const isHappy = mood === "happy";
  const isCurious = mood === "curious";
  const isEncouraging = mood === "encouraging";
  const isProud = mood === "proud";
  const isChef = mood === "chef";

  // Different eye positions help communicate moods
  // without changing our mascot's original shape.
  const leftPupilX = isCurious ? 290 : 275;
  const rightPupilX = isCurious ? 516 : 501;

  const leftPupilY = isCurious ? 371 : 380;
  const rightPupilY = isCurious ? 371 : 380;

  return (
    <Svg
      width={width}
      height={height ?? width * (550 / 780)}
      viewBox="0 0 780 550"
      accessible
      accessibilityLabel={`EatSum mascot feeling ${mood}`}
    >
      {/* Original body with our three-part tuft */}
      <Path
        fill={BODY_COLOR}
        d="
          M18 217
          C87 132 206 105 344 103

          C340 84 346 68 358 60
          C370 52 383 56 393 68

          C400 49 417 40 433 45
          C448 50 457 63 458 80

          C469 64 483 59 495 64
          C511 71 513 89 503 103

          C620 109 707 141 762 217
          L762 462
          Q762 540 677 540
          L104 540
          Q18 540 18 462
          Z
        "
      />

      {/* Eyebrows */}
      <G fill="none" stroke={DARK} strokeWidth={23} strokeLinecap="round">
        {isCurious ? (
          <>
            <Path d="M211 167 Q247 136 286 168" />
            <Path d="M505 180 Q550 156 580 185" />
          </>
        ) : isEncouraging ? (
          <>
            <Path d="M208 172 Q245 139 288 174" />
            <Path d="M502 174 Q545 139 584 172" />
          </>
        ) : isProud ? (
          <>
            <Path d="M214 174 Q248 149 284 175" />
            <Path d="M508 175 Q546 149 578 174" />
          </>
        ) : isHappy ? (
          <>
            <Path d="M213 182 Q248 151 285 181" />
            <Path d="M508 181 Q548 151 579 182" />
          </>
        ) : isSleepy ? (
          <>
            <Path d="M214 185 Q249 169 285 185" />
            <Path d="M508 185 Q544 169 578 185" />
          </>
        ) : (
          <>
            <Path d="M214 186 Q244 155 285 180" />
            <Path d="M508 180 Q549 155 578 186" />
          </>
        )}
      </G>

      {/* Eyes */}
      {isProud ? (
        <G>
          {/* Happy closed eyes */}
          <Path
            d="M150 357 Q247 455 344 357"
            fill="none"
            stroke={DARK}
            strokeWidth={19}
            strokeLinecap="round"
          />

          <Path
            d="M442 357 Q539 455 636 357"
            fill="none"
            stroke={DARK}
            strokeWidth={19}
            strokeLinecap="round"
          />

          {/* Little happy creases */}
          <Path
            d="M147 348 L128 337"
            stroke={DARK}
            strokeWidth={9}
            strokeLinecap="round"
          />

          <Path
            d="M639 348 L658 337"
            stroke={DARK}
            strokeWidth={9}
            strokeLinecap="round"
          />
        </G>
      ) : (
        <>
          {/* White eyes */}
          <Ellipse cx={247} cy={353} rx={126} ry={124} fill="#FFFFFF" />
          <Ellipse cx={539} cy={353} rx={126} ry={124} fill="#FFFFFF" />

          {/* Pupils and highlights */}
          <G>
            <Ellipse
              cx={leftPupilX}
              cy={leftPupilY}
              rx={69}
              ry={71}
              fill={PUPIL}
            />

            <Ellipse
              cx={rightPupilX}
              cy={rightPupilY}
              rx={69}
              ry={71}
              fill={PUPIL}
            />

            <Ellipse
              cx={leftPupilX - 20}
              cy={leftPupilY - 29}
              rx={24}
              ry={26}
              fill="#FFFFFF"
            />

            <Ellipse
              cx={rightPupilX - 22}
              cy={rightPupilY - 29}
              rx={24}
              ry={26}
              fill="#FFFFFF"
            />

            <Circle
              cx={leftPupilX + 30}
              cy={leftPupilY - 17}
              r={10}
              fill="#25315E"
              opacity={0.55}
            />

            <Circle
              cx={rightPupilX + 29}
              cy={rightPupilY - 17}
              r={10}
              fill="#25315E"
              opacity={0.55}
            />
          </G>
        </>
      )}

      {/* Sleepy: mostly closed eyelids with a small
    portion of the eyes still visible */}
      {isSleepy && (
        <G>
          {/* Upper lids cover most of both eyes */}
          <Path
            d="
        M121 352
        C145 278 205 263 247 263
        C292 263 351 282 373 352
        L373 424
        Q247 394 121 424
        Z
      "
            fill={BODY_COLOR}
          />

          <Path
            d="
        M413 352
        C437 278 497 263 539 263
        C584 263 643 282 665 352
        L665 424
        Q539 394 413 424
        Z
      "
            fill={BODY_COLOR}
          />

          {/* Soft curved eyelid lines */}
          <Path
            d="M139 423 Q247 398 355 423"
            fill="none"
            stroke={DARK}
            strokeWidth={9}
            strokeLinecap="round"
          />

          <Path
            d="M431 423 Q539 398 647 423"
            fill="none"
            stroke={DARK}
            strokeWidth={9}
            strokeLinecap="round"
          />
        </G>
      )}

      {/* Mouth / expression */}
      {isProud ? (
        <Path
          d="M355 465 Q399 525 443 465"
          stroke={MOUTH}
          strokeWidth={13}
          strokeLinecap="round"
          fill="none"
        />
      ) : isHappy ? (
        <Path
          d="M360 469 Q399 512 438 469"
          stroke={MOUTH}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
        />
      ) : isCurious ? (
        <Ellipse cx={399} cy={480} rx={13} ry={18} fill={MOUTH} />
      ) : isEncouraging ? (
        <Path
          d="M354 466 Q399 516 444 466"
          stroke={MOUTH}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
        />
      ) : isSleepy ? (
        <Path
          d="M374 478 Q399 492 424 478"
          stroke={MOUTH}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <Path
          d="M372 474 Q399 486 426 474"
          stroke={MOUTH}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Blushing cheeks */}
      {(isHappy || isProud || isEncouraging) && (
        <G>
          <Ellipse
            cx={148}
            cy={453}
            rx={isProud ? 48 : 30}
            ry={isProud ? 25 : 15}
            fill="#FF9BB8"
            opacity={isProud ? 0.9 : 0.5}
          />

          <Ellipse
            cx={642}
            cy={453}
            rx={isProud ? 48 : 30}
            ry={isProud ? 25 : 15}
            fill="#FF9BB8"
            opacity={isProud ? 0.9 : 0.5}
          />

          {/* Extra blush marks for Proud */}
          {isProud && (
            <G
              stroke="#E66B99"
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.75}
            >
              <Path d="M134 447 L144 459" />
              <Path d="M150 445 L160 457" />

              <Path d="M626 447 L636 459" />
              <Path d="M642 445 L652 457" />
            </G>
          )}
        </G>
      )}

      {/* Larger, puffier chef hat */}
      {isChef && (
        <G>
          {/* Main fluffy upper section */}
          <Path
            d="
        M323 93
        C296 81 294 48 316 32
        C331 20 352 22 367 31

        C376 4 406 -6 430 8
        C445 16 453 27 458 38

        C477 18 505 22 521 40
        C541 63 531 94 506 101

        L506 131
        L323 131
        Z
      "
            fill="#FFFFFF"
            stroke="#DDD6FE"
            strokeWidth={5}
            strokeLinejoin="round"
          />

          {/* Wide lower band */}
          <Path
            d="
        M323 94
        L506 94
        L506 134
        Q414 142 323 134
        Z
      "
            fill="#F5F3FF"
            stroke="#DDD6FE"
            strokeWidth={4}
          />

          {/* Gentle fabric folds */}
          <Path
            d="M361 99 L361 132
         M414 99 L414 135
         M467 99 L467 132"
            fill="none"
            stroke="#DDD6FE"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </G>
      )}
    </Svg>
  );
}
