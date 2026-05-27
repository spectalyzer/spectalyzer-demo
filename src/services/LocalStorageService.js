// LocalStorageService.js
export const storeToken = (token, key = 'token') => {
  try {
    localStorage.setItem(key, token); // Store token under provided key (default: 'token')
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

export const getToken = (key = 'token') => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = (key = 'token') => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};
