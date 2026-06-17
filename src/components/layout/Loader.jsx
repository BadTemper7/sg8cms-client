import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-2xl">
        <img
          src="/images/gif/sg8-loading.gif"
          alt="Loading..."
          className="w-16 h-16 object-contain"
        />
        <p className="text-gray-700 font-medium">Processing...</p>
      </div>
    </div>
  );
};

export default Loader;
