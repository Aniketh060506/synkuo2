import { useState, useRef, useEffect } from 'react';

export default function SmartTimeInput({ value, onChange, placeholder = "00:00 AM" }) {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('AM');
  const [focusedField, setFocusedField] = useState(null);
  
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const periodRef = useRef(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        setHour(match[1].padStart(2, '0'));
        setMinute(match[2]);
        setPeriod(match[3].toUpperCase());
      }
    }
  }, [value]);

  // Update parent when values change
  useEffect(() => {
    if (hour && minute && period) {
      const formattedTime = `${hour}:${minute} ${period}`;
      onChange(formattedTime);
    }
  }, [hour, minute, period]);

  const handleHourChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length === 0) {
      setHour('');
      return;
    }

    // Limit to 2 digits max
    if (val.length > 2) {
      val = val.slice(0, 2);
    }

    // Convert to number
    let num = parseInt(val);
    
    // If single digit
    if (val.length === 1) {
      setHour(val);
      // If 0 or 1, wait for second digit (user might want 10, 11, 12)
      if (num === 0 || num === 1) {
        return; // Don't auto-advance, wait for second digit
      }
      // If 2-9, auto-format with leading zero and advance
      else if (num >= 2 && num <= 9) {
        setHour(val.padStart(2, '0'));
        setTimeout(() => minuteRef.current?.focus(), 10);
      }
    } 
    // If two digits
    else if (val.length === 2) {
      // Validate hour range (01-12)
      if (num >= 1 && num <= 12) {
        setHour(val);
        // Auto-advance to minutes
        setTimeout(() => minuteRef.current?.focus(), 10);
      } else if (num === 0) {
        // 00 is invalid, default to 01
        setHour('01');
        setTimeout(() => minuteRef.current?.focus(), 10);
      } else if (num > 12) {
        // Greater than 12, cap at 12
        setHour('12');
        setTimeout(() => minuteRef.current?.focus(), 10);
      }
    }
  };

  const handleMinuteChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length === 0) {
      setMinute('');
      return;
    }

    // Limit to 2 digits max
    if (val.length > 2) {
      val = val.slice(0, 2);
    }

    // If single digit
    if (val.length === 1) {
      setMinute(val);
      // For minutes 0-5, wait for second digit
      let num = parseInt(val);
      if (num >= 0 && num <= 5) {
        return; // Don't auto-advance
      }
      // For 6-9, auto-format and advance (since 60+ is invalid)
      else {
        setMinute(val.padStart(2, '0'));
        setTimeout(() => periodRef.current?.focus(), 10);
      }
    }
    // If two digits
    else if (val.length === 2) {
      let num = parseInt(val);
      if (num >= 0 && num <= 59) {
        setMinute(val);
        // Auto-advance to period
        setTimeout(() => periodRef.current?.focus(), 10);
      } else {
        // Cap at 59
        setMinute('59');
        setTimeout(() => periodRef.current?.focus(), 10);
      }
    }
  };

  const handlePeriodKeyDown = (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'a') {
      e.preventDefault();
      setPeriod('AM');
    } else if (key === 'p') {
      e.preventDefault();
      setPeriod('PM');
    } else if (key === 'backspace') {
      e.preventDefault();
      minuteRef.current?.focus();
    }
  };

  const handleHourKeyDown = (e) => {
    if (e.key === 'ArrowRight' || (e.key === ':' && hour)) {
      e.preventDefault();
      minuteRef.current?.focus();
    } else if (e.key === 'Backspace' && !hour) {
      e.preventDefault();
    }
  };

  const handleMinuteKeyDown = (e) => {
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      e.preventDefault();
      hourRef.current?.focus();
    } else if (e.key === 'ArrowRight' || (e.key === ' ' && minute)) {
      e.preventDefault();
      periodRef.current?.focus();
    } else if (e.key === 'Backspace' && !minute) {
      e.preventDefault();
      hourRef.current?.focus();
    }
  };

  const togglePeriod = () => {
    setPeriod(period === 'AM' ? 'PM' : 'AM');
  };

  return (
    <div className="relative inline-flex items-center gap-1 px-4 py-3 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-xl text-white focus-within:border-[rgba(255,255,255,0.3)] transition-all">
      {/* Hour Input */}
      <div className="relative">
        <input
          ref={hourRef}
          type="text"
          value={hour}
          onChange={handleHourChange}
          onKeyDown={handleHourKeyDown}
          onFocus={() => setFocusedField('hour')}
          onBlur={() => setFocusedField(null)}
          maxLength={2}
          className="w-8 bg-transparent text-white text-center focus:outline-none placeholder-transparent"
          placeholder="00"
        />
        {!hour && focusedField !== 'hour' && (
          <span className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
            00
          </span>
        )}
      </div>

      <span className="text-gray-600">:</span>

      {/* Minute Input */}
      <div className="relative">
        <input
          ref={minuteRef}
          type="text"
          value={minute}
          onChange={handleMinuteChange}
          onKeyDown={handleMinuteKeyDown}
          onFocus={() => setFocusedField('minute')}
          onBlur={() => setFocusedField(null)}
          maxLength={2}
          className="w-8 bg-transparent text-white text-center focus:outline-none placeholder-transparent"
          placeholder="00"
        />
        {!minute && focusedField !== 'minute' && (
          <span className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
            00
          </span>
        )}
      </div>

      {/* AM/PM Toggle */}
      <button
        ref={periodRef}
        type="button"
        onClick={togglePeriod}
        onKeyDown={handlePeriodKeyDown}
        onFocus={() => setFocusedField('period')}
        onBlur={() => setFocusedField(null)}
        className="ml-1 w-10 text-center focus:outline-none hover:text-blue-400 transition-all"
      >
        {period || <span className="text-gray-600">AM</span>}
      </button>

      {/* Helper text */}
      {focusedField === 'period' && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          Press 'a' for AM, 'p' for PM
        </div>
      )}
    </div>
  );
}
