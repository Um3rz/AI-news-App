'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CurateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);
    setMessage('Curating news... This may take a moment.');

    try {
      const response = await fetch('/api/curate');
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Curation complete!');
        // Refresh the page to show the new posts
        router.refresh();
      } else {
        throw new Error(data.message || 'An error occurred.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      // Hide the message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto my-4">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
      >
        {isLoading ? 'Curating...' : 'Curate Now'}
      </button>
      {message && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{message}</p>}
    </div>
  );
}
