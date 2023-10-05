import React, { useState} from 'react';
import { Relay } from '@signalwire/js';

const defaultJWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE2OTY0ODU0NTAsImlzcyI6IlNpZ25hbFdpcmUgSldUIiwianRpIjoiRGR2ejdKVDl2NERGbjB4YTlZVW4xbmpJYWpZIiwic2NvcGUiOiJ3ZWJydGMiLCJzdWIiOiI2NDlkYzA4ZS0zNTU4LTRlZmUtYTU5OC00NmE5NjYxNjRiODMiLCJyZXNvdXJjZSI6Impvbm55R0ciLCJleHAiOjE2OTcwOTAyNTB9.pZDzSpu_fZp9ff-UfdhimEoxNHBLM5wH5mUnov0HannZ-2Lx1vk0umiSRlyDefYrFJYuQ35TusPAhP-ACyyqeQ"; // Default JWT
const defaultProj = "649dc08e-3558-4efe-a598-46a966164b83";
const defaultDest= "+14803769009";

function App() {
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [devices, setDevices] = useState(null);
    const [token, setToken] = useState(defaultJWT);
    const [projectID, setProjectID] = useState(defaultProj);
    const [connected, setConnected] = useState(false);
    const [destinationNumber, setDestinationNumber] = useState(defaultDest);
    const [currentSpeakerInfo, setCurrentSpeakerInfo] = useState(null);

    const fetchCurrentSpeaker = async () => {
        if (client) {
            const activeSpeaker = client.speaker;
            setCurrentSpeakerInfo(`Active Speaker: ${activeSpeaker}`);
        }
    };

    async function getAudioOutDevicesandSet(client) {
        try {
            if (client) {
                const devices = await client.getAudioOutDevices();
                if (devices && devices.length > 0) {
                    devices.forEach(device => {
                        console.log(device.kind + ': ' + device.label + ' id: ' + device.deviceId);
                    });
                    // Set the speaker to the first audio output device
                    client.speaker = devices[0].deviceId;
                    console.log("Speaker Set: " + client.speaker);
                    const activeSpeaker = client.speaker;
                    setCurrentSpeakerInfo(`Active Speaker: ${activeSpeaker}`)
                } else {
                    console.log('No audio output devices found.');
                }
            } else {
                console.log('Client is null. Ensure it is initialized before calling getAudioOutDevices.');
            }
        } catch (error) {
            console.error('Error getting audio output devices:', error);
        }
    }

    const handleConnect = async () => {
        if (projectID && token) {
            try {
                const c = new Relay({
                    project: projectID,
                    token: token,
                });

                c.on('signalwire.ready', async () => {
                    console.log('Connected to Relay');
                    setConnected(true);
                    await getAudioOutDevicesandSet(c);
                });

                c.on('signalwire.error', (error) => {
                    console.log('Error connecting to Relay');
                    console.error(error);
                });

                c.on('signalwire.notification', (notification) => {
                    //console.log(notification);
                    if (notification.type === 'callUpdate') {
                        const updatedCall = notification.call;
                        console.log(updatedCall.id, updatedCall.direction, updatedCall.state);
                        setCall(updatedCall);
                    } else {
                        console.log(notification.type);
                    }
                });

                await c.connect();
                const d = await c.getDevices();
                setDevices(d);
                setClient(c);
            } catch (error) {
                console.error('Error connecting to Relay:', error);
            }
        }
    };

    const handlePlaceCall = async () => {
        await getAudioOutDevicesandSet(client)
        if (client && destinationNumber) {
            try {
                const newCall = await client.newCall({
                    destinationNumber: destinationNumber,
                    audio: true,
                    video: false,
                });
                console.log('New call:', newCall);

                const audioOutDevices = await client.getAudioOutDevices();
                console.log('Audio output devices:', audioOutDevices);

                if (audioOutDevices.length > 0) {
                    console.log('Audio output device set after placing call to:', client.speaker);
                } else {
                    console.error('No audio output devices found.');
                }

                const successAudioIn = await newCall.setAudioInDevice('default');
                console.log('Audio input device set to default:', successAudioIn);

                setCall(newCall);
            } catch (error) {
                console.error('Error placing the call:', error);
            }
        }
    };

    const handleAnswer = async () => {

        if (call) {
            console.log('Answering call...');
            console.log(call.id, call.direction, call.state);
            const res = await call.answer();
            console.log('Answered...');
            console.log(call.id, call.direction, call.state);
            console.log(client.connected);

            try {
                const audioOutDevices = await client.getAudioOutDevices();
                if (audioOutDevices.length > 0) {
                    console.log('Audio output device set after answering call to:', audioOutDevices[0].label);
                } else {
                    console.log('No audio output devices found.');
                }

                const successAudioIn = await call.setAudioInDevice('default');
                console.log(successAudioIn);

                console.log(res);
            } catch (error) {
                console.error('Error answering the call:', error);
            }
        }
    };

    const handleHangup = async () => {
        if (call) {
            console.log('Hanging up call...');
            console.log(call);
            const res = await call.hangup();
            console.log(res);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="text-2xl font-bold">Relay App</div>
            <div>
                Project ID:{' '}
                <input
                    type="text"
                    value={projectID}
                    onChange={(e) => setProjectID(e.target.value)}
                />
            </div>
            <div>
                Token:{' '}
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                />
            </div>
            <div className="text-sm">Client Status: {connected ? 'Connected' : 'Disconnected'}</div>
            <div className="flex gap-4">
                <button className="btn-primary" onClick={handleConnect}>Connect</button>
                <div>
                    Destination Number:{' '}
                    <input
                        type="text"
                        value={destinationNumber}
                        onChange={(e) => setDestinationNumber(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={handlePlaceCall}>Make Call</button>
                <button className="btn-primary" onClick={handleAnswer}>Answer</button>
                <button className="btn-danger" onClick={handleHangup}>Hang up</button>
            </div>

            <div>
                Call:
                {call ? <pre>{JSON.stringify(call.state, null, 2)}</pre> : 'No call'}
            </div>

            <div>
                <div className="font-bold text-xl">React State of Speaker</div>
                <pre className="p-4 bg-secondary text-sm">
          {JSON.stringify(currentSpeakerInfo, null, 2)}
        </pre>
            </div>

            <div>
                <div className="font-bold text-xl">Output= Client.Speaker</div>
                <button className="fetch-button" onClick={fetchCurrentSpeaker}>
                    Fetch Current Speaker
                </button>
                <div>
                    Current Speaker Information:
                    {currentSpeakerInfo ? <p>{currentSpeakerInfo}</p> : 'Click the button to fetch the current speaker.'}
                </div>
            </div>

            <div>
                <div className="font-bold text-xl">Devices</div>
                <pre className="p-4 bg-secondary text-sm">
          {JSON.stringify(devices, null, 2)}
        </pre>
            </div>
        </div>
    );
}

export default App;

