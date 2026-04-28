import { useState } from 'react';
import { workoutStorage } from '../utils/workoutStorage';
import './ExportImport.css';

interface ExportImportProps {
  onImportSuccess: () => void;
}

export function ExportImport({ onImportSuccess }: ExportImportProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const data = workoutStorage.exportWorkouts();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', `workout_backup_${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setShowMenu(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = workoutStorage.importWorkouts(content);
        
        if (result.success) {
          alert('✅ Workouts imported successfully!');
          onImportSuccess();
        } else {
          alert(`❌ Error: ${result.error}`);
        }
      } catch (error) {
        alert('❌ Error reading file. Make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    setImporting(false);
    setShowMenu(false);
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL workouts? This cannot be undone!')) {
      workoutStorage.clearAll();
      alert('✅ All workouts cleared!');
      onImportSuccess();
      setShowMenu(false);
    }
  };

  return (
    <div className="export-import">
      <div className="menu-container">
        <button 
          className="menu-btn"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Open menu"
        >
          ⚙️ Settings
        </button>
        
        {showMenu && (
          <div className="menu-dropdown">
            <button onClick={handleExport} className="menu-item">
              📥 Download Backup
            </button>
            
            <label className="menu-item">
              📤 Import Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                style={{ display: 'none' }}
              />
            </label>
            
            <button onClick={handleClearAll} className="menu-item danger">
              🗑️ Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
