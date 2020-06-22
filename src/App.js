import React, { useEffect, useState } from 'react';
import JSONInput from 'react-json-editor-ajrm';
import './App.css';

const App = () => {
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            const response = await fetch('/get-settings');
            const result = await response.json();

            setSettings(result);
        };

        fetchSettings();
    }, []);

    const onChangeJSON = async (result) => {
        console.log(result);

        if (result.errors) {
            return;
        }

        setSettings(result.jsObject);
    };

    const onSaveJSON = async () => {
        await fetch('/update-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
    };

    return (
        <React.Fragment>
            <button onClick={onSaveJSON}>Save Settings</button>
            <JSONInput placeholder={settings} theme="dark_vscode_tribute" height="100vh" width="100vw" onChange={onChangeJSON} />
        </React.Fragment>
    );
};

export default App;
