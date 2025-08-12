// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/healthz');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error(err);
        setStatus({ error: 'Unable to reach API' });
      }
    }
    fetchStatus();
  }, []);

  return (
    <>
      <Head>
        <title>Ticketing API</title>
        <meta name="description" content="Ticketing System API" />
      </Head>
      <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
        <h1>Welcome to the Ticketing API</h1>
        <p>
          This is the backend for the ticketing system. You can view{' '}
          <Link href="/api/docs">API documentation here</Link>.
        </p>
        <section style={{ marginTop: '2rem' }}>
          <h2>API Status</h2>
          {status ? (
            <pre
              style={{
                background: '#f4f4f4',
                padding: '1rem',
                borderRadius: '4px',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(status, null, 2)}
            </pre>
          ) : (
            <p>Loading...</p>
          )}
        </section>
      </main>
    </>
  );
}
