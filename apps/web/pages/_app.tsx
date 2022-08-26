import { AppProps } from 'next/app';
import AppLayout from '../components/appLayout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <AppLayout><Component {...pageProps} /></AppLayout>
}

export default MyApp;