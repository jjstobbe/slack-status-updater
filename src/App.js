import React, { useEffect, useState } from 'react';
import JSONInput from 'react-json-editor-ajrm';
import './App.css';

const App = () => {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await fetch('/get-settings')
      const result = await response.json();

      setSettings(result);
    };

    fetchSettings();
  }, [])

  const onChangeJSON = async (result) => {
    console.log(result);
      
    if (result.errors) {
      return;
    }

    await fetch('/update-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: result.json,
    })
  }

  return (
    <JSONInput
      placeholder={settings}
      theme="dark_vscode_tribute"
      height="100vh"
      width="100vw"
      onChange={onChangeJSON}
    />
  );
}

export default App;