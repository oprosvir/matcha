/**
 * Calculate age from date of birth
 * @param dateOfBirth - ISO date string (YYYY-MM-DD)
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

/**
 * Get the maximum allowed date for 18+ restriction
 * @returns Date object representing 18 years ago from today
 */
export function getMaxDate(): Date {
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  return maxDate;
}

/**
 * Format date to YYYY-MM-DD for input[type="date"]
 * @param date - Date object
 * @returns ISO date string (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date of birth to readable format
 * @param dateOfBirth - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "June 15, 1995")
 */
export function formatDateOfBirth(dateOfBirth: string): string {
  const date = new Date(dateOfBirth);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
