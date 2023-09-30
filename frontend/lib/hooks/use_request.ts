/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import axiosConfig from "../../axios.config";
import useAuthToken from "../common/token";

interface ReturnType<ResultType=any> {
  loading: boolean
  error: boolean | string
  result: ResultType | undefined
  request: (newData?: object) => void
  setResult: Dispatch<SetStateAction<ResultType | undefined>>
}

export default function useRequest<ResultType=any>(
  url: string,
  data: object,
  doRequest=true
): ReturnType<ResultType> {
  const authToken = useAuthToken();
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<boolean | string>(false);
  const [ result, setResult ] = useState<ResultType | undefined>(undefined);

  const request = (newData?: object): void => {
    setError(false);
    setLoading(true);

    axios.request({...axiosConfig, ...{
      url,
      data: { ...data, ...newData || {} },
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

  return { error, loading, result, request, setResult };
}