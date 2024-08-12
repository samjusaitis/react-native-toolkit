import { ReactNode, useEffect } from 'react';
import {
   LayoutChangeEvent,
   StyleProp,
   ViewStyle,
   StyleSheet,
   View,
} from 'react-native';

import Animated, {
   WithSpringConfig,
   interpolate,
   runOnJS,
   useAnimatedStyle,
   useSharedValue,
} from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/springUtils';

import { useResettablePersistedValue } from './hooks';
import { withAnimation } from './utils';

type SizeDimension = 'width' | 'height';

interface Props {
   children: ReactNode;
   /**
    * Whether this component should transition its visibility by
    * animating 'height' or 'width'
    *
    * @default: 'height'
    */
   dimension?: SizeDimension;
   /**
    * Whether to animate any changes in size once the `children` have
    * become visible. Also accepts a callback that to determine the
    * value based on the current and previous size.
    *
    * @default: true
    */
   animateSizeChanges?:
      | boolean
      | ((size: number, previousSize: number) => boolean);
   /**
    * Whether to animate the height or width dimension prior to
    * animating the opacity.
    *
    * @default: false
    */
   animateSizeBeforeOpacity?: boolean;
   /**
    * Spring config for the animation.
    */
   animationConfig?: SpringConfig;
   /**
    * Optional ViewStyle to pass to the container. Won't have any
    * impact on the `children` content.
    */
   style?: StyleProp<ViewStyle>;
}

enum TransitionState {
   'ENTERING' = 'entering',
   'EXITING' = 'exiting',
}

const DEFAULT_ANIMATION_CONFIG: WithSpringConfig = {
   mass: 1,
   damping: 25,
   stiffness: 100,
   restDisplacementThreshold: 0.01,
};

/**
 * Wrapper component that will animate its height to match the size of
 * its `children`. Pass a falsey value for `children` to animate to/from
 * a height of 0.
 */
export const AnimatedSizeView = (props: Props) => {
   const {
      children,
      dimension = 'height',
      style,
      animateSizeBeforeOpacity = false,
      animateSizeChanges = true,
      animationConfig = DEFAULT_ANIMATION_CONFIG,
   } = props;

   const hasChildren = !!children;
   const isHeightBased = dimension === 'height';

   const animatedVisibility = useSharedValue(hasChildren ? 1 : 0);
   const transitionState = useSharedValue(
      animatedVisibility.value
         ? TransitionState.EXITING
         : TransitionState.ENTERING,
   );
   const currentLength = useSharedValue(0);

   const [persistedChildren, resetPersistedChildren] =
      useResettablePersistedValue(children);

   const onContentLayout = (event: LayoutChangeEvent) => {
      const length = event.nativeEvent.layout[dimension];

      const isHiddenOrInitialising = currentLength.value === 0;
      const animateChange =
         typeof animateSizeChanges === 'function'
            ? animateSizeChanges(length, currentLength.value)
            : animateSizeChanges;

      if (!isHiddenOrInitialising && animateChange) {
         currentLength.value = withAnimation(length, animationConfig);
      } else {
         currentLength.value = length;
      }
   };

   const animatedContainerStyle = useAnimatedStyle(() => {
      const isExiting = transitionState.value === TransitionState.EXITING;

      const opacityInputRange = animateSizeBeforeOpacity
         ? isExiting
            ? [0.4, 1]
            : [0.4, 1]
         : [0.3, 1];
      const lengthInputRange = animateSizeBeforeOpacity
         ? isExiting
            ? [0, 0.6]
            : [0, 0.6]
         : [0, 1];

      const opacity = interpolate(
         animatedVisibility.value,
         opacityInputRange,
         [0, 1],
         'clamp',
      );
      const length = interpolate(
         animatedVisibility.value,
         lengthInputRange,
         [0, currentLength.value],
         'clamp',
      );

      const output: StyleProp<ViewStyle> = { opacity };

      if (isHeightBased) {
         output.height = length;
      } else {
         output.width = length;
      }

      return output;
   });

   useEffect(() => {
      const toValue = hasChildren ? 1 : 0;
      transitionState.value = toValue
         ? TransitionState.ENTERING
         : TransitionState.EXITING;
      animatedVisibility.value = withAnimation(
         toValue,
         animationConfig,
         (finished) => {
            'worklet';
            if (finished && toValue === 0) {
               runOnJS(resetPersistedChildren)();
            }
         },
      );
   }, [
      animatedVisibility,
      transitionState,
      hasChildren,
      resetPersistedChildren,
      animationConfig,
   ]);

   return (
      <Animated.View
         style={[
            style,
            animatedContainerStyle,
            isHeightBased
               ? styles.containerForHeight
               : styles.containerForWidth,
         ]}
      >
         <View
            onLayout={onContentLayout}
            style={[
               styles.contentContainer,
               isHeightBased
                  ? styles.contentContainerForHeight
                  : styles.contentContainerForWidth,
            ]}
         >
            {children || persistedChildren}
         </View>
      </Animated.View>
   );
};

const styles = StyleSheet.create({
   containerForHeight: {
      overflow: 'hidden',
      flexDirection: 'column',
      width: '100%',
   },
   containerForWidth: {
      overflow: 'hidden',
      flexDirection: 'row',
      height: '100%',
   },
   contentContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
   },
   contentContainerForHeight: {
      flexDirection: 'column',
      right: 0,
   },
   contentContainerForWidth: {
      flexDirection: 'row',
      bottom: 0,
   },
});
