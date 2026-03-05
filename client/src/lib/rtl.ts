/**
 * RTL (Right-to-Left) Support Utilities for Arabic Language
 * This module provides utilities for handling RTL layout and styling
 */

export const isRTL = (lang: string = 'ar'): boolean => {
  return ['ar', 'he', 'fa', 'ur'].includes(lang);
};

export const getDirection = (lang: string = 'ar'): 'rtl' | 'ltr' => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};

export const getRTLClass = (lang: string = 'ar'): string => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};

/**
 * Get margin/padding direction based on RTL
 * @param lang Language code
 * @returns Object with direction-aware margin/padding properties
 */
export const getDirectionalStyle = (lang: string = 'ar') => {
  const isRtl = isRTL(lang);
  return {
    marginStart: isRtl ? 'marginRight' : 'marginLeft',
    marginEnd: isRtl ? 'marginLeft' : 'marginRight',
    paddingStart: isRtl ? 'paddingRight' : 'paddingLeft',
    paddingEnd: isRtl ? 'paddingLeft' : 'paddingRight',
    insetStart: isRtl ? 'right' : 'left',
    insetEnd: isRtl ? 'left' : 'right',
  };
};

/**
 * Get Tailwind RTL classes
 */
export const getRTLTailwindClasses = (lang: string = 'ar'): Record<string, string> => {
  const isRtl = isRTL(lang);
  return {
    // Margin classes
    'ms': isRtl ? 'mr' : 'ml',
    'me': isRtl ? 'ml' : 'mr',
    'ps': isRtl ? 'pr' : 'pl',
    'pe': isRtl ? 'pl' : 'pr',
    // Text alignment
    'text-start': isRtl ? 'text-right' : 'text-left',
    'text-end': isRtl ? 'text-left' : 'text-right',
    // Flex direction
    'flex-start': isRtl ? 'flex-row-reverse' : 'flex-row',
    // Positioning
    'start': isRtl ? 'right' : 'left',
    'end': isRtl ? 'left' : 'right',
  };
};

/**
 * Apply RTL styles to element
 */
export const applyRTLStyles = (element: HTMLElement, lang: string = 'ar'): void => {
  if (isRTL(lang)) {
    element.setAttribute('dir', 'rtl');
    element.classList.add('rtl');
    element.style.direction = 'rtl';
  } else {
    element.setAttribute('dir', 'ltr');
    element.classList.remove('rtl');
    element.style.direction = 'ltr';
  }
};

/**
 * Get RTL-aware transform value
 */
export const getRTLTransform = (lang: string = 'ar', translateX: number): string => {
  const isRtl = isRTL(lang);
  return `translateX(${isRtl ? -translateX : translateX}px)`;
};

/**
 * Flip horizontal position values for RTL
 */
export const flipPosition = (lang: string = 'ar', position: 'left' | 'right'): 'left' | 'right' => {
  if (!isRTL(lang)) return position;
  return position === 'left' ? 'right' : 'left';
};

/**
 * Get RTL-aware flex direction
 */
export const getFlexDirection = (lang: string = 'ar', direction: 'row' | 'column'): string => {
  if (direction === 'column' || !isRTL(lang)) return direction;
  return 'row-reverse';
};

/**
 * Format number with RTL support
 */
export const formatNumberRTL = (num: number, lang: string = 'ar'): string => {
  if (!isRTL(lang)) return num.toString();
  
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map(digit => arabicNumerals[parseInt(digit)] || digit)
    .join('');
};

/**
 * Get RTL-aware margin class
 */
export const getMarginClass = (
  lang: string = 'ar',
  direction: 'start' | 'end',
  size: string
): string => {
  const isRtl = isRTL(lang);
  if (direction === 'start') {
    return isRtl ? `mr-${size}` : `ml-${size}`;
  }
  return isRtl ? `ml-${size}` : `mr-${size}`;
};

/**
 * Get RTL-aware padding class
 */
export const getPaddingClass = (
  lang: string = 'ar',
  direction: 'start' | 'end',
  size: string
): string => {
  const isRtl = isRTL(lang);
  if (direction === 'start') {
    return isRtl ? `pr-${size}` : `pl-${size}`;
  }
  return isRtl ? `pl-${size}` : `pr-${size}`;
};
