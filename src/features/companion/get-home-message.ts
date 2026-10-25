type HomeMessageInput = {
  hour: number;
  todayCount: number;
  lastEatingTime: number | null;
};

export function getHomeMessage({
  hour,
  todayCount,
  lastEatingTime,
}: HomeMessageInput): string {
  // The first priority is acknowledging
  // that the user has already checked in.
  if (lastEatingTime !== null) {
    const minutesSince = (Date.now() - lastEatingTime) / 60000;

    if (minutesSince >= 0 && minutesSince < 45) {
      return "Nice one, chef! Now that's what I'm talking about! 😄";
    }
  }

  if (hour >= 5 && hour < 11) {
    return todayCount === 0
      ? "Morning! What's the breakfast situation? 👀"
      : "Morning's looking good! What's next? 😄";
  }

  if (hour >= 11 && hour < 16) {
    return "Any lunch plans, or are we still figuring it out? 😂";
  }

  if (hour >= 16 && hour < 21) {
    return "Hey, chef! What sounds good for dinner? 🍳";
  }

  return "Still up? I'm here if you fancy something to eat. 💜";
}

export function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Good morning ☀️";
  if (hour >= 12 && hour < 17) return "Good afternoon ☀️";
  if (hour >= 17 && hour < 21) return "Good evening 🌙";
  return "Hey, night owl 🌙";
}
