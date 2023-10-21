import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { logEvent } from 'firebase/analytics';
import {
    collection,
    doc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

import {
    NEW_COMPUTER_KEYWORD,
    PAGES,
    REDIRECT,
    ROLES,
    STATUSES,
} from '../../constants.js';
import {
    analytics,
    db,
    getCurrentUser,
    getUserMetadata,
} from '../../firebase.js';
import { isInternalMember } from '../auth/utils.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { internalMemberOnlyScreen } from '../../components/unauthorized.js';
import { truncateString } from '../../components/utils.js';
import { getStatus } from './status.js';

import './computers.css';


const MAX_NOTES_LENGTH = 25;

export default function Computers() {
    const navigate = useNavigate();
    const location = useLocation();

    const [pageContent, setPageContent] = useState(loadingScreen());

    useEffect(() => {
        generatePage(location, navigate).then(
            (content) => {
                setPageContent(content);
            },
            (reason) => {
                console.error(reason);
                setPageContent(errorScreen());
            }
        );
    }, [location, navigate]);

    return pageContent;
}


async function generatePage(location, navigate) {
    // Redirect users who aren't signed in to the login page
    const user = await getCurrentUser();
    if (user == null) {
        navigate(`${PAGES.login}?${REDIRECT}=${location.pathname}`);
    }

    // Display error message for external users
    const role = (await getUserMetadata(user.uid)).role;
    if (!isInternalMember(role)) {
        return internalMemberOnlyScreen();
    }

    // Determine page-level user permissions
    const isAdminOrFaculty = ((role === ROLES.admin) || (role === ROLES.faculty));
    const canViewOfflineArchived = isAdminOrFaculty;
    const canAdjustEndDate = isAdminOrFaculty;
    const canEditDevices = (role === ROLES.admin);

    // Fetch computer list
    const computers = (
        canViewOfflineArchived
        ? await getDocs(collection(db, 'computers'))
        : await getDocs(
            query(collection(db, 'computers'),
                  where('reservation_status', 'in',
                        [STATUSES.available, STATUSES.in_use])))
    );

    const now = new Date();
    return <>
        <h1>Computer Checkout</h1>
        {
            canEditDevices
            ? <Link
                className='link-button admin-new-button'
                to={`${PAGES.computer_modify}/${NEW_COMPUTER_KEYWORD}`}
                state={{from: PAGES.computer_list}}
            >New Device
            </Link>
            : <></>
        }
        <div className='page-content'>
            <h2>Available Computers</h2>
            {detailedComputerTable(
                filterComputers(computers, now,
                                [STATUSES.available],  // status
                                null, null),           // users
                true, canEditDevices, false, true, false)}
            <br></br>
            <h2>Computers In Use</h2>
            <h3>Your Computers</h3>
            {reservedComputerTable(
                filterComputers(computers, now,
                                [STATUSES.in_use],  // status
                                [user.uid], null),  // users
                true, canEditDevices, canAdjustEndDate, true, navigate)}
            <br></br>
            <h3>Other In-Use Computers</h3>
            {reservedComputerTable(
                filterComputers(computers, now,
                                [STATUSES.in_use],  // status
                                null, [user.uid]),  // users
                canAdjustEndDate, canEditDevices, canAdjustEndDate, false,
                navigate)}
            <br></br>
            <h2>Computers Under Maintenance</h2>
            {
                detailedComputerTable(
                    filterComputers(computers, now,
                                    [STATUSES.pending],  // status
                                    null, null),         // users
                    false, canEditDevices, canEditDevices, true,
                    canEditDevices  // let users with edit privileges (i.e.,
                )                   // administrators) view last user
            }
            <br></br>
            {
                canViewOfflineArchived
                ? <>
                    <h2>Offline Computers</h2>
                    {detailedComputerTable(
                        filterComputers(computers, now,
                                        [STATUSES.offline],  // status
                                        null, null),         // users
                        false, canEditDevices, false, true, false)}
                    <br></br>
                    <h2>Retired Computers</h2>
                    {detailedComputerTable(
                        filterComputers(computers, now,
                                        [STATUSES.archived],  // status
                                        null, null),          // users
                        false, canEditDevices, false, true, false)}
                    <br></br>
                </>
                : <></>
            }
        </div>
    </>;
}


/**
 * Filters a Firestore collection of documents containing information about
 * computers based on user-specified criteria
 *
 * Setting any of the criteria to `null` ignores the criteria
 *
 * @param collection A Firestore collection containing computer data to filter
 * @param now A JavaScript `Date` object containing the current time
 * @param statuses A list of strings containing any device status(es) to
 * include in the filtered list
 * @param includeUsers A list of strings containing user IDs.  If any computers
 * have been checked out by these user(s), these devices will be included in
 * the filtered list
 * @param excludeUsers A list of strings containing user IDs.  If any computers
 * have been checked out by these user(s), these devices will be excluded from
 * the filtered list
 *
 * @returns A list of Firestore documents for all computers matching the
 * provided filters
 */
function filterComputers(collection, now, statuses, includeUsers, excludeUsers) {
    const computers = [];

    collection.forEach((document) => {
        // Filter computers by status
        if ((statuses != null)
            && !statuses.includes(getStatus(document, now))) {
            return;
        }

        // Filter computers by user
        if (((includeUsers != null)
             && !includeUsers.includes(document.get('reservation_user')))
            || ((excludeUsers != null)
                && excludeUsers.includes(document.get('reservation_user')))) {
            return;
        }

        computers.push(document);
    });

    return computers;
}


/**
 * Returns an HTML table with detailed information about the given computers
 * (asset tag, model, CPU, etc.)
 *
 * @param devices A list of Firestore documents containing data about the
 * computers to include in the table
 * @param showCheckoutButton Whether to show a button in the table to check
 * out the specified computer
 * @param showEditButton Whether to show a button in the table to edit details
 * about a computer
 * @param showMakeAvailableButton Whether to show a button in the table to
 * make the computer available
 * @param showNotes Whether to show a column with a snippet of the notes for
 * the device
 * @param showUser Whether to show a column with the current user
 */
function detailedComputerTable(devices, showCheckoutButton, showEditButton,
                               showMakeAvailableButton, showNotes = true,
                               showUser = false) {
    const rows = [];
    devices.forEach((document) => {
        rows.push(
            <tr key={document.id}>
                <td>{document.id}</td>
                <td>{`${document.get('manufacturer')} ${document.get('model')}`}</td>
                <td>{document.get('cpu')}</td>
                <td>{document.get('memory')}</td>
                {
                    showNotes
                    ? <td>{truncateString(document.get('notes'), MAX_NOTES_LENGTH)}</td>
                    : <></>
                }
                {
                    showUser
                    ? <td>{document.get('reservation_name')}</td>
                    : <></>
                }
                <td><Link to={`${PAGES.details}/${document.id}`}>Details</Link></td>
                {showCheckoutButton || showEditButton || showMakeAvailableButton
                 ? <td>
                    {showEditButton
                     ? <Link
                            className='link-button'
                            to={`${PAGES.computer_modify}/${document.id}`}
                            state={{from: PAGES.computer_list}}
                       >Edit</Link>
                     : <></>}
                    &nbsp;&nbsp;
                    {showMakeAvailableButton
                     ? <Link
                            className='link-button'
                            to={`${PAGES.make_available}/${document.id}`}
                       >Make Available</Link>
                     : <></>}
                    &nbsp;&nbsp;
                    {showCheckoutButton
                     ? <Link
                            className='link-button'
                            to={`${PAGES.checkout}/${document.id}`}
                       >Check Out</Link>
                     : <></>}
                   </td>
                 : <></>}
            </tr>
        );
    });

    if (rows.length === 0) {
        return <p><i>No devices found</i></p>;
    }

    return (
        <table className='table'>
            <thead>
                <tr>
                    <th>Asset Tag</th>
                    <th>Model</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    {showNotes ? <th>Notes</th> : <></>}
                    {showUser ? <th>User</th> : <></>}
                    <th>Device Details</th>
                    {showCheckoutButton || showEditButton || showMakeAvailableButton
                     ? <th>Actions</th>
                     : <></>}
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    );
}


/**
 * Returns an HTML table with general information about the given computers
 * and reservations of these devices (asset tag, who reserved it, etc.)
 *
 * @param devices A list of Firestore documents containing data about the
 * computers to include in the table
 * @param showCheckinButton Whether to show a button in the table to check
 * in the specified computer
 * @param showEditButton Whether to show a button in the table to edit details
 * about a computer
 * @param showExtendButton Whether to show a button in the table to extend the
 * device reservation
 * @param showDetailsButton Whether to show a button in the table to navigate
 * to the device details page
 * @param navigate React Router function for navigating to a specified page
 */
function reservedComputerTable(devices, showCheckinButton, showEditButton,
                               showExtendButton, showDetailsButton, navigate) {
    const rows = [];
    devices.forEach((document) => {
        const beginDate = new Date(document.get('reservation_begin')['seconds'] * 1000);
        const endDate = new Date(document.get('reservation_end')['seconds'] * 1000);

        rows.push(
            <tr key={document.id}>
                <td>{document.id}</td>
                <td>{truncateString(document.get('notes'), MAX_NOTES_LENGTH)}</td>
                <td><Link to={`${PAGES.details}/${document.id}`}>Details</Link></td>
                <td>{document.get('reservation_name')}</td>
                <td>
                    {`${beginDate.toLocaleDateString()} ${beginDate.toLocaleTimeString()} to`}
                    <br></br>
                    {`${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`}
                </td>
                {showCheckinButton || showEditButton || showExtendButton || showDetailsButton
                 ? <td>
                    {showEditButton
                     ? <Link
                            className='link-button'
                            to={`${PAGES.computer_modify}/${document.id}`}
                            state={{from: PAGES.computer_list}}
                       >Edit</Link>
                     : <></>}
                    &nbsp;&nbsp;
                    {showDetailsButton
                     ? <Link
                            className='link-button'
                            to={`${PAGES.details}/${document.id}`}
                       >View Login</Link>
                     : <></>}
                    &nbsp;&nbsp;
                    {showCheckinButton
                     ? <button
                            className='link-button'
                            onClick={async () => {
                                    try {
                                        console.log('Requesting user confirmation to check in computer...');
                                        if (window.confirm(
                                                `Once you check in "${document.id}," you will no longer have `
                                                + "access to the device login information and your files may "
                                                + "be wiped from the device.  Prior to checking the computer "
                                                + "in, please make sure you are finished with your work on "
                                                + "it and you have saved any necessary files.\n\n"
                                                + `Are you sure you would like to check in "${document.id}"?`))
                                        {
                                            await updateDoc(
                                                doc(db, 'computers', document.id),
                                                {reservation_end: Timestamp.fromDate(new Date())}
                                            );
                                            logEvent(analytics, 'refund');
                                            navigate(0);
                                        }
                                        else {
                                            console.log('Device check-in canceled');
                                        }
                                    }
                                    catch (exception) {
                                        console.error(exception);
                                        alert(`Unable to check in device "${document.id}." Please `
                                              + 'check your network connection and try again later.');
                                    }
                                }
                            }
                       >Check In</button>
                     : <></>}
                    &nbsp;&nbsp;
                    {showExtendButton
                     ? <Link
                            className='link-button'
                            to={`${PAGES.extend_reservation}/${document.id}`}
                       >Extend Reservation</Link>
                     : <></>}
                   </td>
                 : <></>}
            </tr>
        );
    });

    if (rows.length === 0) {
        return <p><i>No devices found</i></p>;
    }

    return (
        <table className='table'>
            <thead>
                <tr>
                    <th>Asset Tag</th>
                    <th>Notes</th>
                    <th>Device Details</th>
                    <th>Reserved By</th>
                    <th>Reservation Dates</th>
                    {showCheckinButton || showEditButton ? <th>Actions</th> : <></>}
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    );
}
