import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { PAGES, REDIRECT } from '../../constants.js';
import { auth, loginWithEmail, getCurrentUser } from '../../firebase.js';

import './login.css';


export default function Login() {
    const ErrorMessageType = {
        InvalidInfo: 0,  // unregistered email or wrong password
        MissingInfo: 1,  // email or password not entered
    };

    const navigate = useNavigate();

    // Get path to which to redirect after logging in
    const location = useLocation();
    const redirect = (new URLSearchParams(location.search)).get(REDIRECT);

    // Variables for storing data entered in form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Determine user authentication status
    const [user, setUser] = useState(null);

    useEffect(() => {
        getCurrentUser().then((user) => setUser(user));
    }, []);

    useEffect(() => {
        if (user != null) {
            if (redirect != null) {
                navigate(redirect);
            }
            else {
                navigate(PAGES.home);
            }
        }
    }, [user, redirect, navigate]);

    // Functions for providing descriptive error messages to user
    const [errorMesage, setErrorMessage] = useState('Unknown error');
    const [errorVisibility, setErrorVisibility] = useState(false);

    function displayErrorMessage(message) {
        if (message === ErrorMessageType.InvalidInfo) {
            setErrorMessage('Invalid email address and/or password');
        }
        else if (message === ErrorMessageType.MissingInfo) {
            setErrorMessage('Please enter your email address and password');
        }

        setErrorVisibility(true);  // show error message
    };

    function hideErrorMessages() {
        setErrorVisibility(false);  // hide error message
    };

    // Render login form
    return (
        <div className='form-page'>
            <form
                className='form'
                onSubmit={(formEvent) => {formEvent.preventDefault()}}
            >
                <h2 className='form-header-text'>Sign In</h2>
                <input
                    type='text'
                    className='form-text-box'
                    value={email}
                    onChange={(text) => {
                        if (errorVisibility && (email !== '') && (password !== '')) {
                            setErrorVisibility(false);
                        }
                        setEmail(text.target.value);
                    }}
                    placeholder='Email Address'
                ></input>
                <input
                    type='password'
                    className='form-text-box'
                    value={password}
                    onChange={(text) => {
                        if (errorVisibility && (email !== '') && (password !== '')) {
                            setErrorVisibility(false);
                        }
                        setPassword(text.target.value)
                    }}
                    placeholder='Password'
                ></input>
                <h6
                    className='form-error-message'
                    hidden={!errorVisibility}
                >{errorMesage}</h6>
                <button
                    className='form-submit-button'
                    type='submit'
                    onClick={async () => {
                        if ((email === '') || (password === '')) {
                            displayErrorMessage(ErrorMessageType.MissingInfo);
                        }
                        else {
                            hideErrorMessages();
                            if (await loginWithEmail(email, password)) {
                                setUser(auth.currentUser);
                            }
                            else {
                                displayErrorMessage(ErrorMessageType.InvalidInfo);
                            }
                        }
                    }}
                >Log In</button>
                <Link
                    className='forgot-password-link'
                    to={PAGES.password_reset}
                >Forgot your password?</Link>
            </form>
        </div>
    );
}
