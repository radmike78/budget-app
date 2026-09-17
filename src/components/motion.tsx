import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

let reduceMotion: boolean | null = null;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduceMotion = v; }).catch(() => { reduceMotion = false; });

/** Runs a short timing animation unless the phone asks for reduced motion. */
export function useSettle(value: number, duration = 500): Animated.Value {
  const anim = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    if (reduceMotion) { anim.setValue(value); return; }
    Animated.timing(anim, { toValue: value, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [anim, value, duration]);
  return anim;
}

/**
 * A number that counts up to its value the first time it changes, then settles.
 * `render` formats the in-between values (money, percent…).
 */
export function useCountUp(value: number, duration = 600): number {
  const [shown, setShown] = useState(value);
  const anim = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    if (reduceMotion) { setShown(value); return; }
    const id = anim.addListener(({ value: v }) => setShown(v));
    Animated.timing(anim, { toValue: value, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => setShown(value));
    return () => anim.removeListener(id);
  }, [anim, value, duration]);
  return shown;
}
