import { useState } from 'react';
import axios from 'axios';

const TestPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/user');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching data');
      setData(null);
    }
  };

  return (
    <div>
      <h1>Test Page</h1>
      <button onClick={fetchData}>Fetch Data</button>
      {error && <p>{error}</p>}
      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
};

export default TestPage;
