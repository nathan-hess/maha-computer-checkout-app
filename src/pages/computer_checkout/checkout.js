import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { logEvent } from 'firebase/analytics';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';

import DatePicker from 'react-datepicker';

import {
    MAX_RESERVE_DAYS,
    PAGES,
    REDIRECT,
    STATUSES,
} from '../../constants.js';
import {
    analytics,
    db,
    useGetDoc,
    useGetFirebaseAuthStatus,
} from '../../firebase.js';
import { isInternalMember } from '../auth/utils.js';
import { errorScreen } from '../../components/errors.js';
import { loadingScreen } from '../../components/loading.js';
import { internalMemberOnlyScreen } from '../../components/unauthorized.js';
import { getStatus } from './status.js';

import 'react-datepicker/dist/react-datepicker.css';
import '../auth/account.css';
import './checkout.css';
import './detail.css';


export default function ComputerCheckout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch data from database
    const [user, initialized, role, name] = useGetFirebaseAuthStatus();
    const [deviceData, loadingDeviceData, errorDevice] = useGetDoc(`computers/${id}`);
    const [helpContact, loadingHelpContact, errorHelp] = useGetDoc('config/help');

    // Determine maximum reservation date
    const now = new Date();

    const maxReserveDate = new Date(now.valueOf() + 86400000*(MAX_RESERVE_DAYS+1));
    maxReserveDate.setHours(23, 59, 0);

    const [reservationEnd, setReservationEnd] = useState(maxReserveDate);

    // Variables for form UI elements
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [errorVisibility, setErrorVisibility] = useState(false);
    const [submitErrorVisibility, setSubmitErrorVisibility] = useState(false);

    if (loadingDeviceData || loadingHelpContact || !initialized) {
        return loadingScreen();
    }
    else if (user == null) {
        navigate(`${PAGES.login}?${REDIRECT}=${location.pathname}`);
    }
    else if (!isInternalMember(role) || errorHelp) {
        return internalMemberOnlyScreen()
    }
    else if (errorDevice || !(getStatus(deviceData, now) === STATUSES.available)) {
        return errorScreen(`Computer "${id}" is not available for checkout`);
    }
    else {
        return <>
            <h1>Check Out Device</h1>
            <br></br>
            <div className='page-content'>
                <h2>Device Overview</h2>
                <p><b>Requested device:</b> {id}&nbsp;
                (<Link
                     to={PAGES.details + `/${id}`}
                     target='_blank'
                     rel='noopener noreferrer'
                 >details</Link>)</p>
                <br></br>
                <h2>Reservation Details</h2>
                <h3>End Time</h3>
                <DatePicker
                    dateFormat='MM/dd/yyyy h:mm aa'
                    showTimeInput
                    includeDateIntervals={[{start: now, end: maxReserveDate}]}
                    onChange={(date) => setReservationEnd(date)}
                    selected={reservationEnd}
                />
                <br></br>
                <br></br>
                <h2>Terms and Conditions</h2>
                <>{termsAndConditions(helpContact)}</>
                <div>
                    <input
                        type='checkbox'
                        id='terms-checkbox'
                        checked={termsAccepted}
                        onChange={() => {setTermsAccepted(!termsAccepted)}}
                    ></input>
                    <label htmlFor='terms-checkbox'> I agree to the terms and conditions</label>
                </div>
                <br></br>
                <br hidden={errorVisibility}></br>
                <div hidden={!errorVisibility}>
                <p className='checkout-form-error-message'>Please fill out all required fields</p>
                <br></br>
                </div>
                <button
                    className='round-button gray-button'
                    onClick={async () => {
                        setErrorVisibility(false);
                        setSubmitErrorVisibility(false);
                        if (!termsAccepted) {
                            setErrorVisibility(true);
                        }
                        else {
                            try {
                                await updateDoc(
                                    doc(db, 'computers', id),
                                    {
                                        reservation_begin: Timestamp.fromDate(new Date()),
                                        reservation_end: Timestamp.fromDate(reservationEnd),
                                        reservation_name: name,
                                        reservation_status: 'in_use',
                                        reservation_user: user.uid,
                                    }
                                );
                                logEvent(analytics, 'purchase');
                                navigate(`${PAGES.details}/${id}`);
                            }
                            catch (exception) {
                                console.error(exception);
                                setSubmitErrorVisibility(true);
                            }
                        }
                    }}
                >Submit</button>
                <p
                    className='checkout-submit-error-message'
                    hidden={!submitErrorVisibility}
                >Error: Unable to check out device.  Please check your
                 network connection and try again later.</p>
            </div>
            <p>&nbsp;</p>
        </>;
    }
}


function termsAndConditions(helpContact) {
    const contact = <>
        {helpContact.get('name')} (<a href={`mailto:${helpContact.get('email')}`}
                                   >{helpContact.get('email')}</a>)
    </>;

    return <>
        <ul>
            <li>I will use any checked out computers for the sole purpose of research work for
                the Maha Fluid Power Research Center.</li>
            <li>My use of any checked out computers will respect the Maha Confidentiality
                Agreement signed upon joining the lab.</li>
            <li>I will not download and/or install illegal software, malware, or programs from
                sketchy websites.</li>
            <li>I will not download and/or install software unless the software license allows
                use for research.  I will not install SOLIDWORKS on checked out computers.</li>
            <li>I will not use any checked out computers for illegal or unethical purposes,
                and I will not download or save illegally-obtained files or data that I am not
                authorized to access to checked out computers.</li>
            <li>I will not attempt to undermine privacy or security of shared computers,
                including but not limited to installing remote access or monitoring software.</li>
            <li>I understand that shared computers may or may not be wiped between use.  I
                will make sure to delete sensitive data and if there is a need to wipe a computer,
                I will contact {contact} to request that the computer be wiped.</li>
            <li>I understand that unless I have checked out the computer, all shared computers
                may be wiped at any point without notice.  In other words, as soon as the reservation
                period ends, I understand that my files may be irreversibly deleted from the computer.</li>
            <li>I accept the condition of checked-out computers as-is.  If I have concerns about the
                condition of a computer, I will email {contact} for assistance.</li>
        </ul>
    </>;
}
