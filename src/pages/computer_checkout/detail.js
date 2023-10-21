import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import {
    PAGES,
    REDIRECT,
    ROLES,
    STATUSES,
} from '../../constants.js';
import {
    db,
    getCurrentUser,
    getUserMetadata,
} from '../../firebase.js';
import { isInternalMember } from '../auth/utils.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { internalMemberOnlyScreen } from '../../components/unauthorized.js';
import { getStatus } from './status.js';

import './detail.css';


export default function ComputerDetailPage() {
    const { id } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    const [pageContent, setPageContent] = useState(loadingScreen());

    useEffect(() => {
        generatePage(id, location, navigate).then(
            (content) => {
                setPageContent(content);
            },
            (reason) => {
                console.error(reason);
                setPageContent(errorScreen(
                    'Unable to retrieve detailed device information for computer '
                    + `"${id}" (either the device does not exist or an internal `
                    + 'server error has occurred).'
                ));
            }
        );
    }, [id, location, navigate]);

    return pageContent;
}


async function generatePage(id, location, navigate) {
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

    // Retrieve detailed computer data
    const data = await getDoc(doc(db, `computers/${id}`));

    // Retrieve login instruction information
    const sharedAccountInfo = await getDoc(doc(db, 'config/google_remote_desktop'));

    // Fetch administrator/faculty-only data
    const canViewHistory = (role === ROLES.admin || role === ROLES.faculty);
    const history = (
        canViewHistory
        ? await getDocs(query(collection(db, 'reservation_history'),
                              where('asset_tag', '==', id),
                              orderBy('reservation_end', 'asc')))
        : null
    );
    const users = canViewHistory ? await getDocs(collection(db, 'users')) : null;

    // Determine whether to display login details (displayed if user is an
    // administrator or if the user has checked out the device and their
    // reservation has not yet ended)
    const userCheckedOutDevice = (
        (data.get('reservation_user') === user.uid)
        && (getStatus(data) === STATUSES.in_use)
    );
    const canViewLogin = ((role === ROLES.admin) || userCheckedOutDevice);
    const login = canViewLogin ? await getDoc(doc(db, `logins/${id}`)) : null;

    // Determine whether to display current/most recent user section
    const showCurrentUser = (
        (getStatus(data) === STATUSES.in_use)
        || (getStatus(data) === STATUSES.pending
            && role === ROLES.admin)
    );

    const beginDate = showCurrentUser ? new Date(data.get('reservation_begin')['seconds'] * 1000) : null;
    const endDate = showCurrentUser ? new Date(data.get('reservation_end')['seconds'] * 1000) : null;

    // Render details page
    function generateBulletedList(array) {
        if (array.length > 0) {
            const lines = [];
            var i = 0;
            array.forEach((item) => lines.push(<li key={i++}>{item}</li>));
            return lines;
        }
        else {
            return <li key='none'><i>No items found</i></li>;
        }
    };

    return <>
        <h1>{id}</h1>
        {
            role === ROLES.admin
            ? <Link
                className='link-button admin-new-button'
                to={`${PAGES.computer_modify}/${id}`}
                state={{from: location.pathname}}
            >Edit Device
            </Link>
            : <></>
        }
        <div className='page-content'>
            {
                canViewLogin
                ? <>
                    <br></br>
                    <hr></hr>
                    <h2>Login</h2>
                    {
                        userCheckedOutDevice
                        ? usageInstructions(id, sharedAccountInfo)
                        : <></>
                    }
                    {
                        login.exists()
                        ? <ul>
                            <li><b>Password: </b>{login.get('password')}</li>
                            <li><b>PIN: </b>{login.get('pin')}</li>
                          </ul>
                        : <p><i>No login details found</i></p>
                    }
                    <hr></hr>
                  </>
                : <></>
            }
            <br></br>
            <h2>General Properties</h2>
            <ul>
                <li key='asset_tag'><b>Asset Tag: </b>{id}</li>
                <li key='hostname'><b>Hostname: </b>{data.get('hostname')}</li>
            </ul>
            <br></br>
            <h2>Hardware</h2>
            <ul>
                <li key='manufacturer'><b>Manufacturer: </b>{data.get('manufacturer')}</li>
                <li key='model'><b>Model: </b>{data.get('model')}</li>
                <li key='serial_number'><b>Serial Number: </b>{data.get('serial_number')}</li>
                <li key='cpu'><b>Processor: </b>{data.get('cpu')}</li>
                <li key='memory'><b>Memory: </b>{data.get('memory')}</li>
                <li key='disks'><b>Disks</b>
                    <ul>{generateBulletedList(data.get('disks'))}</ul>
                </li>
                <li key='gpus'><b>GPUs</b>
                    <ul>{generateBulletedList(data.get('gpus'))}</ul>
                </li>
            </ul>
            <br></br>
            <h2>Notes</h2>
            <p>{
                (data.get('notes') === '') || (data.get('notes') == null)
                ? <i>No device notes added</i>
                : data.get('notes')
            }</p>
            {
                showCurrentUser
                ? <>
                    <br></br>
                    <h2>{getStatus(data) === STATUSES.in_use ? "Current" : "Last"} User</h2>
                    <ul>
                        <li key='reservation_user'><b>User: </b>{data.get('reservation_name')}</li>
                        <li key='reservation_begin'>
                            <b>Reservation Begin Date: </b>
                            {beginDate.toLocaleDateString()} {beginDate.toLocaleTimeString()}
                        </li>
                        <li key='reservation_end'>
                            <b>Reservation End Date: </b>
                            {endDate.toLocaleDateString()} {endDate.toLocaleTimeString()}
                        </li>
                    </ul>
                </>
                : <></>
            }
            {
                canViewHistory
                ? <>
                    <br></br>
                    <h2>History</h2>
                    {reservationHistoryTable(history, users)}
                  </>
                : <></>
            }
        </div>
    </>;
}


function reservationHistoryTable(history, users) {
    function findUserName(uid, userList) {
        var name = null;

        userList.forEach((document) => {
            if (document.id === uid) {
                name = document.get('name');
            }
        });

        return name;
    }

    const rows = [];
    history.forEach((document) => {
        const beginDate = new Date(document.get('reservation_begin')['seconds'] * 1000);
        const endDate = new Date(document.get('reservation_end')['seconds'] * 1000);

        rows.push(
            <tr key={document.id}>
                <td>{findUserName(document.get('user'), users)}</td>
                <td>{document.get('user')}</td>
                <td>{`${beginDate.toLocaleDateString()} ${beginDate.toLocaleTimeString()}`}</td>
                <td>{`${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`}</td>
                <td>{((endDate.valueOf() - beginDate.valueOf()) / 86400000).toFixed(3)} days</td>
            </tr>
        );
    });

    if (rows.length > 0) {
        return (
            <table className='table'>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>User ID</th>
                        <th>Begin Date</th>
                        <th>End Date</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }

    return <i>No device checkout history found</i>;
}


function usageInstructions(assetTag, accountInfo) {
    return <p>
        To access this device, log in to&nbsp;
        <a href='https://remotedesktop.google.com/access'>Chrome Remote Desktop</a>
        &nbsp;with the&nbsp;
        <a href={`mailto:${accountInfo.get('email')}`}>{accountInfo.get('email')}</a>
        &nbsp;account.  Then, select "{assetTag}" from the list of available
        computers and log in with the password and PIN shown below.
    </p>;
}
