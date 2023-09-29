/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useState } from "react";

import axiosConfig from "../../axios.config";
import useAuthToken from "../common/token";

interface ReturnType<ResultType=any> {
  loading: boolean
  error: boolean | string
  result: ResultType | undefined
  request: () => void
}

export default function useRequest<ResultType=any>(
  url: string,
  data: unknown,
  doRequest=true
): ReturnType<ResultType> {
  const authToken = useAuthToken();
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<boolean | string>(false);
  const [ result, setResult ] = useState<ResultType | undefined>(undefined);

  const request = (): void => {
    setError(false);
    setLoading(true);

    axios.request({...axiosConfig, ...{
      url,
      data,
      headers: authToken.value ? { "Authorization": `Bearer ${authToken.value}` } : {}
    }}).then(response => response.data).then(responseData => {
      setResult(responseData);
      setLoading(false);
    }).catch(e => {
      setError(String(e));
      setLoading(false);
    });
  };

  useEffect(() => {
    if (doRequest) {
      request();
    }
  }, []);

  return { error, loading, result, request };
}