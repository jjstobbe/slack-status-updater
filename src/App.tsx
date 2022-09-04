import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import JSONInput from 'react-json-editor-ajrm';
import './App.css';

const App = () => {
    const isFetching = useRef(false);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            const response = await fetch('/.netlify/functions/get-settings');
            const result = await response.json();

            setSettings(result);
            isFetching.current = false;
        };

        if (!isFetching.current) {
            isFetching.current = true;
            fetchSettings();
        }
    }, []);

    const onChangeJSON = async (result: any) => {
        console.log(result);

        if (result.errors) {
            return;
        }

        setSettings(result.jsObject);
    };

    const onSaveJSON = async () => {
        await fetch('/.netlify/functions/update-settings', {
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
