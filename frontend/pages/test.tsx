export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Notetree Test Page</h1>
      <p>This is a simple test page to verify the frontend is working.</p>
      <div style={{ margin: '20px 0' }}>
        <h2>Frontend Status: ✅ Working</h2>
        <p>If you can see this page, the frontend server is running correctly.</p>
      </div>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <h3>Next Steps:</h3>
        <ul>
          <li>Backend API connection test</li>
          <li>Database connectivity test</li>
          <li>Full application functionality test</li>
        </ul>
      </div>
    </div>
  );
} 
