import { useState, useEffect } from 'react';

export function SettingsView() {
  const [vaultPath, setVaultPath] = useState('');

  useEffect(() => {
    window.strata.getSettings().then(s => setVaultPath(s.vaultPath));
  }, []);

  const handlePickFolder = async () => {
    const picked = await window.strata.pickFolder();
    if (picked) {
      await window.strata.setVaultPath(picked);
      setVaultPath(picked);
    }
  };

  return (
    <div className="settings">
      <div className="settings-group">
        <h3>Vault location</h3>
        <p>
          All entries are stored as Markdown files in this folder.
          Changing the path does not move existing files.
        </p>
        <div className="settings-path">
          <code>{vaultPath}</code>
          <button className="btn btn-ghost" onClick={handlePickFolder}>
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
