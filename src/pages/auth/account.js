import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PAGES, REDIRECT } from '../../constants';
import { logout, resetPassword, useGetFirebaseAuthStatus } from '../../firebase';

import './account.css';


export default function AccountManagement() {
    const navigate = useNavigate();
    const location = useLocation();

    const [errorVisibilityLogout, setErrorVisibilityLogout] = useState(false);
    const [errorVisibilityReset, setErrorVisibilityReset] = useState(false);
    const [successVisibilityReset, setSuccessVisibilityReset] = useState(false);

    const [user, initialized, role, name] = useGetFirebaseAuthStatus();

    if (initialized) {
        if (user != null) {
            const lastPasswordChange = new Date(parseInt(user.reloadUserInfo['passwordUpdatedAt']));
            const daysSincePasswordChange
                = Math.round(((new Date()).valueOf() - lastPasswordChange.valueOf()) / 86400000);

            return <>
                <h1>Account Management</h1>
                <br></br>
                <div className='page-content'>
                    <h2>Account Details</h2>
                    <p><b>Name: </b>{name}</p>
                    <p><b>Email address: </b>{user.email}</p>
                    <p><b>Account type: </b>{role}</p>
                    <p><b>Last password update: </b>
                        {`${lastPasswordChange.toLocaleDateString()} at `
                        + `${lastPasswordChange.toLocaleTimeString()} `
                        + `(${daysSincePasswordChange} `
                        + `day${daysSincePasswordChange === 1 ? '' : 's'} ago)`}</p>
                    <br></br>
                    <h2>Change Password</h2>
                    <p>
                        To reset your password, click the button below.  An email
                        will be sent to you containing a link you can use to set a
                        new password.
                    </p>
                    <button
                        className='round-button gray-button'
                        onClick={async () => {
                            if (await resetPassword(user.email)) {
                                setSuccessVisibilityReset(true);
                            }
                            else {
                                setErrorVisibilityReset(true);
                            }
                        }}
                    >Send Link to Change Password</button>
                    <p className='success-message' hidden={!successVisibilityReset}>
                        Success!  Password change link has been sent to {user.email}.
                    </p>
                    <p className='error-message' hidden={!errorVisibilityReset}>
                        Unable to send password change email.  Please check your Internet
                        connection and try again later.
                    </p>
                    <br></br>
                    <br></br>
                    <h2>Sign Out</h2>
                    <p>
                        Click the button below to sign out.  Please close your browser
                        window afterward to ensure you have completely signed out of
                        your account.
                    </p>
                    <button
                        className='round-button red-button'
                        onClick={async () => {
                            if (await logout()) {
                                navigate(PAGES.login);
                            }
                            else {
                                setErrorVisibilityLogout(true);
                            }
                        }}
                    >Sign Out</button>
                    <p className='error-message' hidden={!errorVisibilityLogout}>
                        Unable to sign out.  Please check your Internet connection and
                        try again later.
                    </p>
                </div>
            </>;
        }
        else {
            navigate(`${PAGES.login}?${REDIRECT}=${location.pathname}`);
        }
    }
    else {
        return <></>;
    }
}
