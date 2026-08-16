import React from 'react';

const LoadingState = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-white rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Loading conversations...</p>
      </div>
    </div>
  );
};

export default LoadingState;