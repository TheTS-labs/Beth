/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { PrimitiveAtom, useSetAtom } from "jotai";
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

export default function useRequest<ResultType=any>(options: {
  url: string
  data: object
  errorsAtom: PrimitiveAtom<string[]>
  doRequest?: boolean
  doSetErrors?: boolean
}): ReturnType<ResultType> {
  const authToken = useAuthToken();
  const setErrors = useSetAtom(options.errorsAtom);

  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<boolean | string>(false);
  const [ result, setResult ] = useState<ResultType | undefined>(undefined);

  useEffect(() => {
    if (typeof error === "string" && options.doSetErrors) {
      setErrors(prev => [...prev, error]);
    }
  }, [error]);

  const request = (additionalData: object = {}): void => {
    setError(false);
    setLoading(true);

    axios.request({...axiosConfig, ...{
      url: options.url,
      data: { ...options.data, ...additionalData || {} },
      headers: { "Authorization": `Bearer ${authToken.value}` }
    }}).then(response => response.data).then(responseData => {
      if (responseData.hasOwnProperty("errorMessage")) {
        setError(responseData.errorMessage);
      }
      setResult(responseData);
      setLoading(false);
    }).catch(e => {
      setError(String(e));
      setLoading(false);
    });
  };

  useEffect(() => {
    if (options.doSetErrors) {
      request();
    }
  }, []);

  return { error, loading, result, request, setResult };
}