import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PAGES } from '../../constants.js';
import { createUserAccount } from '../../firebase.js'

import '../../styles/forms.css';


export default function Register() {
    const navigate = useNavigate();

    // Variables for storing data entered in form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRetype, setPasswordRetype] = useState('');

    // Functions for providing descriptive error messages to user
    const [errorVisibility, setErrorVisibility] = useState(false);
    const [errorMessage, setErrorMessage] = useState('Unable to create account: unknown error');

    // Render new user form
    return (
        <div className='form-page'>
            <form
                className='form'
                onSubmit={(formEvent) => {formEvent.preventDefault()}}
            >
                <h2 className='form-header-text'>Create an Account</h2>
                <input
                    type='text'
                    className='form-text-box'
                    value={name}
                    onChange={(text) => {
                        if (errorVisibility && (name !== '')
                            && (email !== '') && (password !== ''))
                        {
                            setErrorVisibility(false);
                        }
                        setName(text.target.value);
                    }}
                    placeholder='Name'
                ></input>
                <input
                    type='text'
                    className='form-text-box'
                    value={email}
                    onChange={(text) => {
                        setErrorVisibility(false);
                        setEmail(text.target.value);
                    }}
                    placeholder='Email Address'
                ></input>
                <input
                    type='password'
                    className='form-text-box'
                    value={password}
                    onChange={(text) => {
                        setErrorVisibility(false);
                        setPassword(text.target.value)
                    }}
                    placeholder='Password'
                ></input>
                <input
                    type='password'
                    className='form-text-box'
                    value={passwordRetype}
                    onChange={(text) => {
                        setErrorVisibility(false);
                        setPasswordRetype(text.target.value)
                    }}
                    placeholder='Retype Password'
                ></input>
                <h6
                    className='form-error-message'
                    hidden={!errorVisibility}
                >{errorMessage}</h6>
                <button
                    className='form-submit-button'
                    type='submit'
                    onClick={async () => {
                        if ((name === '') || (email === '')
                            || (password === '') || (passwordRetype === ''))
                        {
                            setErrorMessage('Please provide a name, email address, and password');
                            setErrorVisibility(true);
                        }
                        else if (password !== passwordRetype) {
                            setErrorMessage('Passwords must match');
                            setErrorVisibility(true);
                        }
                        else {
                            setErrorVisibility(false);
                            const result = await createUserAccount(name, email, password);
                            if (result.success) {
                                navigate(PAGES.home);
                            }
                            else {
                                setErrorMessage(result.error);
                                setErrorVisibility(true);
                            }
                        }
                    }}
                >Submit</button>
            </form>
        </div>
    );
}
