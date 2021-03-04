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

const locations = [
    { name: 'US West', value: 0 },
    { name: 'US East', value: 1 },
    { name: 'Zurich Europe', value: 2 },
    { name: 'Atlantic Ocean', value: 3 },
    { name: 'WA - Bainbridge', value: 4 },
    { name: 'WA - Tacamoa', value: 5 },
    { name: 'WA - Seattle', value: 6 },
    { name: 'WA - Everett', value: 7 },
    { name: 'WA - Northbend', value: 8 }
]

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

export const Combo: React.FunctionComponent<any> = ({ name, value, items, className, onChange }) => {
    return <select className={className} name={name} onChange={onChange} value={value}>
        {items.map(function (item: any, index: number) {
            return <option key={index + 1} value={item.value}>{item.name}</option>
        })}
    </select>
}

function Page({ authContext, deviceContext, data, causeError }) {
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
                    <div><FontAwesomeIcon icon={Icons.faWifi} color={data.connection ? Styles.brightColor : Styles.brightColorDim} /></div>
                    <span>{data.connection ? RESX.auth.icons.connected : RESX.auth.icons.connecting}</span>
                </div>
            </div>
        </div>

        <div className='tracking'>
            <div className={'tracking-indicator' + (data.inError ? " tracking-indicator-err" : "")}></div>
            <div className='tracking-content'>
                <div>{locations[deviceContext.area].name}</div>
                <div>{data.journey.location}</div>
                <div>{data.inError ? RESX.auth.tracking.track_error : RESX.auth.tracking.track_ok}</div>
                <div>{data.journey.miles}</div>
            </div>
        </div>

        <div className='message main-message'>
            <div>{RESX.auth.mainMessage}</div>
            <div>{data.journey.destination}</div>
        </div>

        <div className='message info-message'>
            <div>{RESX.auth.infoMessage}</div>
            <div>
                {data.messages && data.messages.map((item, index) => {
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

        <div className='hidden-stuff'>
            <>
                <label>{RESX.auth.hidden.btnFaulty_label}</label>
                <button title={RESX.auth.hidden.btnFaulty_title} className='btn-hidden' onClick={() => { causeError() }}>{RESX.auth.hidden.btnFaulty}</button>
                <br />
                <label>{RESX.auth.hidden.area_label}</label>
                <Combo name="area" value={deviceContext.area} items={locations} className='sel-hidden' onChange={(e) => deviceContext.changeArea(e.target.value)} />
            </>
        </div>
    </div>
}

interface State {
    data: any,
}

interface Action {
    type: any;
    payload: any;
}

// Only show 2 messages at a time because of UX space
const reduceMessages = (clear: boolean, oldMessages: Array<any>, newMessages: Array<any>) => {
    if (clear) { oldMessages = [] }
    newMessages = oldMessages.concat(newMessages);
    if (newMessages.length > 2) {
        newMessages.splice(0, newMessages.length - 2);
    }
    return newMessages;
}

// The reducer the mutates the state for the page
const reducer = (state: State, action: Action) => {

    const newData = Object.assign({}, state.data);

    switch (action.type) {
        case "connection":
            if (action.payload.authContext.authenticated && action.payload.authContext.initialized) {
                action.payload.deviceContext.connect(action.payload.authContext.deviceId,
                    action.payload.authContext.deviceCredentials.idScope,
                    action.payload.authContext.deviceCredentials.symmetricKey.primaryKey);
                newData.connection = true
            }
            return { ...state, data: newData }
        case "telemetry":
            if (newData.inError) { return state; }
            newData.telemetry = action.payload.telemetry;
            newData.journey.location = action.payload.telemetry.location;
            newData.journey.miles = action.payload.telemetry.miles + ' ' + RESX.auth.tracking.miles;
            if (action.payload.delivery) {
                const randomPoint = randomLocation.randomCirclePoint({ longitude: action.payload.context.geo.longitude, latitude: action.payload.context.geo.latitude }, action.payload.context.geo.radius);
                const address = reverse.lookup(randomPoint.latitude, randomPoint.longitude, 'us');
                newData.journey.destination = `Contoso Foo Factory, ${address.city ? address.city + ', ' : ''}${address.zipcode}, ${address.state_abbr}`;
            }
            action.payload.context.sendTelemetry({
                fuel: action.payload.telemetry.fuel,
                battery: action.payload.telemetry.battery,
                miles: action.payload.telemetry.miles,
                temperature: action.payload.telemetry.temperature,
                location: action.payload.telemetry.geo
            });
            return { ...state, data: newData }
        case "start-reboot":
            newData.messages = reduceMessages(true, newData.messages, [{ type: 'warning', msg: 'Starting reboot' }]);
            return { ...state, data: newData }
        case "end-reboot":
            if (newData.inError) {
                const randomPoint = randomLocation.randomCirclePoint({ longitude: action.payload.context.geo.longitude, latitude: action.payload.context.geo.latitude }, action.payload.context.geo.radius);
                const address = reverse.lookup(randomPoint.latitude, randomPoint.longitude, 'us');
                newData.journey.destination = `Contoso Foo Factory, ${address.city ? address.city + ', ' : ''}${address.zipcode}, ${address.state_abbr}`;
                newData.inError = false;
            }
            newData.messages = reduceMessages(true, newData.messages, [{ type: 'info', msg: 'Reboot completed' }]);
            const method = Object.assign({}, action.payload.context.method);
            action.payload.context.completeMethod(method.name, {}, method.rid, 200);
            return { ...state, data: newData }
        case "messages":
            newData.messages = reduceMessages(action.payload.clear, newData.messages, action.payload.messages);
            return { ...state, data: newData }
        case "error":
            newData.inError = true;
            newData.messages = reduceMessages(true, newData.messages, [{ type: 'error', msg: 'Device has a problem' }]);
            newData.journey = { miles: RESX.auth.tracking.miles_unknown, location: "????", destination: "???????????", faulty: true, };
            return { ...state, data: newData }
        default:
            return state;
    }
}

/* Render */

export default function Authenticated() {

    const authContext: any = React.useContext(AuthContext);
    const deviceContext: any = React.useContext(DeviceContext);

    const [time, setTimer] = React.useState(0);

    const [state, dispatch] = React.useReducer(reducer, {
        data: {
            connection: false,
            inError: false,
            journey: {
                miles: RESX.auth.tracking.miles_unknown,
                location: RESX.auth.tracking.location,
                destination: RESX.auth.destination
            },
            telemetry: {
                battery: getRndInteger(90, 100),
                fuel: getRndInteger(50, 100),
                miles: getRndInteger(25, 75),
                temperature: getRndInteger(70, 75),
                geo: deviceContext.geo,
            },
            messages: [{ type: 'info', msg: 'Device is ready' }]
        }
    })

    // Setup up a timer that fires every 45 seconds. This is the device's run loop
    React.useEffect(() => {
        dispatch({ type: 'connection', payload: { authContext, deviceContext } });
        const timer = window.setInterval(() => {
            setTimer(time => time + 1);
        }, 45000);
        return () => {
            window.clearInterval(timer);
        };
        // eslint-disable-next-line
    }, []);

    // Hidden UI to make the device look like its in a bad state
    const generateError = () => {
        dispatch({ type: 'error', payload: null });
    }

    // Generate the telemetry payload that is sent down the wire
    const generateTelemetry = () => {
        const fuel = Math.floor(state.data.telemetry.fuel < 0 ? 0 : (state.data.telemetry.fuel - state.data.telemetry.fuel * 0.01));
        const battery = Math.floor(state.data.telemetry.battery < 0 ? 0 : (state.data.telemetry.battery - state.data.telemetry.battery * 0.01));
        const miles = Math.floor(state.data.telemetry.miles < 0 ? 0 : (state.data.telemetry.miles - state.data.telemetry.miles * 0.01));
        const temperature = Math.floor(state.data.telemetry.temperature + (state.data.telemetry.temperature * (getRndInteger(1, 3) / 100)));
        const randomPoint = randomLocation.randomCirclePoint({ longitude: deviceContext.geo.longitude, latitude: deviceContext.geo.latitude }, deviceContext.geo.radius);
        const address = reverse.lookup(randomPoint.latitude, randomPoint.longitude, 'us');
        const location = `${address.city ? address.city + ', ' : ''}${address.zipcode}`

        return {
            fuel,
            battery,
            miles,
            temperature,
            location,
            geo: {
                lat: randomPoint.latitude,
                lon: randomPoint.longitude,
                alt: 100
            }
        }
    }

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
        dispatch({ type: 'messages', payload: { clear: clear, messages: msgs } })
        // eslint-disable-next-line
    }, [deviceContext.desired])

    // react to a method being sent
    React.useEffect(() => {
        if (deviceContext.method.name && (deviceContext.method.name === 'reboot' || deviceContext.method.name === 'firmware')) {
            dispatch({ type: 'start-reboot', payload: null })
            setTimeout(() => {
                dispatch({ type: 'end-reboot', payload: { context: deviceContext } })
            }, 5000)
        }
        // eslint-disable-next-line
    }, [deviceContext.method])

    // This will only happen when the device initially connects
    React.useEffect(() => {
        if (!deviceContext.connected) { return; }
        const json = {
            'message': 'Started',
            'lastConnected': new Date(Date.now()).toISOString(),
            'model': RESX.auth.model,
            'serial': RESX.auth.serial + getRndInteger(1000, 9000)
        }
        deviceContext.sendTwinReported(json);

        if (!deviceContext.connected) { return; }
        const telemetry = generateTelemetry();
        dispatch({ type: 'telemetry', payload: { telemetry, context: deviceContext, delivery: true } });

        // eslint-disable-next-line
    }, [deviceContext.connected]);


    // The reaction to the timer tick
    React.useEffect(() => {
        if (!deviceContext.connected) { return; }
        const telemetry = generateTelemetry();
        dispatch({ type: 'telemetry', payload: { telemetry, context: deviceContext, delivery: false } });
        // eslint-disable-next-line
    }, [time]);

    return <Page authContext={authContext} deviceContext={deviceContext} data={state.data} causeError={generateError} />
}