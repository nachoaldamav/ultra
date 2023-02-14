import type { MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import styles from './styles/app.css';

export function links() {
  return [
    { rel: 'stylesheet', href: styles },
    {
      rel: 'font',
      href: '/fonts/azonix/Azonix.otf',
      type: 'font/otf',
    },
  ];
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Ultra',
  viewport: 'width=device-width,initial-scale=1',
  image: 'https://ultrapkg.dev/images/og_image.png',
  'twitter:image': 'https://ultrapkg.dev/images/og_image.png',
  'twitter:card': 'summary_large_image',
  'twitter:creator': '@srdrabx',
  'twitter:site': '@srdrabx',
  'twitter:title': 'Ultrapkg',
  'twitter:description':
    'A fast and lightweight package manager for JavaScript.',
});

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
