import { useEffect, useRef, useState } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import Storage, { storage } from './Storage';
import { API_URL, BASE_URL } from './urls';
import { useLogout } from './useLogout';

export const useAxios = (defaultAxiosConfig?: AxiosRequestConfig) => {
  const [data, setData] = useState<any>(null);
  const tomoutRef = useRef<number>(0);
  const [error, setError] = useState<AxiosError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const handleLogout = useLogout();

  // Set up axios interceptor for adding authorization token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async request => {
        // let userDataStored = await AsyncStorage.getItem('userData');
        const userData = Storage.getItem('user_data');
        if (userData) {
          let userDataParsed = JSON.parse(userData);
          if (userDataParsed?.token) {
            request.headers = request.headers || {};
            request.headers[
              'Authorization'
            ] = `Bearer ${userDataParsed?.token}`;
          }
        }
        return request;
      },
      error => Promise.reject(error),
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        // console.warn(error.response && error.response.status === 401);
        if (error?.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      },
    );

    // Clean up interceptor on component unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchData = async (config?: AxiosRequestConfig) => {
    setLoading(true);
    setData(null); // Reset data before new request
    setError(null); // Reset error before new request

    try {
      // Merge default and provided configs, ensuring no undefined values
      const mergedConfig = {
        ...defaultAxiosConfig,
        ...config,
        headers: {
          ...defaultAxiosConfig?.headers,
          ...config?.headers,
        },
      };

      const response = await axios({
        ...mergedConfig,
        url: API_URL + config?.url,
      });
      setData(response.data);
      return response.data;
    } catch (err: any) {
      const axiosError = err as AxiosError;
      setError(axiosError);
      throw axiosError;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchData,
    data,
    loading,
    error,
  };
};
