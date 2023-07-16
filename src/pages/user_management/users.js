import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
    collection,
    getDocs,
} from 'firebase/firestore';

import {
    PAGES,
    REDIRECT,
    ROLES,
} from '../../constants.js';
import {
    db,
    getCurrentUser,
    getUserMetadata,
} from '../../firebase.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { unauthorizedScreen } from '../../components/unauthorized.js';

import './users.css';


export default function UserList() {
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

    // Display error message for users who don't have sufficient permissions
    // to view the page
    const role = (await getUserMetadata(user.uid)).role;
    if (!([ROLES.admin, ROLES.faculty].includes(role))) {
        return unauthorizedScreen(true);
    }

    // Determine page-level user permissions
    const canEditUsers = (role === ROLES.admin);

    // Fetch user list
    const userList = await getDocs(collection(db, 'users'));

    // Render page content
    return <>
        <h1>User Management</h1>
        <div className='page-content'>
            <h2>Administrators</h2>
            {userTable(userList, [ROLES.admin], canEditUsers)}
            <br></br>
            <h2>Faculty</h2>
            {userTable(userList, [ROLES.faculty], canEditUsers)}
            <br></br>
            <h2>Students</h2>
            {userTable(userList, [ROLES.student], canEditUsers)}
            <br></br>
            <h2>External Users</h2>
            {userTable(userList, [ROLES.external], canEditUsers)}
        </div>
    </>;
}


function userTable(users, roles, showEditButton) {
    const rows = [];
    users.forEach((document) => {
        if (!roles.includes(document.get('role'))) {
            return;
        }

        rows.push(
            <tr key={document.id}>
                <td>{document.id}</td>
                <td>{document.get('name')}</td>
                <td>{document.get('email')}</td>
                <td>{document.get('role')}</td>
                {
                    showEditButton
                    ? <td><Link
                          className='link-button'
                          to={`${PAGES.user_modify}/${document.id}`}
                      >Edit</Link>
                      </td>
                    : <></>
                }
            </tr>
        );
    });

    if (rows.length === 0) {
        return <p><i>No users found</i></p>;
    }

    return (
        <table className='table'>
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    {showEditButton
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
