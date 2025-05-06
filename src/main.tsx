import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://d9c25024fd34e88c0dc4a3cf31db1a0c@o4509270271393792.ingest.de.sentry.io/4509270300491857",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

createRoot(document.getElementById("root")!).render(<App />);
