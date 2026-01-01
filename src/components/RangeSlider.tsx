import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, PanResponder, Animated, TouchableWithoutFeedback, LayoutChangeEvent } from 'react-native';

interface RangeSliderProps {
    min: number;
    max: number;
    minValue: number;
    maxValue: number;
    onValueChange: (min: number, max: number) => void;
    step?: number;
    label?: string;
    formatValue?: (value: number) => string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    minValue,
    maxValue,
    onValueChange,
    step = 1,
    label,
    formatValue = (val) => Math.round(val).toString(),
}) => {
    const thumbSize = 24;
    const [sliderWidth, setSliderWidth] = useState(280);
    const [trackLayout, setTrackLayout] = useState({ x: 0, width: 280 });

    const minPosition = useMemo(() => {
        return ((minValue - min) / (max - min)) * sliderWidth;
    }, [minValue, min, max, sliderWidth]);

    const maxPosition = useMemo(() => {
        return ((maxValue - min) / (max - min)) * sliderWidth;
    }, [maxValue, min, max, sliderWidth]);

    const [minAnim] = React.useState(() => new Animated.Value(minPosition));
    const [maxAnim] = React.useState(() => new Animated.Value(maxPosition));
    const [activeThumb, setActiveThumb] = React.useState<'min' | 'max' | null>(null);
    const isDragging = useRef(false);
    const lastMinPosition = useRef(minPosition);
    const lastMaxPosition = useRef(maxPosition);
    const rafId = useRef<number | null>(null);
    const pendingValueChange = useRef<{ min: number; max: number } | null>(null);
    const startPosition = useRef<{ min: number; max: number }>({ min: 0, max: 0 });
    
    // State for editable inputs
    const [minInputValue, setMinInputValue] = useState(formatValue(minValue));
    const [maxInputValue, setMaxInputValue] = useState(formatValue(maxValue));
    const [isMinFocused, setIsMinFocused] = useState(false);
    const [isMaxFocused, setIsMaxFocused] = useState(false);

    React.useEffect(() => {
        // Only update if not dragging and position actually changed
        if (!isDragging.current && minPosition !== lastMinPosition.current) {
            minAnim.setValue(minPosition);
            lastMinPosition.current = minPosition;
        }
    }, [minPosition, minAnim]);

    React.useEffect(() => {
        // Only update if not dragging and position actually changed
        if (!isDragging.current && maxPosition !== lastMaxPosition.current) {
            maxAnim.setValue(maxPosition);
            lastMaxPosition.current = maxPosition;
        }
    }, [maxPosition, maxAnim]);

    // Update input values when props change (but not when focused)
    React.useEffect(() => {
        if (!isMinFocused) {
            setMinInputValue(formatValue(minValue));
        }
    }, [minValue, formatValue, isMinFocused]);

    React.useEffect(() => {
        if (!isMaxFocused) {
            setMaxInputValue(formatValue(maxValue));
        }
    }, [maxValue, formatValue, isMaxFocused]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    const getValueFromPosition = useCallback((x: number, width?: number): number => {
        const currentWidth = width ?? sliderWidth;
        const clampedX = Math.max(0, Math.min(currentWidth, x));
        const ratio = clampedX / currentWidth;
        const value = min + ratio * (max - min);
        return Math.round(value / step) * step;
    }, [min, max, step, sliderWidth]);

    // Store current values in refs so PanResponder can access latest values
    const currentValuesRef = useRef({ minValue, maxValue, sliderWidth, min, max, step, onValueChange });
    
    React.useEffect(() => {
        currentValuesRef.current = { minValue, maxValue, sliderWidth, min, max, step, onValueChange };
    }, [minValue, maxValue, sliderWidth, min, max, step, onValueChange]);

    // Throttled value change using requestAnimationFrame
    const scheduleValueChange = useCallback((newMin: number, newMax: number) => {
        pendingValueChange.current = { min: newMin, max: newMax };
        
        if (rafId.current === null) {
            rafId.current = requestAnimationFrame(() => {
                if (pendingValueChange.current) {
                    currentValuesRef.current.onValueChange(
                        pendingValueChange.current.min,
                        pendingValueChange.current.max
                    );
                    pendingValueChange.current = null;
                }
                rafId.current = null;
            });
        }
    }, []);

    const panResponderMin = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                isDragging.current = true;
                setActiveThumb('min');
                const { minValue: currMin, maxValue: currMax, sliderWidth: width, min: currMinBound, max: currMaxBound } = currentValuesRef.current;
                const currentMinPosition = ((currMin - currMinBound) / (currMaxBound - currMinBound)) * width;
                startPosition.current.min = currentMinPosition;
            },
            onPanResponderMove: (evt, gestureState) => {
                const { maxValue: currMax, sliderWidth: width, min: currMinBound, max: currMaxBound, step: currStep } = currentValuesRef.current;
                // Calculate new position from start position + gesture delta for smooth tracking
                const newPosition = Math.max(0, Math.min(width, startPosition.current.min + gestureState.dx));
                
                // Update animation immediately - this is the key for smooth following
                minAnim.setValue(newPosition);
                lastMinPosition.current = newPosition;
                
                // Calculate value and schedule update (throttled via RAF)
                const newValue = getValueFromPosition(newPosition, width);
                const clampedValue = Math.max(currMinBound, Math.min(newValue, currMax - currStep));
                scheduleValueChange(clampedValue, currMax);
            },
            onPanResponderRelease: () => {
                isDragging.current = false;
                setActiveThumb(null);
                // Flush any pending value change
                if (rafId.current !== null) {
                    cancelAnimationFrame(rafId.current);
                    rafId.current = null;
                }
                if (pendingValueChange.current) {
                    currentValuesRef.current.onValueChange(
                        pendingValueChange.current.min,
                        pendingValueChange.current.max
                    );
                    pendingValueChange.current = null;
                }
            },
        })
    ).current;

    const panResponderMax = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                isDragging.current = true;
                setActiveThumb('max');
                const { minValue: currMin, maxValue: currMax, sliderWidth: width, min: currMinBound, max: currMaxBound } = currentValuesRef.current;
                const currentMaxPosition = ((currMax - currMinBound) / (currMaxBound - currMinBound)) * width;
                startPosition.current.max = currentMaxPosition;
            },
            onPanResponderMove: (evt, gestureState) => {
                const { minValue: currMin, sliderWidth: width, min: currMinBound, max: currMaxBound, step: currStep } = currentValuesRef.current;
                // Calculate new position from start position + gesture delta for smooth tracking
                const newPosition = Math.max(0, Math.min(width, startPosition.current.max + gestureState.dx));
                
                // Update animation immediately - this is the key for smooth following
                maxAnim.setValue(newPosition);
                lastMaxPosition.current = newPosition;
                
                // Calculate value and schedule update (throttled via RAF)
                const newValue = getValueFromPosition(newPosition, width);
                const clampedValue = Math.max(currMin + currStep, Math.min(newValue, currMaxBound));
                scheduleValueChange(currMin, clampedValue);
            },
            onPanResponderRelease: () => {
                isDragging.current = false;
                setActiveThumb(null);
                // Flush any pending value change
                if (rafId.current !== null) {
                    cancelAnimationFrame(rafId.current);
                    rafId.current = null;
                }
                if (pendingValueChange.current) {
                    currentValuesRef.current.onValueChange(
                        pendingValueChange.current.min,
                        pendingValueChange.current.max
                    );
                    pendingValueChange.current = null;
                }
            },
        })
    ).current;

    const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        setTrackLayout({ x, width });
        if (width > 0) {
            setSliderWidth(width);
        }
    }, []);

    const handleTrackPress = useCallback((evt: any) => {
        const touchX = evt.nativeEvent.locationX;
        const newValue = getValueFromPosition(touchX);
        
        // Determine which thumb is closer
        const distanceToMin = Math.abs(newValue - minValue);
        const distanceToMax = Math.abs(newValue - maxValue);
        
        if (distanceToMin < distanceToMax) {
            const clampedValue = Math.max(min, Math.min(newValue, maxValue - step));
            onValueChange(clampedValue, maxValue);
        } else {
            const clampedValue = Math.max(minValue + step, Math.min(newValue, max));
            onValueChange(minValue, clampedValue);
        }
    }, [minValue, maxValue, min, max, step, getValueFromPosition, onValueChange]);

    // Parse formatted value back to number (remove commas, etc.)
    const parseValue = useCallback((text: string): number | null => {
        // Remove all non-numeric characters except decimal point and minus sign
        const cleaned = text.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }, []);

    // Handle min value input focus - show raw number
    const handleMinInputFocus = useCallback(() => {
        setIsMinFocused(true);
        // Show raw numeric value when focusing
        setMinInputValue(Math.round(minValue).toString());
    }, [minValue]);

    // Handle min value input change - allow free typing, only update slider for valid values
    const handleMinInputChange = useCallback((text: string) => {
        setMinInputValue(text);
        const parsed = parseValue(text);
        if (parsed !== null) {
            // Strict limit: min cannot exceed maxValue - step
            const maxAllowed = maxValue - step;
            const minAllowed = min;
            
            // Only update slider if value is within valid range
            // Don't auto-adjust the input field while typing - let user finish typing
            if (parsed >= minAllowed && parsed <= maxAllowed) {
                // Value is within valid range, update slider immediately
                onValueChange(parsed, maxValue);
            }
            // If out of range, don't update slider - let user finish typing first
        }
    }, [maxValue, min, step, onValueChange, parseValue]);

    // Handle min value input blur/end editing - auto-adjust if exceeds limits
    const handleMinInputEnd = useCallback(() => {
        setIsMinFocused(false);
        const parsed = parseValue(minInputValue);
        if (parsed !== null) {
            // Final validation and clamping - auto-adjust if exceeds limits
            const maxAllowed = maxValue - step;
            const minAllowed = min;
            let clampedValue = parsed;
            
            // Auto-adjust if exceeds limits
            if (parsed > maxAllowed) {
                clampedValue = maxAllowed;
            } else if (parsed < minAllowed) {
                clampedValue = minAllowed;
            }
            
            onValueChange(clampedValue, maxValue);
            setMinInputValue(formatValue(clampedValue));
        } else {
            // Reset to current value if invalid
            setMinInputValue(formatValue(minValue));
        }
    }, [minInputValue, min, maxValue, step, onValueChange, parseValue, formatValue, minValue]);

    // Handle max value input focus - show raw number
    const handleMaxInputFocus = useCallback(() => {
        setIsMaxFocused(true);
        // Show raw numeric value when focusing
        setMaxInputValue(Math.round(maxValue).toString());
    }, [maxValue]);

    // Handle max value input change - allow free typing, only update slider for valid values
    const handleMaxInputChange = useCallback((text: string) => {
        setMaxInputValue(text);
        const parsed = parseValue(text);
        if (parsed !== null) {
            // Strict limit: max cannot go below minValue + step
            const minAllowed = minValue + step;
            const maxAllowed = max;
            
            // Only update slider if value is within valid range
            // Don't auto-adjust the input field while typing - let user finish typing
            if (parsed >= minAllowed && parsed <= maxAllowed) {
                // Value is within valid range, update slider immediately
                onValueChange(minValue, parsed);
            }
            // If out of range, don't update slider - let user finish typing first
        }
    }, [minValue, max, step, onValueChange, parseValue]);

    // Handle max value input blur/end editing - auto-adjust if exceeds limits
    const handleMaxInputEnd = useCallback(() => {
        setIsMaxFocused(false);
        const parsed = parseValue(maxInputValue);
        if (parsed !== null) {
            // Final validation and clamping - auto-adjust if exceeds limits
            const minAllowed = minValue + step;
            const maxAllowed = max;
            let clampedValue = parsed;
            
            // Auto-adjust if exceeds limits
            if (parsed < minAllowed) {
                clampedValue = minAllowed;
            } else if (parsed > maxAllowed) {
                clampedValue = maxAllowed;
            }
            
            onValueChange(minValue, clampedValue);
            setMaxInputValue(formatValue(clampedValue));
        } else {
            // Reset to current value if invalid
            setMaxInputValue(formatValue(maxValue));
        }
    }, [maxInputValue, max, minValue, step, onValueChange, parseValue, formatValue, maxValue]);

    return (
        <View className="w-full">
            {label && (
                <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                    {label}
                </Text>
            )}
            
            {/* Value Display */}
            <View className="flex-row justify-between items-center mb-4 gap-3">
                <View 
                    className="flex-1 border border-blue-200 rounded-xl px-4 py-3 items-center"
                    style={{
                        backgroundColor: '#eff6ff',
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2,
                    }}
                >
                    <Text className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wide">MİNİMUM</Text>
                    <TextInput
                        value={minInputValue}
                        onChangeText={handleMinInputChange}
                        onFocus={handleMinInputFocus}
                        onBlur={handleMinInputEnd}
                        onEndEditing={handleMinInputEnd}
                        keyboardType="numeric"
                        selectTextOnFocus
                        className="text-base font-bold text-blue-700 text-center"
                        style={{ color: '#1e3a8a', padding: 0, minWidth: 60 }}
                    />
                </View>
                <View className="justify-center px-2">
                    <Text className="text-xl font-bold text-slate-400">-</Text>
                </View>
                <View 
                    className="flex-1 border border-blue-200 rounded-xl px-4 py-3 items-center"
                    style={{
                        backgroundColor: '#eff6ff',
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2,
                    }}
                >
                    <Text className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wide">MAKSİMUM</Text>
                    <TextInput
                        value={maxInputValue}
                        onChangeText={handleMaxInputChange}
                        onFocus={handleMaxInputFocus}
                        onBlur={handleMaxInputEnd}
                        onEndEditing={handleMaxInputEnd}
                        keyboardType="numeric"
                        selectTextOnFocus
                        className="text-base font-bold text-blue-700 text-center"
                        style={{ color: '#1e3a8a', padding: 0, minWidth: 60 }}
                    />
                </View>
            </View>

            {/* Slider Track */}
            <View className="relative w-full" style={{ height: 40, justifyContent: 'center' }}>
                <TouchableWithoutFeedback onPress={handleTrackPress}>
                    <View
                        onLayout={handleTrackLayout}
                        className="w-full"
                        style={{
                            height: 40,
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <View
                            className="w-full"
                            style={{
                                height: 4,
                                backgroundColor: '#e2e8f0',
                                borderRadius: 2,
                                position: 'relative',
                            }}
                        >
                            {/* Active Range */}
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    left: minAnim,
                                    width: Animated.subtract(maxAnim, minAnim),
                                    height: 4,
                                    backgroundColor: '#2563eb',
                                    borderRadius: 2,
                                }}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>

                {/* Min Thumb */}
                <Animated.View
                    {...panResponderMin.panHandlers}
                    style={{
                        position: 'absolute',
                        left: minAnim,
                        marginLeft: -thumbSize / 2,
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: thumbSize / 2,
                        backgroundColor: activeThumb === 'min' ? '#1e40af' : '#2563eb',
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5,
                        zIndex: activeThumb === 'min' ? 10 : 5,
                    }}
                />

                {/* Max Thumb */}
                <Animated.View
                    {...panResponderMax.panHandlers}
                    style={{
                        position: 'absolute',
                        left: maxAnim,
                        marginLeft: -thumbSize / 2,
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: thumbSize / 2,
                        backgroundColor: activeThumb === 'max' ? '#1e40af' : '#2563eb',
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5,
                        zIndex: activeThumb === 'max' ? 10 : 5,
                    }}
                />
            </View>
        </View>
    );
};

