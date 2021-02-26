import { AzDpsClient } from '../lib/AzDpsClient';
import { AzIoTHubClient } from '../lib/AzIoTHubClient';
import { Locations } from '../shared/locations';

import * as React from 'react';

export const DeviceContext = React.createContext({});

export function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// this creates a real device client in the browser
async function browserDevice(deviceId, scopeId, sasKey, desiredCB, methodCB, disconnectCB) {
    const dpsClient = new AzDpsClient(scopeId, deviceId, sasKey);
    const result = await dpsClient.registerDevice();
    if (result.status === 'assigned') {
        const host = result.registrationState.assignedHub;

        const client = new AzIoTHubClient(host, deviceId, sasKey);
        client.setDirectMehodCallback((method, payload, rid) => {
            methodCB(method, payload, rid);
        })
        client.setDesiredPropertyCallback(desired => {
            desiredCB(JSON.parse(desired || ''));
        })
        client.disconnectCallback = (err) => {
            disconnectCB(err);
        }

        await client.connect();
        return client;
    }
    return null;
}

export class DeviceProvider extends React.PureComponent {

    constructor(props: any) {
        super(props);
        this.state.area = getRndInteger(0, 4);
        this.state.location = Locations[this.state.area];
        console.log('Device is in area: ' + this.state.area);
    }

    connect = (deviceId: string, scopeId: string, sasKey: string) => {
        browserDevice(deviceId, scopeId, sasKey, this.setDesired, this.setMethod, this.disconnect)
            .then((res: any) => {
                console.log('Connected as Device Id: ' + deviceId);

                setTimeout(() => {
                    // this timeout will fetch the twin
                    if (!res) {
                        console.log('Failed to fetch twin for initialization data');
                        return;
                    }

                    res.getTwin().then((res2) => {
                        this.setState({ desired: res2.desired });
                    });
                }, 2000);

                this.setState({
                    client: res, connected: true, device: {
                        deviceId, scopeId, sasKey
                    }
                })
            });
    }

    disconnect = (err) => {
        setTimeout(() => {
            // start a five second delay in re-starting the device
            this.connect(this.state.device.deviceId, this.state.device.scopeId, this.state.device.sasKey);
        }, 5000);
        this.setState({ connected: false })
    }

    setDesired = (payload: any) => {
        console.log('Received desired: ' + JSON.stringify(payload));
        delete payload.$version
        this.state.client.updateTwin(JSON.stringify(payload)); // just echo back the same payload        
        this.setState({ desired: payload })
    }

    setMethod = (method: string, payload: any, rid: string) => {
        console.log(`Received method: ${method} - ${JSON.stringify(payload)}`);
        this.setState({ method: { name: method, payload, rid } })
    }

    completeMethod = (method: string, payload: any, rid: string, status: number) => {
        this.state.client.commandResponse(method, JSON.stringify(payload), rid, status);
    }

    sendTelemetry = (payload: any) => {
        if (!this.state.client) { console.log('Send telemetry not ready'); return; }
        this.state.client.sendTelemetry(JSON.stringify(payload));
    }

    sendTwinReported = (payload: any) => {
        if (!this.state.client) { console.log('Send twin not ready'); return; }
        this.state.client.updateTwin(JSON.stringify(payload));
    }

    state: any = {
        client: null,
        connected: false,
        desired: {},
        method: {},
        device: {},
        area: 0,
        location: {},
        connect: this.connect,
        sendTelemetry: this.sendTelemetry,
        sendTwinReported: this.sendTwinReported,
        completeMethod: this.completeMethod
    }

    render() {
        return (
            <DeviceContext.Provider value={this.state}>
                {this.props.children}
            </DeviceContext.Provider>
        )
    }
}