import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faUser } from '@fortawesome/free-solid-svg-icons';

import { PAGES, ROLES } from '../constants.js';
import { getCurrentUser, getUserMetadata } from '../firebase.js';
import { isInternalMember } from '../pages/auth/utils.js';

import './navbar.css';


export default function NavBar() {
    // Determine current page
    const location = useLocation();
    const [path, setPath] = useState(location.pathname);

    useEffect(() => {
        // This hook is run when the page changes.  It updates the state of
        // any variables which determine which items appear in the navigation
        // bar (i.e., update `path` so the correct page is highlighted and
        // update `user` so user-specific options are shown)
        setPath(location.pathname);
        getCurrentUser().then((user) => setUser(user));
    }, [location]);

    // Determine user authentication status
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(ROLES.external);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        getCurrentUser().then((user) => {
            setUser(user);
            setInitialized(true);
        });
    }, []);

    useEffect(() => {
        if (user) {
            getUserMetadata(user.uid).then((metadata) => {
                setRole(metadata.role);
            });
        }
    }, [user]);

    // Render navigation bar
    if (initialized) {
        return (
            <nav className='navbar'>
                <ul>
                    <li>
                        <Link to={PAGES.home}>
                            <FontAwesomeIcon icon={faHouse} style={{color: "#ffffff",}} />
                        </Link>
                    </li>
                    <li className={path === PAGES.home ? 'active': 'inactive'}>
                        <Link to={PAGES.home}>Home</Link>
                    </li>
                    {
                        (user != null) && isInternalMember(role)
                        ? <li className={path.startsWith(PAGES.computer_list) ? 'active': 'inactive'}>
                              <Link to={PAGES.computer_list}>Computer Checkout</Link>
                          </li>
                        : <></>
                    }
                    {
                        (user != null) && ([ROLES.admin, ROLES.faculty].includes(role))
                        ? <li className={path.startsWith(PAGES.users) ? 'active': 'inactive'}>
                              <Link to={PAGES.users}>Users</Link>
                          </li>
                        : <></>
                    }
                    {
                        (user != null) && (role === ROLES.admin)
                        ? <li className={path.startsWith(PAGES.backup) ? 'active': 'inactive'}>
                              <Link to={PAGES.backup}>Backup</Link>
                          </li>
                        : <></>
                    }
                    <li
                        className={
                            (path === PAGES.login) || (path === PAGES.account_mgmt)
                            ? 'active'
                            : 'inactive'
                        }
                        style={{float: 'right'}}
                    >
                        {
                            user != null
                            ? <Link to={PAGES.account_mgmt}>
                                  <FontAwesomeIcon icon={faUser} style={{color: "#ffffff",}} />
                              </Link>
                            : <Link to={PAGES.login}>Login</Link>
                        }
                    </li>
                    <li
                        className={
                            path === PAGES.register
                            ? 'active'
                            : 'inactive'
                        }
                        style={{float: 'right'}}
                    >{user ? <></> : <Link to={PAGES.register}>Register</Link>}
                    </li>
                </ul>
            </nav>
        );
    }
    else {
        return <nav></nav>;
    }
}
