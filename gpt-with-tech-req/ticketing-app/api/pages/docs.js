// pages/docs.js
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI url="/api/docs" docExpansion="list" />
    </div>
  );
}
