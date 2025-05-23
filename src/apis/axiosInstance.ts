import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/endpoints';
import Cookies from 'js-cookie';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
// import toast from 'react-hot-toast';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = Cookies.get('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

let refreshTokenPromise: Promise<
    AxiosResponse<{
        accessToken: string;
        refreshToken: string;
    }>
> | null = null;

axiosInstance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response && error.response.status === 401 && originalRequest) {
            if (!refreshTokenPromise) {
                const refreshToken = Cookies.get('refreshToken');

                refreshTokenPromise = axiosInstance
                    .post('/auth/refresh-tokens', refreshToken)
                    .then((response) => {
                        // toast.error('CHECKING DATA RETURN: ', response.data);
                        // console.log('CHECKING DATA RETURN: ', response.data);
                        const newAccessToken = response.data.access.token;
                        const newRefreshToken = response.data.refresh.token;

                        Cookies.set('accessToken', newAccessToken);
                        Cookies.set('refreshToken', newRefreshToken);

                        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
                        originalRequest.headers = {
                            ...originalRequest.headers,
                            Authorization: `Bearer ${newAccessToken}`,
                        };

                        return axiosInstance(originalRequest);
                    })
                    .catch((error) => {
                        Cookies.remove('accessToken');
                        Cookies.remove('refreshToken');
                        Cookies.remove('user');
                        // setTimeout(() => {
                        //     window.location.href = '/login';
                        // }, 2000);
                        return Promise.reject(error);
                    })
                    .finally(() => {
                        refreshTokenPromise = null;
                    });
            }

            return refreshTokenPromise.then(() => axiosInstance(originalRequest));
        }

        return Promise.reject(error);
    },
);

export const axiosBaseQuery =
    (
        { baseUrl } = { baseUrl: '' },
    ): BaseQueryFn<
        {
            url: string;
            method?: AxiosRequestConfig['method'];
            data?: AxiosRequestConfig['data'];
            params?: AxiosRequestConfig['params'];
            headers?: AxiosRequestConfig['headers'];
        },
        unknown,
        unknown
    > =>
        async ({ url, method, data, params, headers }) => {
            try {
                const result = await axiosInstance({
                    url: baseUrl + url,
                    method,
                    data,
                    params,
                    headers,
                });
                return { data: result };
            } catch (axiosError) {
                const err = axiosError as AxiosError;
                return {
                    error: {
                        status: err.response?.status,
                        data: err.response?.data || err.message,
                    },
                };
            }
        };

export default axiosInstance;
