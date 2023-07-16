/**
 * Truncates a string to a given maximum length
 *
 * @param inputString The string to process
 * @param length The maximum length of the output to return.  If `inputString`
 * exceeds this length, all but the first `length - 3` characters are removed
 * and `'...'` is appended to the end of the string
 */
export function truncateString(inputString, length) {
    if (inputString.length <= length) {
        return inputString;
    }

    return inputString.substring(0, length-3) + '...';
}
