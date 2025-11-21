import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/styles/calendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'reactflow/dist/style.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);