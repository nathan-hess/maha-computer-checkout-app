import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { collection, getDocs } from 'firebase/firestore';

import { PAGES, REDIRECT, ROLES } from '../../constants.js';
import { db, getCurrentUser, getUserMetadata } from '../../firebase.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { unauthorizedScreen } from '../../components/unauthorized.js';

import './backup.css';


export default function BackupPage() {
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

    // Display error message for non-administrator users
    const role = (await getUserMetadata(user.uid)).role;
    if (role !== ROLES.admin) {
        return unauthorizedScreen(false);
    }

    // Fetch backup data
    const computers = await getDocs(collection(db, 'computers'));
    const logins = await getDocs(collection(db, 'logins'));
    const reservationHistory = await getDocs(collection(db, 'reservation_history'));
    const users = await getDocs(collection(db, 'users'));

    // Render page content
    return <>
        <h1>Database Backup</h1>
        <div className='page-content'>
            <h2>Device Data</h2>
                <p>
                    Download backup copies of device and reservation
                    history data using the links below.
                </p>
                <ul>
                    <li key='computers'>
                        {collectionDownloadLink(
                            computers, 'computers.json',
                            'Computer list')}
                    </li>
                    <li key='logins'>
                        {collectionDownloadLink(
                            logins, 'logins.json',
                            'Device login information')}
                    </li>
                    <li key='reservation_history'>
                        {collectionDownloadLink(
                            reservationHistory, 'reservation_history.json',
                            'Reservation history')}
                    </li>
                </ul>
                <br></br>
            <h2>User Data</h2>
                <p>Download backup copies of user metadata using the links below.</p>
                <ul>
                    <li key='users'>
                        {collectionDownloadLink(
                            users, 'users.json',
                            'List of users')}
                    </li>
                </ul>
                <br></br>
        </div>
    </>
}


function collectionDownloadLink(data, filename, linkText) {
    // Convert collection to JavaScript object
    const dataJSON = {};
    data.forEach((document) => {
        dataJSON[document.id] = document.data();
    });

    // Convert JavaScript object to array of strings
    const dataStr = JSON.stringify(dataJSON, null, 4);

    // Create and return download link
    const url = URL.createObjectURL(new Blob([dataStr], {type: 'text/plain'}));
    return <a href={url} download={filename}>{linkText}</a>;
}
