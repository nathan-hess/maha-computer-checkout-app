import { Link } from 'react-router-dom';

import { PAGES } from '../../constants.js';


/**
 * Returns a list with a formatted list of basic computer information (asset
 * tag, manufacturer, processor, etc.)
 *
 * @param assetTag The asset tag of the device
 * @param deviceData A Firebase `DocumentSnapshot` containing device data
 */
export function basicDeviceInfo(assetTag, deviceData) {
    return <>
        <h2>Device Properties</h2>
        <ul>
            <li><b>Asset Tag: </b>{assetTag}</li>
            <li>
                <b>Model: </b>
                {`${deviceData.get('manufacturer')} ${deviceData.get('model')}`}
            </li>
            <li><b>Processor: </b>{deviceData.get('cpu')}</li>
            <li><b>Memory: </b>{deviceData.get('memory')}</li>
            <li>
                <Link
                    to={PAGES.details + `/${assetTag}`}
                    target='_blank'
                    rel='noopener noreferrer'
                >More details</Link></li>
        </ul>
        <br></br>
    </>;
}
