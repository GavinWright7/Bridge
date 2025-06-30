import React, { useState, useRef, useCallback } from 'react';

const DoubleRangeSlider = ({ min, max, step, value, onChange, formatValue }) => {
  const [isDragging, setIsDragging] = useState(null);
  const sliderRef = useRef(null);

  const getPercentage = useCallback((val) => ((val - min) / (max - min)) * 100, [min, max]);

  const handleMouseDown = (thumb) => (e) => {
    e.preventDefault();
    setIsDragging(thumb);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(steppedValue, value[1] - step));
      onChange([newMin, value[1]]);
    } else {
      const newMax = Math.min(max, Math.max(steppedValue, value[0] + step));
      onChange([value[0], newMax]);
    }
  }, [isDragging, min, max, step, value, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const minPercentage = getPercentage(value[0]);
  const maxPercentage = getPercentage(value[1]);

  return (
    <div className="double-range-slider">
      {/* Value Display */}
      <div className="flex justify-center mb-6">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold relative">
          {formatValue ? formatValue(value) : `${value[0]} - ${value[1]}`}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative px-4">
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        >
          {/* Active Range */}
          <div
            className="absolute h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          {/* Min Thumb */}
          <div
            className="absolute w-5 h-5 bg-white border-3 border-blue-600 rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 transition-transform"
            style={{ left: `${minPercentage}%`, top: '50%' }}
            onMouseDown={handleMouseDown('min')}
          />

          {/* Max Thumb */}
          <div
            className="absolute w-5 h-5 bg-white border-3 border-blue-600 rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 -translate-x-1/2 hover:scale-110 transition-transform"
            style={{ left: `${maxPercentage}%`, top: '50%' }}
            onMouseDown={handleMouseDown('max')}
          />
        </div>

        {/* Range Labels */}
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>{formatValue ? formatValue([min, min]) : min}</span>
          <span>{formatValue ? formatValue([max, max]) : max}</span>
        </div>
      </div>
    </div>
  );
};

export default DoubleRangeSlider; 