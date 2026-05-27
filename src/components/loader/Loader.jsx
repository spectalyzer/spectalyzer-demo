import React, { useState, useEffect, createContext, useContext } from "react";
import logo from "../../assets/images/favicon.jpg";

// Create a context to manage loader state globally
const LoaderContext = createContext();

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
  // We use a counter so that multiple async calls can safely show/hide the loader.
  const [loadingCount, setLoadingCount] = useState(0);
  const isLoading = loadingCount > 0;

  // Functions to control the loader
  const showLoader = () => setLoadingCount((count) => count + 1);
  const hideLoader = () =>
    setLoadingCount((count) => (count > 0 ? count - 1 : 0));

  return (
    <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
      {isLoading && <Loader />}
    </LoaderContext.Provider>
  );
};

const Loader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Mimic progress increase until complete
    let interval = setInterval(() => {
      setProgress((prev) => (prev + 10 <= 100 ? prev + 10 : 100));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
      <div className="text-center">
        <img
          src={logo}
          alt="Loading Logo"
          className="mx-auto mb-4 w-48 h-auto"
        />
        <div className="relative w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 h-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
