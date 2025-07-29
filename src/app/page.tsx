'use client';

import { useState, useEffect } from 'react';
import { Post, Category } from '@prisma/client';

type PostWithRelations = Post & {
  category: Category;
  sources: { id: string; name: string }[];
  isExpanded?: boolean;
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
  const [shuffledPosts, setShuffledPosts] = useState<PostWithRelations[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setShuffledPosts([...posts].sort(() => Math.random() - 0.5));
  }, [posts]);

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

  const toggleExpand = (postId: string) => {
    setShuffledPosts(prevPosts => 
      prevPosts.map(post => ({
        ...post,
        isExpanded: post.id === postId ? !post.isExpanded : post.isExpanded
      }))
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-400">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">AI News Curator</h1>
          <p className="text-gray-200 mt-1">Your daily digest of AI-powered news</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 ">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              </svg>
              {success}
            </div>
          </div>
        )}

        {shuffledPosts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">No articles yet!</h2>
            <p className="text-gray-500">
              Click on a category button below to fetch and curate the latest news.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {shuffledPosts.map((post) => (
              <article
                key={post.id}
                className="border bg-white text-black rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        {formatDate(post.createdAt.toString())}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm font-medium text-blue-600">
                        {post.category.name}
                      </span>
                    </div>
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {post.sources.map(source => (
                        <span
                          key={source.id}
                          className="text-xs bg-black text-white px-2 py-1 rounded"
                        >
                          {source.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">
                    {post.title}
                  </h3>
                  
                  <div className="relative">
                    <p className={`text-gray-700 mb-1 ${!post.isExpanded ? 'line-clamp-2' : ''}`}>
                      {post.summary}
                    </p>
                    <button 
                      onClick={() => toggleExpand(post.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
                    >
                      {post.isExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  </div>
                  
                  {post.urls && post.urls.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {post.urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          Source {index + 1}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Curate New Content</h2>
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCurate(category.id, category.name)}
                disabled={isLoading[category.id]}
                className={`px-5 py-2.5 rounded-md font-medium transition-all ${
                  isLoading[category.id]
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                }`}
              >
                {isLoading[category.id] ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      </main>
    </div>
  );
}