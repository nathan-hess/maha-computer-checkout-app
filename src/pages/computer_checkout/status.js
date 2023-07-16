import { STATUSES } from '../../constants.js';


/**
 * Determines the reservation status of a computer
 *
 * @param deviceData The Firebase `DocumentSnapshot` object containing
 * device and reservation properties
 * @param now A JavaScript `Date` object with the current time, or
 * `null` to use the current time
 */
export function getStatus(deviceData, now = null) {
    const statusField = 'reservation_status';
    if (now == null) {
        now = new Date();
    }
    const now_seconds = Math.floor(now.getTime() / 1000);

    if (deviceData.get(statusField) === STATUSES.available) {
        return STATUSES.available;
    }

    if (deviceData.get(statusField) === STATUSES.in_use) {
        if (deviceData.get('reservation_end')['seconds'] > now_seconds) {
            return STATUSES.in_use;
        }

        return STATUSES.pending;
    }

    if (deviceData.get(statusField) === STATUSES.offline) {
        return STATUSES.offline;
    }

    if (deviceData.get(statusField) === STATUSES.archived) {
        return STATUSES.archived;
    }

    throw new Error('Unable to identify device status');
}
