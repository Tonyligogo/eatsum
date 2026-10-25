import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
} from "expo-audio";

const KITCHEN_AUDIO = require("../../../assets/audio/kitchen-calm.mp3");

export function useCookingAudio() {
  const player = useAudioPlayer(KITCHEN_AUDIO);
  const status = useAudioPlayerStatus(player);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.35;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch((err) => {
      console.error("Cooking audio configuration:", err);
      setError("Music is unavailable.");
    });
  }, [player]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const toggle = useCallback(() => {
    if (status.playing) {
      player.pause();
      return;
    }

    if (!status.isLoaded) {
      setError("Music is still loading.");
      return;
    }

    setError(null);
    player.play();
  }, [player, status.playing, status.isLoaded]);

  // Stop playback when leaving the Cooking route.
  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();
        player.seekTo(0).catch(console.error);
      };
    }, [player]),
  );

  // Pause when the user switches away from EatSum.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        player.pause();
      }
    });

    return () => subscription.remove();
  }, [player]);

  return {
    playing: status.playing,
    loading: !status.isLoaded,
    error,
    toggle,
    pause,
  };
}
