import React, { Component } from 'react';
import './Phone.css';

class Phone extends Component {
    handleSpeakerChange = (e) => {
        const selectedSpeaker = e.target.value;

        if (this.props.dialog) {
            this.props.setSpeaker(selectedSpeaker); // This is the only place where setSpeaker is called
        }
    };

    render() {
        const { devices, selectedSpeaker, dialog } = this.props;

        return (
            <div>
                {/* Other phone components */}
                <div>
                    {/* Additional phone components can go here */}
                </div>
                {/* End of other phone components */}

                <div>
                    <label htmlFor="speakerSelect">Select Speaker: </label>
                    <select
                        id="speakerSelect"
                        value={selectedSpeaker || ''}
                        onChange={this.handleSpeakerChange}
                    >
                        <option value="" disabled>
                            Select Speaker
                        </option>
                        {devices.map((speaker) => (
                            <option key={speaker.deviceId} value={speaker.deviceId}>
                                {speaker.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="phone-status">
                    {dialog ? `Call Status: ${dialog.state}` : 'No active call'}
                </div>
            </div>
        );
    }
}

export default Phone;

