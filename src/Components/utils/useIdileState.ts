import { useContext, useEffect } from 'react';
import { useAxios } from './useAxios';
import { checkForUpdate } from './validate_version';
import { Platform } from 'react-native';
import { Context } from '../Redux/Store';

export function useIdileState() {
  const { fetchData } = useAxios();
  const { state, dispatch } = useContext(Context);
  const getversion = async () => {
    try {
      const res = await fetchData({
        url: 'app-version',
      });
      if (res?.message === 'success') {
        if (res?.version?.[Platform.OS]?.force) {
          checkForUpdate(res?.version?.[Platform.OS]?.version);
        }
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    }
  };

  const refreshSession = async () => {
    try {
      const res = await fetchData({
        url: 'auth/refresh-token',
      });
      if (res?.message === 'success') {
        dispatch({
          type: 'UPDATE_USER_DATA',
          userData: {
            ...state.userData,
            token: res?.token,
          },
        });
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    }
  };

  useEffect(() => {
    getversion();
    let intervel: number;
    console.log(
      state.userData.is_logged,
      'state.userData.is_loggedstate.userData.is_loggedstate.userData.is_logged',
    );
    if (state.userData.is_logged) {
      intervel = setInterval(refreshSession, 60000);
    }
    return () => {
      clearInterval(intervel);
    };
  }, [state.userData.is_logged]);

  return null;
}
