'use client';

import { useState, useEffect } from 'react';
import { Post, Category } from '@prisma/client';

type PostWithRelations = Post & {
  category: Category;
  sources: { id: string; name: string }[];
};

type CategoryType = {
  id: string;
  name: string;
};

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch('/api/posts').then(res => res.json()),
        fetch('/api/categories').then(res => res.json())
      ]);
      
      if (postsRes.error) throw new Error(postsRes.error);
      if (categoriesRes.error) throw new Error(categoriesRes.error);
      
      setPosts(postsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const handleCurate = async (categoryId: string, categoryName: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [categoryId]: true }));
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/curate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to curate content');
      }

      setSuccess(`Successfully curated new content for ${categoryName}!`);
      
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedPosts = posts.reduce((acc, post) => {
    const categoryName = post.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(post);
    return acc;
  }, {} as Record<string, PostWithRelations[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-blue-600 dark:text-blue-400">
            AI News Curator
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
            Your daily digest of AI-powered news
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Curate New Content</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCurate(category.id, category.name)}
                disabled={isLoading[category.id]}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  isLoading[category.id]
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading[category.id] ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Curating...
                  </span>
                ) : (
                  `Curate ${category.name}`
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h2 className="text-2xl font-semibold mb-2">No articles yet!</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Click on a category button above to fetch and curate the latest news.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPosts).map(([categoryName, categoryPosts]) => (
              <div key={categoryName} className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">
                  {categoryName}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categoryPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                            {post.category.name}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {post.sources.map(source => (
                              <span
                                key={source.id}
                                className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                              >
                                {source.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3 leading-tight line-clamp-2">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                          {post.summary}
                        </p>
                        
                        {post.urls && post.urls.length > 0 && (
                          <div className="space-y-2">
                            {post.urls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm"
                              >
                                Read source {index + 1} →
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}