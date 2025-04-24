// tripmaker/js/utils.js
import { CATEGORY_ICONS, DEFAULT_CATEGORY } from '../config.js'; // パス修正: 1つ上のディレクトリからconfig.jsをインポート

/**
 * Checks if a value is a valid latitude or longitude number.
 * @param {*} coord - The value to check.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValidCoordinate(coord) {
    return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
}

/**
 * Displays a short feedback message at the bottom of the screen.
 * @param {string} message - The message to display.
 */
export function showCopyFeedback(message) {
    const feedback = document.getElementById('copyFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.add('show');
    // Ensure timeout is cleared if called again quickly
    if (feedback.timeoutId) clearTimeout(feedback.timeoutId);
    feedback.timeoutId = setTimeout(() => {
        feedback.classList.remove('show');
        feedback.timeoutId = null;
    }, 2500); // Show for 2.5 seconds
}

/**
 * Displays an error message, either in the header or as an alert.
 * @param {string} message - The error message.
 * @param {boolean} [useAlert=false] - If true, use a blocking alert dialog.
 */
export function showError(message, useAlert = false) {
    console.error("Error:", message);
    if (useAlert) {
        alert(`エラー: ${message}`);
    } else {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            // Optionally clear after a delay
            if (errorElement.timeoutId) clearTimeout(errorElement.timeoutId);
            errorElement.timeoutId = setTimeout(() => {
                errorElement.textContent = '';
                errorElement.timeoutId = null;
             }, 5000);
        }
    }
}

/**
 * Generates a timestamp string in YYYYMMDDHHMM format.
 * @returns {string} The formatted timestamp.
 */
export function generateTimestamp() {
    return new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');
}

/**
 * Creates a downloadable file from content.
 * @param {string} content - The file content.
 * @param {string} filename - The desired filename.
 * @param {string} contentType - The MIME type (e.g., 'application/json').
 */
export function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Normalizes various date string formats to 'YYYY-MM-DD'.
 * Handles common Japanese formats and standard delimiters.
 * Returns null if input is invalid or empty after normalization.
 * @param {string} dateStr - The date string to normalize.
 * @returns {string | null} Normalized date string or null.
 */
export function normalizeDate(dateStr) {
    if (!dateStr || dateStr === '日付なし') return null;

    // Already YYYY-MM-DD?
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Basic sanity check for month/day ranges
        const [, month, day] = dateStr.split('-').map(Number);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return dateStr;
        } else {
             console.warn(`Normalized date invalid range: ${dateStr}`);
             return null; // Invalid range
        }
    }

    try {
        // Normalize separators (年, 月, 日, /, .) to '-'
        let normalized = dateStr
            .replace(/[年月]/g, '-')
            .replace(/[日/\.]/g, '') // Remove 日 or delimiters at the end or used as separators
            .replace(/--+/g, '-')   // Handle multiple hyphens
            .replace(/^-|-$/g, '') // Trim leading/trailing hyphens
            .trim();

        const parts = normalized.split('-');

        if (parts.length === 3) {
            let year = parts[0];
            let month = parts[1];
            let day = parts[2];

            // Handle 2-digit year (assume 20xx)
            if (year.length === 2 && /^\d+$/.test(year)) {
                year = '20' + year;
            }

            // Pad month and day
            year = year.padStart(4, '0');
            month = month.padStart(2, '0');
            day = day.padStart(2, '0');

            // Final validation after padding
            const monthNum = parseInt(month, 10);
            const dayNum = parseInt(day, 10);
            const yearNum = parseInt(year, 10); // Check year validity too

            if (yearNum > 1900 && yearNum < 2100 && // Reasonable year range
                monthNum >= 1 && monthNum <= 12 &&
                dayNum >= 1 && dayNum <= 31) {
                // Further check: does this day exist in this month?
                const testDate = new Date(yearNum, monthNum - 1, dayNum);
                if (testDate.getFullYear() === yearNum && testDate.getMonth() === monthNum - 1 && testDate.getDate() === dayNum) {
                    return `${year}-${month}-${day}`;
                } else {
                     console.warn(`Normalized date resulted in invalid date: ${year}-${month}-${day} from ${dateStr}`);
                     return null;
                }
            }
        }

        // Try JS Date parsing as a fallback (less reliable for formats)
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            // Check if parsing resulted in a valid date near the input year if possible
            // (JS Date can be lenient and produce unexpected results)
            return date.toISOString().split('T')[0];
        }

        console.warn(`Date normalization failed: ${dateStr}`);
        return null; // Failed to normalize

    } catch (e) {
        console.error("Error during date normalization:", e, dateStr);
        return null;
    }
}

/**
 * Gets the appropriate icon for a given category.
 * @param {string} category - The category name.
 * @returns {string} The icon emoji.
 */
export function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS[DEFAULT_CATEGORY];
}

/**
 * Parses a single line of CSV text, handling quoted fields.
 * @param {string} line - The CSV line.
 * @returns {string[]} An array of field values.
 */
export function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        // Handle escaped quotes ("")
        if (char === '"' && inQuotes && i + 1 < line.length && line[i + 1] === '"') {
             current += '"';
             i++; // Skip the second quote
         } else if (char === '"') {
             inQuotes = !inQuotes;
         } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current); // Add the last field

    // Trim and remove surrounding quotes if they exist
    return result.map(field => {
         field = field.trim();
         if (field.length >= 2 && field.startsWith('"') && field.endsWith('"')) {
             // Remove surrounding quotes and unescape double quotes inside
             field = field.substring(1, field.length - 1).replace(/""/g, '"');
         }
         return field.trim(); // Trim again after potential quote removal
    });
}

// Simple debounce function
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Simple throttle function (leading edge)
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// String hashing function (used for color generation, simple)
export function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash); // Ensure positive
};
