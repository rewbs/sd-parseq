import './wdyr';

import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
//@ts-ignore
// import * as Sentry from "@sentry/react";
// import { BrowserTracing } from "@sentry/tracing";
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import reportWebVitals from './reportWebVitals';


// Sentry.init({
//   dsn: "https://4706cbba5987462184a3e541c4b8a9d4@o175750.ingest.sentry.io/4504274009325568",
//   integrations: [new BrowserTracing()],
//   environment: process.env.NODE_ENV,
//   tracesSampleRate: 1.0,
// });

TimeAgo.addDefaultLocale(en)

//@ts-ignore
ReactDOM.createRoot(document.getElementById("root"))
  .render(<App />);

reportWebVitals(console.log);

