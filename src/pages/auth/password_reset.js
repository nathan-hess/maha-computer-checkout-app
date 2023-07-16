import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PAGES } from '../../constants.js';
import { resetPassword } from '../../firebase.js';

import '../../styles/forms.css';


export default function PasswordReset() {
    // Variables for storing data entered in form fields
    const [email, setEmail] = useState('');

    // Variable for hiding input box once form is submitted
    const [inputVisibility, setInputVisibility] = useState(true);

    // Functions for providing descriptive error messages to user
    const [errorMessage, setErrorMessage] = useState('Unknown error');
    const [errorVisibility, setErrorVisibility] = useState(false);

    // Render password reset form
    return (
        <div className='form-page'>
            <form
                className='form'
                onSubmit={(formEvent) => {formEvent.preventDefault()}}
            >
                <h2
                    className='form-header-text'
                    hidden={!inputVisibility}
                >Password Reset</h2>
                <input
                    type='text'
                    className='form-text-box'
                    hidden={!inputVisibility}
                    value={email}
                    onChange={(text) => setEmail(text.target.value)}
                    placeholder='Email Address'
                ></input>
                <h6
                    className='form-error-message'
                    hidden={!errorVisibility}
                >{errorMessage}</h6>
                <button
                    className='form-submit-button'
                    hidden={!inputVisibility}
                    type='submit'
                    onClick={async () => {
                        if (email === '') {
                            setErrorMessage('Please enter your email address');
                            setErrorVisibility(true);
                        }
                        else {
                            setErrorVisibility(false);;
                            await resetPassword(email);
                            setInputVisibility(false);
                        }
                    }}
                >Submit</button>
                <p
                    hidden={inputVisibility}
                >A password reset link has been sent to your email (assuming
                you have an account on the system).  Please check your email
                for further instructions.</p>
                <br hidden={inputVisibility}></br>
                <Link hidden={inputVisibility} to={PAGES.login}>Log In</Link>
            </form>
        </div>
    );
}
