import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import './errors.css';


/**
 * Returns a generic error message screen
 *
 * @param message The error message to display.  Set to `null` to use the
 * default message "Unable to process your request.  Please try again later."
 */
export function errorScreen(message=null) {
    if (message != null) {
        message = 'Unable to process your request.  Please try again later.';
    }

    return <>
        <h1 className='error-screen-header'>
            <FontAwesomeIcon
                icon={faExclamationTriangle}
                style={{color: "#ff0000",}}
                size='lg'
            />
            &nbsp;&nbsp;ERROR
        </h1>
        <h2 className='error-screen-message'>{message}</h2>
    </>;
}
