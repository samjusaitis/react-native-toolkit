import {
   AnimatableValue,
   AnimationCallback,
   WithSpringConfig,
   WithTimingConfig,
   withSpring,
   withTiming,
} from 'react-native-reanimated';

/**
 * Helper worklet to run either `withSpring` or `withTiming` based on the
 * provided `animationConfig`.
 *
 * NOTE: if passing a `callback`, ensure to define it as a 'worklet'.
 */
export const withAnimation = <T extends AnimatableValue>(
   toValue: T,
   animationConfig: WithTimingConfig | WithSpringConfig,
   callback?: AnimationCallback,
) => {
   const isSpringConfig =
      'mass' in animationConfig || 'dampingRatio' in animationConfig;

   if (isSpringConfig) {
      return withSpring(toValue, animationConfig, callback);
   }

   return withTiming(toValue, animationConfig, callback);
};
