import { useContext } from 'react';
import { Context } from '../Redux/Store';
import { storage } from './Storage';

export function useLogout() {
  const { dispatch } = useContext(Context);

  return () => {
    dispatch({
      // ← instantly update in-memory state
      type: 'UPDATE_USER_DATA',
      userData: {
        is_logged: false,
        token: null,
        refresh_token: null,
        company_code: '',
        empName: '',
        username: '',
        password: '',
        is_admin: false,
        settings: null,
        latitude: '',
        longitude: '',
        initialRoute: 'NewScan',
      },
    });
    storage.clearAll();
  };
}
