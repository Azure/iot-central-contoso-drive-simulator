import './authenticated.css';
import { RESX } from '../../strings';
import { Styles } from '../../shared/styles';
import { AuthContext } from '../../context/authContext';
import { DeviceContext, getRndInteger } from '../../context/deviceContext';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from '@fortawesome/free-solid-svg-icons'

import randomLocation from 'random-location';
import * as reverse from 'reverse-geocode';

import React from 'react';

/* UX */

function convertIcon(type: string) {
    if (type === 'info') {
        return <FontAwesomeIcon icon={Icons.faInfoCircle} color={Styles.infoColor} />;
    } else if (type === 'warning') {
        return <FontAwesomeIcon icon={Icons.faExclamationTriangle} color={Styles.warningColor} />;
    } else if (type === 'error') {
        return <FontAwesomeIcon icon={Icons.faExclamationCircle} color={Styles.errorColor} />;
    }
    return null;
}

function Page({ authContext, deviceContext, journey, info, connected }) {
    return <div className='authpage'>
        <div className='nav-bar'>
            <div className='nav-mini-bar'>
                <div><button className='btn-nav' onClick={() => { authContext.signOut() }}><FontAwesomeIcon icon={Icons.faBars} color={Styles.brightColor} /></button></div>
                <div><h3>{RESX.app.title}</h3></div>
            </div>
            <div className='nav-mini-bar'>
                <div className='nav-mini-bar-icons'>
                    <div><FontAwesomeIcon icon={Icons.faBatteryFull} color={Styles.brightColor} /></div>
                    <span>{RESX.auth.icons.battery}</span>
                </div>
                <div className='nav-mini-bar-icons'>
                    <div><FontAwesomeIcon icon={Icons.faTruck} color={Styles.brightColor} /></div>
                    <span>{RESX.auth.icons.location}</span>
                </div>
                <div className='nav-mini-bar-icons'>
                    <div><FontAwesomeIcon icon={Icons.faWifi} color={connected ? Styles.brightColor : Styles.brightColorDim} /></div>
                    <span>{connected ? RESX.auth.icons.connected : RESX.auth.icons.connecting}</span>
                </div>
            </div>
        </div>
        <div className='tracking'>
            <div className='tracking-indicator'></div>
            <div className='tracking-content'>
                <div>{RESX.auth.area} {deviceContext.area}</div>
                <div>{journey.location}</div>
                <div>{RESX.auth.tracking.onTrack}</div>

                <div><span>{journey.miles}</span> <span>{RESX.auth.tracking.miles}</span></div>
            </div>
        </div>
        <div className='message main-message'>
            <div>{RESX.auth.mainMessage}</div>
            <div>{journey.address}</div>
        </div>
        <div className='message info-message'>
            <div>{RESX.auth.infoMessage}</div>
            <div>
                {info && info.map((item, index) => {
                    return <div key={index}>
                        <div>{convertIcon(item.type)}</div>
                        <div>{item.msg}</div>
                    </div>
                })}
            </div>
        </div>
        <div className='menu-bar'>
            <button className='btn-primary btn-menu' disabled={true}>
                <div><FontAwesomeIcon icon={Icons.faQuestionCircle} size={'2x'} color={Styles.brightColor} /></div>
                {RESX.auth.btnRequest}
            </button>
            <button className='btn-primary btn-menu' disabled={true}>
                <div><FontAwesomeIcon icon={Icons.faClock} size={'2x'} color={Styles.brightColor} /></div>
                {RESX.auth.btnHos}
            </button>
            <button className='btn-primary btn-menu' disabled={true}>
                <div><FontAwesomeIcon icon={Icons.faPen} size={'2x'} color={Styles.brightColor} /></div>
                {RESX.auth.btnInspection}
            </button>
        </div>

        <div className='info-bar'>
            <div>
                <span>{RESX.auth.info.device}</span>
                <span>{deviceContext.device.deviceId}</span>
            </div>
            <div>
                <span>{RESX.auth.info.host}</span>
                <span>{authContext.applicationHost}</span>
            </div>
        </div>
    </div>
}

/* Render */

export default function Authenticated() {

    const authContext: any = React.useContext(AuthContext);
    const deviceContext: any = React.useContext(DeviceContext);
    const [connecting, setConnecting] = React.useState(false);
    const [sending, setSending] = React.useState(false);

    const location = deviceContext.location;

    const [journey, setJourney] = React.useState({
        miles: 0,
        address: RESX.auth.delivery.address,
        location: RESX.auth.delivery.location
    })

    const [journeyErrorMessages, setJourneyMessages] = React.useState([
        { type: 'info', msg: 'Device is ready' }
    ]);

    const showMessages = (messages: any, clear: boolean) => {
        let msgs: Array<any> = clear ? [] : journeyErrorMessages.slice();
        msgs = msgs.concat(messages);
        if (msgs.length > 2) {
            for (let i = 1; i < msgs.length; i++) {
                msgs.pop();
            }
        }
        setJourneyMessages(msgs);
    }

    React.useEffect(() => {
        const randomPoint = randomLocation.randomCirclePoint({ longitude: location.longitude, latitude: location.latitude }, location.radius);
        const address = reverse.lookup(randomPoint.latitude, randomPoint.longitude, 'us');
        const currentLocation = `Contoso Foo Factory, ${address.city ? address.city + ', ' : ''}${address.zipcode}, ${address.state_abbr}`;
        setJourney({
            miles: getRndInteger(45, 75),
            address: currentLocation,
            location: RESX.auth.delivery.current
        })
    }, [location])

    // Connect the device
    React.useEffect(() => {
        if (connecting) { return; }
        if (authContext.authenticated && authContext.initialized) {
            deviceContext.connect(authContext.deviceId,
                authContext.deviceCredentials.idScope,
                authContext.deviceCredentials.symmetricKey.primaryKey);
        }
        setConnecting(true);
        // eslint-disable-next-line
    }, [authContext]);

    // react to a desired being sent
    React.useEffect(() => {
        const msgs: any = [];
        let clear: boolean = false;
        if (deviceContext.desired.hasOwnProperty('message')) {
            msgs.push({ type: 'info', msg: deviceContext.desired['message'] })
        }
        if (deviceContext.desired.hasOwnProperty('debug')) {
            const debug = deviceContext.desired['debug'];
            if (debug || debug === false) {
                if (debug !== null) {
                    clear = true;
                    const msg = debug ? { type: 'warning', msg: 'Device in diagnostics mode' } : { type: 'info', msg: 'Device in regular mode' };
                    msgs.push(msg);
                }
            }
        }
        showMessages(msgs, clear);
        // eslint-disable-next-line
    }, [deviceContext.desired])

    // react to a method being sent
    React.useEffect(() => {
        if (deviceContext.method.name && (deviceContext.method.name === 'reboot' || deviceContext.method.name === 'firmware')) {
            const method = Object.assign({}, deviceContext.method);
            showMessages([{ type: 'warning', msg: 'Starting reboot' }], true);
            setTimeout(() => {
                showMessages([{ type: 'info', msg: 'Reboot completed' }], true);
                deviceContext.completeMethod(method.name, {}, method.rid, 200);
            }, 5000)
        }
        // eslint-disable-next-line
    }, [deviceContext.method])

    // main reporting loop
    React.useEffect(() => {
        if (sending) { return; }
        if (!deviceContext.connected) {
            if (sending) { reset(); }
            return;
        }

        // these are the interval state that will be mainted through the loops
        let battery = getRndInteger(90, 100);
        let fuel = getRndInteger(50, 100);
        let miles: number = journey.miles;

        let timer, timer2: any = null;
        timer = setInterval(() => {

            const randomPoint = randomLocation.randomCirclePoint({ longitude: location.longitude, latitude: location.latitude }, location.radius);
            battery = Math.floor(battery < 0 ? 0 : (battery - battery * 0.01));
            fuel = Math.floor(fuel < 0 ? 0 : (fuel - fuel * 0.01));
            miles = Math.floor(miles < 0 ? 0 : (miles - miles * 0.01));

            const json = {
                battery,
                miles,
                'location': {
                    'lat': randomPoint.latitude,
                    'lon': randomPoint.longitude,
                    'alt': 50
                }
            }

            const address = reverse.lookup(json.location.lat, json.location.lon, 'us');
            const currentLocation = `${address.city ? address.city + ', ' : ''}${address.zipcode}, ${address.state_abbr}`

            deviceContext.sendTelemetry(json);
            console.log('Sent telemetry: ' + JSON.stringify(json));
            setJourney(Object.assign({}, journey, {
                miles: json.miles,
                location: currentLocation
            }));
        }, 60000);

        timer2 = setInterval(() => {
            const json = { 'fuel': fuel };
            deviceContext.sendTelemetry(json);
            console.log('Sent reported: ' + JSON.stringify(json));
        }, 60001 * 3);

        // report only
        const json = {
            'message': 'Started',
            'lastConnected': new Date(Date.now()).toISOString()
        }

        deviceContext.sendTwinReported(json);
        console.log('Sent initial twin: ' + JSON.stringify(json));

        // keep internal state and let setIntervals send data
        setSending(true);
        function reset() {
            clearInterval(timer);
            clearInterval(timer2);
            setSending(false);
        }

        return () => {
            reset();
        };
        // eslint-disable-next-line
    }, [deviceContext.connected]);

    return <Page authContext={authContext} deviceContext={deviceContext} journey={journey} info={journeyErrorMessages} connected={sending} />
}