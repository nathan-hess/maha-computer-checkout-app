import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

import {
    PAGES,
    REDIRECT,
    ROLES,
} from '../../constants.js';
import { db, useGetFirebaseAuthStatus } from '../../firebase.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { unauthorizedScreen } from '../../components/unauthorized.js';

import './modify_user.css';


export default function ModifyUserPage() {
    const { id } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    // Determine user authentication status
    const [user, initialized, role, ] = useGetFirebaseAuthStatus();

    // Variables for form UI elements
    const [errorVisibility, setErrorVisibility] = useState(false);
    const [successVisibility, setSuccessVisibility] = useState(false);

    // Fetch user data once user authentication status has been
    // determined and the user is confirmed to be an administrator
    const [loadingUserData, setLoadingUserData] = useState(true);
    const [userData, setUserData] = useState(null);
    useEffect(() => {
        if ((user != null) && (role === ROLES.admin)) {
            const path = `users/${id}`;
            getDoc(doc(db, path)).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    setUserData(docSnapshot.data());
                }
                else {
                    console.error(`Document "${path}" does not exist`);
                }
                setLoadingUserData(false);
            });
        }
    }, [id, user, role]);

    function hideMessages() {
        setErrorVisibility(false);
        setSuccessVisibility(false);
    }

    function entryBox(header, dbKey, helpText=null, editable=true) {
        return <>
            <h3 className='field-name'>{header}</h3>
            <input
                type='text'
                className='form-text-box'
                value={userData[dbKey]}
                onChange={(text) => {
                    hideMessages();
                    setUserData({
                        ...userData,
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
    else if (loadingUserData) {
        // Display loading screen while waiting to fetch user data
        // from database
        return loadingScreen();
    }
    else if (userData == null) {
        // This error screen is present in case there are issues fetching
        // user data from the database
        return errorScreen();
    }
    else {
        return <>
            <h1>Modify User Information</h1>
            <br></br>
            <div className='page-content'>
                {/* formEvent.preventDefault() prevents the browser from reloading
                    the page when the form is submitted */}
                <form onSubmit={(formEvent) => {formEvent.preventDefault()}}>
                    <h3 className='field-name'>User ID</h3>
                    <input
                        type='text'
                        className='form-text-box'
                        value={id}
                        readOnly
                        disabled
                        style={{width: '400px'}}
                    ></input>
                    <br></br>
                    {entryBox('Email Address', 'email', null, false)}
                    <br></br>
                    {entryBox('Name', 'name')}
                    <br></br>
                    <h3>Role</h3>
                    <select
                        className='select-dropdown'
                        value={userData['role']}
                        onChange={(text) => {
                            hideMessages();
                            setUserData({
                                ...userData,
                                'role': text.target.value
                            });
                        }}
                    >
                        <option value={ROLES.admin}>{ROLES.admin}</option>
                        <option value={ROLES.faculty}>{ROLES.faculty}</option>
                        <option value={ROLES.student}>{ROLES.student}</option>
                        <option value={ROLES.external}>{ROLES.external}</option>
                    </select>
                    <br></br>
                    <button
                        className='round-button gray-button submit-button'
                        type='submit'
                        onClick={async () => {
                            hideMessages();
                            try {
                                await updateDoc(
                                    doc(db, 'users', id),
                                    userData
                                );

                                // Sync updates to user name across reserved devices
                                const reservedDevices = await getDocs(query(
                                    collection(db, 'computers'),
                                    where('reservation_user', '==', id)
                                ));

                                reservedDevices.forEach((document) => {
                                    if (document.get('reservation_name') !== userData['name']) {
                                        updateDoc(
                                            doc(db, 'computers', document.id),
                                            {reservation_name: userData['name']}
                                        );
                                        console.log(`Changed user name for device "${document.id}"`);
                                    }
                                });

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
                >Error: Unable to save user information.  Please check your
                 network connection and try again later.</p>
                <p
                    className='success-message'
                    hidden={!successVisibility}
                >Success!  User information has been updated.</p>
            </div>
        </>;
    }
}
