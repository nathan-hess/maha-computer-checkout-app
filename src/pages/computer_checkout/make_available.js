import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
    addDoc,
    collection,
    doc,
    getDoc,
    updateDoc,
} from 'firebase/firestore';

import {
    PAGES,
    REDIRECT,
    ROLES,
    STATUSES,
} from '../../constants.js';
import { db, useGetFirebaseAuthStatus } from '../../firebase.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { unauthorizedScreen } from '../../components/unauthorized.js';
import { basicDeviceInfo } from './device_info.js';
import { getStatus } from './status.js';

import 'react-datepicker/dist/react-datepicker.css';
import './modify_extend.css';


export default function MakeDeviceAvailablePage() {
    const { id } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    // Determine user authentication status
    const [user, initialized, role, ] = useGetFirebaseAuthStatus();

    // Variables for form UI elements
    const [errorVisibility, setErrorVisibility] = useState(false);

    // Fetch device and user data once user authentication status has been
    // determined and the user is confirmed to be an administrator
    const [loadingDeviceData, setDeviceDataLoading] = useState(true);
    const [loadingLoginData, setDeviceLoginLoading] = useState(true);
    const [deviceData, setDeviceData] = useState(null);
    const [loginData, setLoginData] = useState(null);
    const [reservationHistory, setReservationHistory] = useState(null);
    useEffect(() => {
        if ((user != null) && (role === ROLES.admin)) {
            const devicePath = `computers/${id}`;
            getDoc(doc(db, devicePath)).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    setDeviceData(docSnapshot);
                    setReservationHistory({
                        asset_tag: docSnapshot.id,
                        reservation_begin: docSnapshot.get('reservation_begin'),
                        reservation_end: docSnapshot.get('reservation_end'),
                        user: docSnapshot.get('reservation_user'),
                    });
                }
                else {
                    console.error(`Document "${devicePath}" does not exist`);
                }
                setDeviceDataLoading(false);
            });

            const loginsPath = `logins/${id}`;
            getDoc(doc(db, loginsPath)).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    setLoginData(docSnapshot.data());
                }
                else {
                    console.error(`Document "${loginsPath}" does not exist`);
                }
                setDeviceLoginLoading(false);
            });
        }
    }, [id, user, role]);

    function entryBox(header, dbKey, data, setData, helpText=null) {
        return <>
            <h3 className='field-name'>{header}</h3>
            <input
                type='text'
                className='form-text-box'
                value={data[dbKey]}
                onChange={(text) => {
                    setErrorVisibility(false);
                    setData({
                        ...data,
                        [dbKey]: text.target.value
                    });
                }}
                placeholder={
                    helpText == null
                    ? `Enter ${header.toLowerCase()} here`
                    : helpText
                }
            ></input>
        </>;
    }

    if (!initialized) {
        // Display loading screen until user authentication status has
        // been retrieved
        return loadingScreen();
    }
    else if (user == null) {
        // If user isn't logged in, redirect them to the login page
        navigate(`${PAGES.login}?${REDIRECT}=${location.pathname}`);
    }
    else if (role !== ROLES.admin) {
        // If user isn't an administrator, show a "permission denied" message
        return unauthorizedScreen();
    }
    else if (loadingDeviceData || loadingLoginData) {
        // At this point, it is known that the user is an administrator, so
        // show a loading screen while waiting for any remaining data to load
        return loadingScreen();
    }
    else if ((deviceData == null) || (loginData == null)) {
        // This error screen is present in case there are issues fetching the
        // computer's detailed data from the database
        return errorScreen();
    }
    else if (getStatus(deviceData) !== STATUSES.pending) {
        return errorScreen(
            `Device "${id}" is not listed as "pending."  Please check in `
            + 'devices before attempting to make them available.')
    }
    else {
        return <>
            <h1>Make Device Available</h1>
            <br></br>
            <div className='page-content'>
                {basicDeviceInfo(id, deviceData)}
                {/* formEvent.preventDefault() prevents the browser from reloading
                    the page when the form is submitted */}
                <form onSubmit={(formEvent) => {formEvent.preventDefault()}}>
                    <h2>Login Information</h2>
                    {entryBox('Password', 'password', loginData, setLoginData)}
                    {entryBox('PIN', 'pin', loginData, setLoginData,
                              'Enter PIN here')}
                    <br></br>
                    <button
                        className='round-button gray-button submit-button'
                        type='submit'
                        onClick={async () => {
                            setErrorVisibility(false);
                            try {
                                await updateDoc(
                                    doc(db, 'computers', id),
                                    {
                                        reservation_begin: null,
                                        reservation_end: null,
                                        reservation_name: null,
                                        reservation_status: 'available',
                                        reservation_user: null,
                                    }
                                );

                                await updateDoc(
                                    doc(db, 'logins', id),
                                    loginData
                                );

                                await addDoc(
                                    collection(db, 'reservation_history'),
                                    reservationHistory
                                );

                                navigate(PAGES.computer_list);
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
                >Error: Unable to save device information.  Please check your
                 network connection and try again later.</p>
            </div>
        </>;
    }
}
