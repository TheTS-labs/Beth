/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useSetAtom } from "jotai";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import axiosConfig from "../../axios.config";
import { errorsAtom } from "../../components/common/errors";
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
  doRequest=false,
  doSetErrors=true
): ReturnType<ResultType> {
  const authToken = useAuthToken();
  const setErrors = useSetAtom(errorsAtom);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<boolean | string>(false);
  const [ result, setResult ] = useState<ResultType | undefined>(undefined);

  useEffect(() => {
    if (typeof error === "string" && doSetErrors) {
      setErrors(prev => [...prev, error]);
    }
  }, [error]);

  const request = (newData?: object): void => {
    setError(false);
    setLoading(true);

    axios.request({...axiosConfig, ...{
      url,
      data: { ...data, ...newData || {} },
      headers: authToken.value ? { "Authorization": `Bearer ${authToken.value}` } : {}
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
    if (doRequest) {
      request();
    }
  }, []);

  return { error, loading, result, request, setResult };
}