import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getAnalytics, logEvent } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    getFirestore,
    setDoc,
} from 'firebase/firestore';

import { ROLES } from './constants';


const firebaseConfig = {
    apiKey: 'FIREBASE_API_KEY',
    authDomain: 'PROJECT-ID.firebaseapp.com',
    projectId: 'PROJECT-ID',
    storageBucket: 'PROJECT-ID.appspot.com',
    messagingSenderId: 'FIREBASE_MESSENGER_ID',
    appId: 'FIREBASE_APP_ID',
    measurementId: 'GOOGLE_ANALYTICS_MEASUREMENT_ID'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);


/**
 * Returns a promise which resolves to the currently logged-in user (or `null`
 * if no user is signed in)
 *
 * This function is typically used as follows:
 * ```
 * const [user, setUser] = useState(null);
 * getCurrentUser().then((user) => {
 *     setUser(user);
 * });
 * ```
 */
export function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        }, reject)
    });
}


/**
 * Returns a promise which resolves to metadata about a given user
 *
 * @param userID The user ID whose metadata to retrieve
 *
 * This function returns a promise which resolves to an object
 * containing the user's account metadata, throwing an exception
 * if the user was not found in the database.  This function is
 * typically used as follows:
 * ```
 * const userMetadata = await getUserMetadata(uid);
 * console.log('Name: ', userMetadata.name);
 * console.log('Role: ', userMetadata.role);
 * ```
 */
export async function getUserMetadata(userID) {
    const metadata = await getDoc(doc(db, 'users', userID));
    if (metadata.exists()) {
        return {
            role: metadata.get('role'),
            name: metadata.get('name'),
        };
    }
    throw new Error(`User "${userID}" does not exist`);
}


/**
 * A React component for setting Google Analytics page properties
 *
 * Using Firebase Hosting and React Router, all requests are redirected to
 * `index.html`, resulting in the same page being recorded by default.  This
 * function sets the page to the "true" location to more accurately record
 * user page access.
 */
export function GoogleAnalyticsLogLocation() {
    const location = useLocation();

    useEffect(() => {
        logEvent(
            analytics, 'page_view',
            {
                page_title: location.pathname,
                page_location: window.location.href,
                page_path: location.pathname + location.search
            }
        );
    }, [location]);
}


/**
 * Custom hook which performs a one-time request to determine the
 * authentication status of the user after the page loads
 */
export function useGetFirebaseAuthStatus() {
    const [user, setUser] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [role, setRole] = useState(null);
    const [name, setName] = useState(null);

    // Effect is run a single time once the page has loaded
    useEffect(() => {
        // First, send a Firebase authentication request to
        // determine the current user, and wait for it to resolve
        getCurrentUser().then((user) => {
            setUser(user);

            // If the user is currently logged in, retrieve their name
            // and role; if not, leave these values set to `null`
            if (user) {
                getUserMetadata(user.uid).then((userInfo) => {
                    setRole(userInfo.role);
                    setName(userInfo.name);

                    setInitialized(true);
                });
            }
            else {
                setInitialized(true);
            }
        });
    }, []);

    return [user, initialized, role, name];
}


/**
 * Retrieves a document from the Firestore database
 *
 * @param path The forward slash-separated path to the document to be retrieved
 */
export function useGetDoc(path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // useEffect() prevents hook from being called repeatedly
    useEffect(() => {
        getDoc(doc(db, path)).then(
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setData(docSnapshot);
                    setLoading(false);
                }
                else {
                    console.error(`Document "${path}" does not exist`);
                    setLoading(false);
                    setError(true);
                }
            },
            (reason) => {
                console.error(reason);
                setLoading(false);
                setError(true);
            }
        );
    }, [path]);

    return [data, loading, error];
}


/**
 * Creates a new user account
 *
 * @param name The display name of the user
 * @param email The users's email address
 * @param password The user's password
 *
 * @returns `true` if the user account was successfully created and
 * `false` otherwise
 */
export async function createUserAccount(name, email, password) {
    var message = 'Cannot create account: ';

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid),
                     {
                        name: name,
                        email: email,
                        role: ROLES.external,
                     });

        logEvent(analytics, 'sign_up');

        return {success: true, error: null};
    }
    catch (exception) {
        if (exception.code === 'auth/email-already-in-use') {
            message += 'email address is already registered';
        }
        else if (exception.code === 'auth/invalid-email') {
            message += 'invalid email address';
        }
        else if (exception.code === 'auth/weak-password') {
            message += 'password is too weak';
        }
        else {
            message += exception.code;
        }
    }

    return {success: false, error: message};
}


/**
 * Signs a user in with their email and password
 *
 * @param email The user's email address
 * @param password The user's password
 *
 * @returns `true` if the user was successfully signed in and `false` otherwise
 */
export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    }
    catch (error) {
        console.error(error.message);
        return false;
    }

    logEvent(analytics, 'login');

    return true;
}


/**
 * Signs a user out
 *
 * @returns `true` if the user was successfully signed out and
 * `false` otherwise
 */
export async function logout() {
    try {
        await signOut(auth);
    }
    catch (error) {
        console.error(error.message);
        return false;
    }

    return true;
}


/**
 * Sends a password reset link to a user's email
 *
 * @param email The email address for the account to which to send a
 * password reset link
 *
 * @returns `true` if the password reset email was successfully sent and
 * `false` otherwise
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    }
    catch (error) {
        console.error(error.message);
        return false;
    }

    return true;
}
