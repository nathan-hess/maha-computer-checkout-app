import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';

import DatePicker from 'react-datepicker';

import {
    NEW_COMPUTER_KEYWORD,
    PAGES,
    REDIRECT,
    ROLES,
    STATUSES,
} from '../../constants.js';
import { db, useGetFirebaseAuthStatus } from '../../firebase.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { unauthorizedScreen } from '../../components/unauthorized.js';

import 'react-datepicker/dist/react-datepicker.css';
import './modify_extend.css';


export default function ModifyDevicePage() {
    const { id } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    // Determine user authentication status
    const [user, initialized, role, ] = useGetFirebaseAuthStatus();

    // Variables for form UI elements
    const [errorMessage, setErrorMessage] = useState('Error: unknown error');
    const [errorVisibility, setErrorVisibility] = useState(false);
    const [successVisibility, setSuccessVisibility] = useState(false);

    const [newDeviceID, setNewDeviceID] = useState('');

    // Fetch device and user data once user authentication status has been
    // determined and the user is confirmed to be an administrator
    const [deviceData, setDeviceData] = useState(null);
    const [loginData, setLoginData] = useState(null);
    const [userList, setUserList] = useState(null);
    useEffect(() => {
        if ((user != null) && (role === ROLES.admin)) {
            if (id === NEW_COMPUTER_KEYWORD) {
                setDeviceData({
                    cpu: '',
                    disks: [],
                    gpus: [],
                    hostname: '',
                    manufacturer: '',
                    memory: '',
                    model: '',
                    notes: '',
                    reservation_begin: null,
                    reservation_end: null,
                    reservation_name: null,
                    reservation_status: 'available',
                    reservation_user: null,
                    serial_number: '',
                });

                setLoginData({
                    password: '',
                    pin: '',
                });
            }
            else {
                const devicePath = `computers/${id}`;
                getDoc(doc(db, devicePath)).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setDeviceData(docSnapshot.data());
                    }
                    else {
                        console.error(`Document "${devicePath}" does not exist`);
                    }
                });

                const loginsPath = `logins/${id}`;
                getDoc(doc(db, loginsPath)).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setLoginData(docSnapshot.data());
                    }
                    else {
                        console.error(`Document "${loginsPath}" does not exist`);
                    }
                });
            }

            getDocs(collection(db, 'users')).then(
                (snapshot) => setUserList(snapshot),
                (reason) => console.error(
                    `User data cannot be retrieved (${reason})`)
            );
        }
    }, [id, user, role]);

    function hideMessages() {
        setErrorVisibility(false);
        setSuccessVisibility(false);
    }

    function entryBox(header, dbKey, data, setData,
                      helpText=null, multiline=false,
                      multilineStoreAsArray=true, editable=true) {
        if (multiline) {
            return <>
                <h3 className='field-name'>{header}</h3>
                <textarea
                    type='text'
                    className='form-text-box multiline-text-box'
                    value={
                        multilineStoreAsArray
                        ? data[dbKey].join('\n')
                        : data[dbKey]
                    }
                    onChange={(text) => {
                        hideMessages();
                        setData({
                            ...data,
                            [dbKey]: (
                                text.target.value.length > 0
                                ? (
                                    multilineStoreAsArray
                                    ? text.target.value.split('\n')
                                    : text.target.value
                                )
                                : (
                                    multilineStoreAsArray
                                    ? []
                                    : ''
                                )
                            )
                        });
                    }}
                    readOnly={!editable}
                    disabled={!editable}
                    placeholder={
                        helpText != null
                        ? helpText
                        : `Enter ${header.toLowerCase()} here, putting each on a separate line`
                    }
                ></textarea>
            </>;
        }

        return <>
            <h3 className='field-name'>{header}</h3>
            <input
                type='text'
                className='form-text-box'
                value={data[dbKey]}
                onChange={(text) => {
                    hideMessages();
                    setData({
                        ...data,
                        [dbKey]: text.target.value
                    });
                }}
                readOnly={!editable}
                disabled={!editable}
                placeholder={
                    helpText != null
                    ? helpText
                    : `Enter ${header.toLowerCase()} here`
                }
            ></input>
        </>;
    }

    function datePicker(header, dbKey) {
        return <>
            <h3 className='field-name'>{header}</h3>
            <DatePicker
                dateFormat='MM/dd/yyyy h:mm aa'
                showTimeInput
                onChange={(date) => {
                    hideMessages();
                    setDeviceData({
                        ...deviceData,
                        [dbKey]: (
                            date != null
                            ? Timestamp.fromDate(date)
                            : null
                        )
                    });
                }}
                isClearable
                selected={
                    deviceData[dbKey] != null
                    ? deviceData[dbKey].seconds * 1000
                    : null
                }
            />
        </>;
    }

    function generateUserSelectOptions() {
        const rows = [<option value='None'>None</option>]
        userList.forEach((document) => {
            rows.push(
                <option value={document.id}>
                    {`${document.get('name')} (${document.id})`}
                </option>
            );
        });
        return rows;
    }

    function getUserName(userID) {
        for (var index in userList.docs) {
            const document = userList.docs[index];
            if (document.id === userID) {
                return document.get('name');
            }
        }

        return null;
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
    else if (userList == null) {
        // At this point, it is known that the user is an administrator, so
        // show a loading screen while waiting for any remaining data to load
        return loadingScreen();
    }
    else if ((deviceData == null) || (loginData == null)) {
        // This error screen is present in case there are issues fetching the
        // computer's detailed data from the database
        return errorScreen();
    }
    else {
        function returnToPreviousPage() {
            if ((location.state != null)
                    && Object.hasOwn(location.state, 'from')) {
                navigate(location.state['from']);
            }
            else {
                navigate(`${PAGES.details}/${id}`);
            }
        }

        return <>
            <h1>{
                id === NEW_COMPUTER_KEYWORD
                ? 'Add New Computer'
                : 'Modify Device Information'}</h1>
            <br></br>
            <div className='page-content'>
                {/* formEvent.preventDefault() prevents the browser from reloading
                    the page when the form is submitted */}
                <form onSubmit={(formEvent) => {formEvent.preventDefault()}}>
                    <h2 className='page-header'>General Properties</h2>
                    {
                        id === NEW_COMPUTER_KEYWORD
                        ? <>
                            <h3 className='field-name'>Asset Tag</h3>
                            <input
                                type='text'
                                className='form-text-box'
                                value={newDeviceID}
                                onChange={(text) => {
                                    hideMessages();
                                    setNewDeviceID(text.target.value);
                                }}
                                placeholder='Enter asset tag here'
                            ></input>
                        </>
                        : <>
                            <h3 className='field-name'>Asset Tag</h3>
                            <input
                                type='text'
                                className='form-text-box'
                                value={id}
                                readOnly
                                disabled
                            ></input>
                        </>
                    }
                    {entryBox('Hostname', 'hostname', deviceData, setDeviceData)}
                    <br></br>
                    <br></br>
                    <h2 className='page-header'>Current Reservation</h2>
                    <>
                        <h3 className='field-name'>Status</h3>
                        <select
                            className='select-dropdown'
                            value={deviceData['reservation_status']}
                            onChange={(text) => {
                                hideMessages();
                                setDeviceData({
                                    ...deviceData,
                                    'reservation_status': text.target.value
                                });
                            }}
                        >
                            <option value={STATUSES.available}>{STATUSES.available}</option>
                            <option value={STATUSES.in_use}>{STATUSES.in_use}</option>
                            <option value={STATUSES.offline}>{STATUSES.offline}</option>
                            <option value={STATUSES.archived}>{STATUSES.archived}</option>
                        </select>
                    </>
                    <>
                        <h3 className='field-name'>User</h3>
                        <select
                            className='select-dropdown'
                            value={
                                deviceData['reservation_user'] != null
                                ? deviceData['reservation_user']
                                : 'None'
                            }
                            onChange={(text) => {
                                hideMessages();
                                setDeviceData({
                                    ...deviceData,
                                    'reservation_user': (
                                        text.target.value === 'None'
                                        ? null
                                        : text.target.value
                                    ),
                                    'reservation_name': (
                                        text.target.value === 'None'
                                        ? null
                                        : getUserName(text.target.value)
                                    )
                                });
                            }}
                        >
                            {generateUserSelectOptions()}
                        </select>
                    </>
                    {datePicker('Reservation Begin Date', 'reservation_begin')}
                    {datePicker('Reservation End Date', 'reservation_end')}
                    <br></br>
                    <br></br>
                    <h2 className='page-header'>Login Information</h2>
                    {entryBox('Password', 'password', loginData, setLoginData)}
                    {entryBox('PIN', 'pin', loginData, setLoginData,
                              'Enter PIN here')}
                    <br></br>
                    <br></br>
                    <h2 className='page-header'>Hardware</h2>
                    {entryBox('Manufacturer', 'manufacturer', deviceData, setDeviceData)}
                    {entryBox('Model', 'model', deviceData, setDeviceData)}
                    {entryBox('Serial Number', 'serial_number', deviceData, setDeviceData)}
                    {entryBox('Processor', 'cpu', deviceData, setDeviceData)}
                    {entryBox('Memory', 'memory', deviceData, setDeviceData)}
                    {entryBox('Disks', 'disks', deviceData, setDeviceData, null, true)}
                    {entryBox('GPUs', 'gpus', deviceData, setDeviceData,
                              'Enter GPUs here, putting each on its own line', true)}
                    <br></br>
                    <br></br>
                    <h2 className='page-header'>Notes</h2>
                    {entryBox('Device Notes', 'notes', deviceData, setDeviceData,
                              'Add notes about the device here', true, false)}
                    <br></br>
                    <button
                        className='round-button gray-button submit-button'
                        type='submit'
                        onClick={async () => {
                            hideMessages();
                            try {
                                if (id === NEW_COMPUTER_KEYWORD) {
                                    if ((newDeviceID === '') || (newDeviceID == null)) {
                                        throw new Error('asset tag cannot be blank');
                                    }

                                    const docRef = doc(db, 'computers', newDeviceID);
                                    const deviceSnapshot = await getDoc(docRef);
                                    if (deviceSnapshot.exists()) {
                                        throw new Error('device already exists');
                                    }

                                    await setDoc(docRef, deviceData);

                                    await setDoc(
                                        doc(db, 'logins', newDeviceID),
                                        loginData
                                    );
                                }
                                else {
                                    await updateDoc(
                                        doc(db, 'computers', id),
                                        deviceData
                                    );

                                    await updateDoc(
                                        doc(db, 'logins', id),
                                        loginData
                                    );
                                }
                                setSuccessVisibility(true);
                                returnToPreviousPage();
                            }
                            catch (exception) {
                                setErrorMessage(
                                    `Error: Unable to save device information (${exception})`)
                                setErrorVisibility(true);
                            }
                        }}
                    >Save</button>
                    &nbsp;&nbsp;
                    <button
                        className='round-button gray-button submit-button'
                        type='button'
                        onClick={() => returnToPreviousPage()}
                    >Cancel</button>
                </form>
                <p
                    className='error-message'
                    hidden={!errorVisibility}
                >{errorMessage}</p>
                <p
                    className='success-message'
                    hidden={!successVisibility}
                >Success!  Device information has been updated.</p>
            </div>
        </>;
    }
}
