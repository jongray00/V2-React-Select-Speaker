import React, { Component } from 'react';
import { Relay } from '@signalwire/js';
import AuthForm from './components/auth/AuthForm';
import Phone from './components/phone/Phone.js';
import './App.css';

class App extends Component {
  state = {
    connected: false,
    call: null,
    devices: [],
    availableSpeakers: [],
    selectedSpeaker: null,
    loginSuccess: false, // Track login success
  };

  constructor(props) {
    super(props);

    this.connect = this.connect.bind(this);
    this.newCall = this.newCall.bind(this);
    this.handleSpeakerSelection = this.handleSpeakerSelection.bind(this);
    this.handleLoginSuccess = this.handleLoginSuccess.bind(this);

    // Load saved login params if available
    const savedParams = this.getSavedLoginParams();
    if (savedParams.project && savedParams.token) {
      this.connect(savedParams);
    }
  }

  // Helper function to get saved login parameters from local storage
  getSavedLoginParams() {
    const savedParamsString = localStorage.getItem('loginParams');
    if (savedParamsString) {
      return JSON.parse(savedParamsString);
    }
    return { project: '', token: '' };
  }

  // Helper function to save login parameters to local storage
  saveLoginParams(params) {
    localStorage.setItem('loginParams', JSON.stringify(params));
  }

  async componentDidMount() {
    // Populate available audio output devices
    try {
      const devices = await this.getAvailableAudioOutDevices();
      this.setState({ devices });
    } catch (error) {
      console.error('Error getting audio output devices:', error);
    }
  }

  async getAvailableAudioOutDevices() {
    if (this.session) {
      const devices = await this.session.getAudioOutDevices();
      return devices;
    }
    return [];
  }

  async connect(params) {
    this.saveLoginParams(params);
    console.log('Trying to connect...');
    this.session = new Relay(params);
    this.session.on('signalwire.ready', async () => {
      this.setState({ connected: true, loginSuccess: true });
      console.log('SignalWire ready');
      try {
        const audioOutDevices = await this.session.getAudioOutDevices();

        if (audioOutDevices.length > 0) {
          const availableSpeakers = audioOutDevices.map((device) => ({
            label: device.label,
            deviceId: device.deviceId,
          }));
          this.setState({ availableSpeakers });

          // Set the selected speaker based on client.speaker
          const clientSpeaker = this.session.speaker;
          console.log('Selected Speaker (before):', clientSpeaker);

          if (!clientSpeaker && audioOutDevices.length > 0) {
            // Set the speaker to the first available speaker if not already set
            console.log('Current Speaker:', clientSpeaker);
            //this.session.speaker = audioOutDevices[0].deviceId;
            //this.setState({ selectedSpeaker: audioOutDevices[0].deviceId });
            console.log('Selected Speaker (after):', audioOutDevices[0].deviceId);
          }
        } else {
          console.log('No audio output devices found.');
        }
      } catch (error) {
        console.error('Error getting audio output devices:', error);
      }
    });

    this.session.on('signalwire.error', (error) => {
      alert(error.message);
      console.log(error)
    });

    this.session.on('signalwire.socket.error', (error) => {
      this.setState({ connected: false });
      this.session.disconnect();
    });

    this.session.on('signalwire.socket.close', (error) => {
      this.setState({ connected: false });
      this.session.disconnect();
    });

    this.session.on('signalwire.notification', (notification) => {
      console.log("NOTIFICATION: " + notification)
      switch (notification.type) {
        case 'callUpdate':
          const { call } = notification;
          if (call.state === 'destroy') {
            this.setState({ call: null });
          } else {
            this.setState({ call });
          }
          break;
        case 'participantData':
          console.log(notification);
          // Caller's data like name and number to update the UI.
          break;
        case 'userMediaError':
          console.log(notification);
          // Permission denied or invalid audio/video params on `getUserMedia`
          break;
        default:
      }
    });

    this.session.connect();
  }

  async newCall(extension) {
    if (this.session) {
      await this.session.newCall({
        destinationNumber: extension,
        audio: true,
        video: false,
      });
    }
  }

  setSpeaker = async (selectedSpeaker) => {
    if (this.state.call && selectedSpeaker) {
      const success = await this.state.call.setAudioOutDevice(selectedSpeaker);
      if (success) {
        console.log(`Audio output device set to: ${selectedSpeaker}`);
        this.setState({ selectedSpeaker }); // Update selectedSpeaker in the component's state
      } else {
        console.log('Not supported ' + selectedSpeaker);
      }
    }
  };

  // Method to handle speaker selection
  handleSpeakerSelection(deviceId) {
    if (this.session) {
      this.session.speaker = deviceId;
      console.log(`Speaker changed to: ${deviceId}`);
    }
  }

  // Helper function to handle login success
  handleLoginSuccess() {
    this.setState({ loginSuccess: true });
  }

  render() {
    const { call, devices, loginSuccess, connected } = this.state;

    console.log('Connected:', connected);
    console.log('Login Success:', loginSuccess);

    return (
        <div className="App flex">
          <header>SignalWire Call Demo</header>
          <main className="flex flex-center">
            {connected && loginSuccess ? (
                call ? (
                    <Phone
                        session={this.session}
                        dialog={call}
                        devices={devices}
                        setSpeaker={this.setSpeaker}
                        handleSpeakerSelection={this.handleSpeakerSelection}
                    />
                ) : (
                    <div>
                      <label htmlFor="phoneNumber">Enter Phone Number: </label>
                      <input
                          type="text"
                          id="phoneNumber"
                          onChange={(e) => this.setState({ phoneNumber: e.target.value })}
                      />
                      <button onClick={() => this.newCall(this.state.phoneNumber)}>
                        Call
                      </button>
                    </div>
                )
            ) : (
                <AuthForm connect={this.connect} onLoginSuccess={this.handleLoginSuccess} />
            )}
          </main>
          <footer>SignalWire - 2019</footer>
        </div>
    );
  }
}

export default App;
