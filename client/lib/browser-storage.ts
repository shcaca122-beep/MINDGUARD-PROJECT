export const subscribeToLocalStorage = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

export const getUserSessionSnapshot = () => window.localStorage.getItem('user_session');
export const getAdminSessionSnapshot = () => window.localStorage.getItem('admin_session');
export const getBKNameSnapshot = () => window.localStorage.getItem('bk_custom_name');
export const getServerStorageSnapshot = () => null;
