import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

import DatePicker from 'react-datepicker';

import { PAGES, REDIRECT, ROLES, STATUSES } from '../../constants.js';
import { db, useGetFirebaseAuthStatus } from '../../firebase.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { unauthorizedScreen } from '../../components/unauthorized.js';
import { basicDeviceInfo } from './device_info.js';
import { getStatus } from './status.js';

import './modify_extend.css';


export default function ExtendReservationPage() {
    const { id } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    // Determine user authentication status
    const [user, initialized, role, ] = useGetFirebaseAuthStatus();

    function canExtendReservation(userRole) {
        return [ROLES.admin, ROLES.faculty].includes(userRole);
    }

    // Variables for form UI elements
    const [currentEndDate, setCurrentEndDate] = useState(null);
    const [newEndDate, setNewEndDate] = useState(null);
    const [errorVisibility, setErrorVisibility] = useState(false);
    const [successVisibility, setSuccessVisibility] = useState(false);

    // Fetch device data once user authentication status has been determined
    // and the user is confirmed to be a faculty member or administrator
    const [deviceData, setDeviceData] = useState(null);
    const [loadingDeviceData, setLoadingDeviceData] = useState(true);
    useEffect(() => {
        if ((user != null) && canExtendReservation(role)) {
            const devicePath = `computers/${id}`;
            getDoc(doc(db, devicePath)).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    if (getStatus(docSnapshot) === STATUSES.in_use) {
                        const reservationEndDate = new Date(
                            docSnapshot.get('reservation_end')['seconds']
                            * 1000
                        );
                        setCurrentEndDate(reservationEndDate);
                        setNewEndDate(reservationEndDate);
                    }
                    setDeviceData(docSnapshot);
                }
                else {
                    console.error(`Document "${devicePath}" does not exist`);
                }
                setLoadingDeviceData(false);
            });
        }
    }, [id, user, role]);

    if (!initialized) {
        // Display loading screen until user authentication status has
        // been retrieved
        return loadingScreen();
    }
    else if (user == null) {
        // If user isn't logged in, redirect them to the login page
        navigate(`${PAGES.login}?${REDIRECT}=${location.pathname}`);
    }
    else if (!canExtendReservation(role)) {
        // If user isn't an administrator or faculty member, show a
        // "permission denied" message
        return unauthorizedScreen(true);
    }
    else if (loadingDeviceData) {
        // At this point, it is known that the user has necessary permissions, so
        // show a loading screen while waiting for any remaining data to load
        return loadingScreen();
    }
    else if (getStatus(deviceData) !== STATUSES.in_use) {
        return errorScreen(
            `Device "${id}" is not currently checked out, so the reservation `
            + 'cannot be extended.');
    }
    else if (deviceData == null) {
        // This error screen is present in case there are issues fetching the
        // computer's detailed data from the database
        return errorScreen();
    }
    else {
        const beginDate = new Date(deviceData.get('reservation_begin')['seconds'] * 1000);

        return <>
            <h1>Extend Device Reservation</h1>
            <div className='page-content'>
                {basicDeviceInfo(id, deviceData)}
                <h2>Current Reservation</h2>
                <ul>
                    <li>
                        <b>User: </b>
                        {`${deviceData.get('reservation_name')}`
                         + ` (${deviceData.get('reservation_user')})`}
                    </li>
                    <li>
                        <b>Begin date: </b>
                        {`${beginDate.toLocaleDateString()} ${beginDate.toLocaleTimeString()}`}
                    </li>
                    <li>
                        <b>Current end date: </b>
                        {`${currentEndDate.toLocaleDateString()} ${currentEndDate.toLocaleTimeString()}`}
                    </li>
                </ul>
                <br></br>
                <h2>Modify End Date</h2>
                <p>Set the desired new end date for the reservation below.</p>
                <form onSubmit={(formEvent) => {formEvent.preventDefault()}}>
                    <DatePicker
                        dateFormat='MM/dd/yyyy h:mm aa'
                        showTimeInput
                        minDate={new Date()}
                        onChange={(date) => {
                            setErrorVisibility(false);
                            setSuccessVisibility(false);
                            setNewEndDate(date);
                        }}
                        selected={newEndDate}
                    />
                    <br></br>
                    <button
                        className='round-button gray-button submit-button'
                        type='submit'
                        onClick={async () => {
                            setErrorVisibility(false);
                            setSuccessVisibility(false);
                            try {
                                await updateDoc(
                                    doc(db, 'computers', id),
                                    {reservation_end: Timestamp.fromDate(newEndDate)}
                                );

                                setCurrentEndDate(newEndDate);
                                setSuccessVisibility(true);
                            }
                            catch (exception) {
                                console.error(exception);
                                setErrorVisibility(true);
                            }
                        }}
                    >Save</button>
                </form>
                <p
                    className='error-message'
                    hidden={!errorVisibility}
                >Error: Unable to save reservation end date.  Please check your
                 network connection and try again later.</p>
                <p
                    className='success-message'
                    hidden={!successVisibility}
                >Success!  Reservation end date has been updated.</p>
            </div>
        </>;
    }
}
