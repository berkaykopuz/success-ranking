import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

interface RangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onValueChange: (min: number, max: number) => void;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  onDragStateChange?: (isDragging: boolean) => void;
}

const THUMB_SIZE = 24;

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  minValue,
  maxValue,
  onValueChange,
  step = 1,
  label,
  formatValue = (val) => Math.round(val).toString(),
  onDragStateChange,
}) => {
  const [width, setWidth] = useState(0);
  const [minInputText, setMinInputText] = useState<string | null>(null);
  const [maxInputText, setMaxInputText] = useState<string | null>(null);
  
  // Preview values for smooth visual updates
  const [previewMinValue, setPreviewMinValue] = useState(minValue);
  const [previewMaxValue, setPreviewMaxValue] = useState(maxValue);
  
  const positionMin = useSharedValue(0);
  const positionMax = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const contextMin = useSharedValue(0);
  const contextMax = useSharedValue(0);

  // Pressed state and scale for visual feedback
  const minPressed = useSharedValue(false);
  const maxPressed = useSharedValue(false);
  const minScale = useSharedValue(1);
  const maxScale = useSharedValue(1);

  useEffect(() => {
    if (!isDragging.value) {
      setPreviewMinValue(minValue);
      setPreviewMaxValue(maxValue);
    }
  }, [minValue, maxValue, isDragging.value]);

  useEffect(() => {
    if (width > 0 && !isDragging.value) {
      positionMin.value = ((minValue - min) / (max - min)) * width;
      positionMax.value = ((maxValue - min) / (max - min)) * width;
    }
  }, [width, min, max, minValue, maxValue]);

  const updatePreviewValues = (newMinPos: number, newMaxPos: number) => {
    'worklet';
    const rawMin = min + (newMinPos / width) * (max - min);
    const rawMax = min + (newMaxPos / width) * (max - min);
    runOnJS(setPreviewMinValue)(rawMin);
    runOnJS(setPreviewMaxValue)(rawMax);
  };

  const commitValues = (newMinPos: number, newMaxPos: number, isMinThumb: boolean) => {
    'worklet';
    const rawMin = min + (newMinPos / width) * (max - min);
    const rawMax = min + (newMaxPos / width) * (max - min);
    const steppedMin = Math.round(rawMin / step) * step;
    const steppedMax = Math.round(rawMax / step) * step;

    positionMin.value = ((steppedMin - min) / (max - min)) * width;
    positionMax.value = ((steppedMax - min) / (max - min)) * width;

    runOnJS(setPreviewMinValue)(steppedMin);
    runOnJS(setPreviewMaxValue)(steppedMax);
    runOnJS(onValueChange)(steppedMin, steppedMax);
  };

  const minGesture = Gesture.Pan()
    .onBegin(() => {
      // Visual feedback when interaction starts
      minPressed.value = true;
      minScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
    })
    .onStart(() => {
      contextMin.value = positionMin.value;
      isDragging.value = true;
      if (onDragStateChange) runOnJS(onDragStateChange)(true);
    })
    .onUpdate((e) => {
      const newPos = contextMin.value + e.translationX;
      positionMin.value = Math.min(Math.max(0, newPos), positionMax.value);
      updatePreviewValues(positionMin.value, positionMax.value);
    })
    .onEnd(() => {
      commitValues(positionMin.value, positionMax.value, true);
      isDragging.value = false;
      minPressed.value = false;
      minScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (onDragStateChange) runOnJS(onDragStateChange)(false);
    })
    .onFinalize(() => {
      isDragging.value = false;
      minPressed.value = false;
      minScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (onDragStateChange) runOnJS(onDragStateChange)(false);
    });

  const maxGesture = Gesture.Pan()
    .onBegin(() => {
      // Visual feedback when interaction starts
      maxPressed.value = true;
      maxScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
    })
    .onStart(() => {
      contextMax.value = positionMax.value;
      isDragging.value = true;
      if (onDragStateChange) runOnJS(onDragStateChange)(true);
    })
    .onUpdate((e) => {
      const newPos = contextMax.value + e.translationX;
      positionMax.value = Math.max(Math.min(width, newPos), positionMin.value);
      updatePreviewValues(positionMin.value, positionMax.value);
    })
    .onEnd(() => {
      commitValues(positionMin.value, positionMax.value, false);
      isDragging.value = false;
      maxPressed.value = false;
      maxScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (onDragStateChange) runOnJS(onDragStateChange)(false);
    })
    .onFinalize(() => {
      isDragging.value = false;
      maxPressed.value = false;
      maxScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (onDragStateChange) runOnJS(onDragStateChange)(false);
    });

  const minThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionMin.value - THUMB_SIZE / 2 },
      { scale: minScale.value },
    ],
    zIndex: positionMin.value > width / 2 ? 10 : 1,
  }));

  const maxThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionMax.value - THUMB_SIZE / 2 },
      { scale: maxScale.value },
    ],
    zIndex: positionMax.value < width / 2 ? 10 : 1,
  }));

  const minThumbInnerStyle = useAnimatedStyle(() => ({
    backgroundColor: minPressed.value ? '#1e40af' : '#2563eb',
  }));

  const maxThumbInnerStyle = useAnimatedStyle(() => ({
    backgroundColor: maxPressed.value ? '#1e40af' : '#2563eb',
  }));

  const trackStyle = useAnimatedStyle(() => ({
    left: positionMin.value,
    width: positionMax.value - positionMin.value,
  }));

  // Handle tap on track to move nearest thumb
  const handleTrackTap = (tapX: number) => {
    'worklet';
    if (width <= 0) return;
    
    // Calculate which thumb is closer
    const distanceToMin = Math.abs(tapX - positionMin.value);
    const distanceToMax = Math.abs(tapX - positionMax.value);
    
    // Clamp tap position to valid range
    const clampedX = Math.max(0, Math.min(width, tapX));
    
    if (distanceToMin < distanceToMax) {
      // Move min thumb
      const newPos = Math.min(clampedX, positionMax.value);
      positionMin.value = newPos;
      // Provide visual feedback
      minPressed.value = true;
      minScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
      // Update and commit values
      updatePreviewValues(newPos, positionMax.value);
      commitValues(newPos, positionMax.value, true);
      // Reset visual feedback
      minScale.value = withSpring(1, { damping: 15, stiffness: 300 }, () => {
        minPressed.value = false;
      });
    } else {
      // Move max thumb
      const newPos = Math.max(clampedX, positionMin.value);
      positionMax.value = newPos;
      // Provide visual feedback
      maxPressed.value = true;
      maxScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
      // Update and commit values
      updatePreviewValues(positionMin.value, newPos);
      commitValues(positionMin.value, newPos, false);
      // Reset visual feedback
      maxScale.value = withSpring(1, { damping: 15, stiffness: 300 }, () => {
        maxPressed.value = false;
      });
    }
  };

  const trackTapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      'worklet';
      // Only handle tap if not dragging and width is set
      if (!isDragging.value && width > 0) {
        // Get tap position relative to track container
        // Account for marginHorizontal: 10, padding doesn't affect X position
        const tapX = Math.max(0, Math.min(width, e.x - 10)); // 10 is marginHorizontal
        handleTrackTap(tapX);
      }
    });

  const handleMinInputChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setMinInputText(cleanedText);
    const val = parseFloat(cleanedText);
    if (!isNaN(val) && cleanedText !== '' && val >= min && val <= max) {
      if (val <= maxValue - step) {
        onValueChange(val, maxValue);
      }
    }
  };

  const handleMaxInputChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setMaxInputText(cleanedText);
    const val = parseFloat(cleanedText);
    if (!isNaN(val) && cleanedText !== '' && val >= min && val <= max) {
      if (val >= minValue + step) {
        onValueChange(minValue, val);
      }
    }
  };

  const handleMinInputBlur = () => {
    if (minInputText !== null) {
      const val = parseFloat(minInputText);
      if (isNaN(val) || val < min || val > max) {
        setMinInputText(null);
      } else {
        const finalVal = Math.max(min, Math.min(val, maxValue - step));
        onValueChange(finalVal, maxValue);
        setMinInputText(null);
      }
    }
  };

  const handleMaxInputBlur = () => {
    if (maxInputText !== null) {
      const val = parseFloat(maxInputText);
      if (isNaN(val) || val < min || val > max) {
        setMaxInputText(null);
      } else {
        const finalVal = Math.min(max, Math.max(val, minValue + step));
        onValueChange(minValue, finalVal);
        setMaxInputText(null);
      }
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.header}>
        <InputBox 
          label="MİNİMUM" 
          value={minInputText !== null ? minInputText : formatValue(previewMinValue)} 
          onChange={handleMinInputChange}
          onBlur={handleMinInputBlur}
        />
        <Text style={styles.separator}>-</Text>
        <InputBox 
          label="MAKSİMUM" 
          value={maxInputText !== null ? maxInputText : formatValue(previewMaxValue)} 
          onChange={handleMaxInputChange}
          onBlur={handleMaxInputBlur}
        />
      </View>

      <GestureDetector gesture={trackTapGesture}>
        <View style={styles.trackContainer} onLayout={onLayout}>
          <View style={styles.trackBackground} />
          <Animated.View style={[styles.trackActive, trackStyle]} />

          <GestureDetector gesture={minGesture}>
            <Animated.View style={[styles.thumb, minThumbStyle]}>
              <Animated.View style={[styles.thumbInner, minThumbInnerStyle]} />
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={maxGesture}>
            <Animated.View style={[styles.thumb, maxThumbStyle]}>
              <Animated.View style={[styles.thumbInner, maxThumbInnerStyle]} />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const InputBox = ({ label, value, onChange, onBlur }: { label: string, value: string, onChange: (t: string) => void, onBlur?: () => void }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8', 
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  separator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    padding: 0,
    minWidth: 40,
    textAlign: 'center',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    // Removed width: '100%' so margins can take effect properly
    marginHorizontal: 10, // Adds spacing from the edges
    // Add padding to increase touchable area (like the CSS solution)
    paddingVertical: 18, // Increases vertical touchable area significantly
    paddingHorizontal: 0,
    // Make the entire padded area touchable with transparent background
    backgroundColor: 'transparent',
  },
  trackBackground: {
    height: 3, // Reduced from 4 for a sleeker look
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    width: '100%',
  },
  trackActive: {
    position: 'absolute',
    height: 3, // Reduced from 4
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});