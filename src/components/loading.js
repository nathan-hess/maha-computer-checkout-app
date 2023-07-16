import { RingLoader } from 'react-spinners';

import './loading.css';


/**
 * Returns a generic loading screen with an animated spinner
 */
export function loadingScreen() {
    return <>
        <div className='loading-screen'>
            <h2>Loading . . . Please Wait</h2>
            <RingLoader color={'black'} size={150} className='spinner' />
        </div>
    </>;
}
