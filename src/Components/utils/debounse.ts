export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null; // Optional: reset after execution
    }, delay);
  };
};
