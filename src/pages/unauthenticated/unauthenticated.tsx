import './unauthenticated.css';
import { RESX } from '../../strings'
import { AuthContext } from '../../context/authContext';
import PropagateLoader from 'react-spinners/PropagateLoader';
import { Styles } from '../../shared/styles';

import React from 'react';

/* UX */

function Page({ authContext, hideSignIn, defaultHost, applicationHost, deviceId, handler, signOut }) {
    return <div className='unauthpage'>
        <h1>{RESX.app.title}</h1>
        <h2>{RESX.app.subtitle}</h2>
        {hideSignIn ?
            <div className='loader'>{authContext.authenticated && !authContext.initialized ?
                <>
                    <h3>{RESX.unauth.fetching}</h3>
                    <div><PropagateLoader color={Styles.brightColor} /></div>
                    <button className='btn-link' onClick={() => { signOut() }}>{RESX.unauth.signOut}</button>
                </>
                : null}</div>
            :
            <div className='login'>
                <button disabled={defaultHost === ''} onClick={() => { authContext.signIn(false); }} className='btn btn-primary'>{RESX.unauth.signIn}</button>
                <div className='form'>
                    <div className='fields fields-stacked'>
                        <label>{RESX.unauth.field1Label}</label>
                        <input autoComplete='off' type='text' name='applicationHost' value={applicationHost} onChange={handler} placeholder='e.g. <appname>.azureiotcentral.com' />
                    </div>
                    <div className='fields fields-stacked'>
                        <label>{RESX.unauth.field2Label}</label>
                        <input autoComplete='off' type='text' name='deviceId' value={deviceId} onChange={handler} placeholder='e.g. my-device-123' />
                    </div>
                    <div className='fields fields-stacked'>
                        <button onClick={() => { authContext.setUpApplication(applicationHost, deviceId); }} className='btn btn-secondary'>{RESX.unauth.save}</button>
                    </div>
                </div>
            </div>
        }
    </div>
}

/* Render */

export default function Unauthenicated({ hide }) {

    const authContext: any = React.useContext(AuthContext);
    const [applicationHost, setApplicationHost] = React.useState<any>(authContext.applicationHost || '');
    const [deviceId, setDeviceId] = React.useState<any>(authContext.deviceId || '');

    React.useEffect(() => { authContext.initializeApplication(); }, [authContext, authContext.authenticated]);

    const signOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        authContext.signOut();
    }

    const fieldHandler = (e) => {
        if (e.target.name === 'applicationHost') { setApplicationHost(e.target.value); }
        if (e.target.name === 'deviceId') { setDeviceId(e.target.value); }
    }

    return <Page authContext={authContext}
        hideSignIn={hide}
        defaultHost={authContext.applicationHost}
        applicationHost={applicationHost}
        deviceId={deviceId}
        handler={fieldHandler}
        signOut={signOut} />
}