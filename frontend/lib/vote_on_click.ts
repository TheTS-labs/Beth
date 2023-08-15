import axios from "axios";
import { Dispatch, MouseEvent, SetStateAction } from "react";
import axiosConfig from "../axios.config";

type ReturnType = (event: MouseEvent<any, any>) => Promise<void>;

async function vote(
  token: string,
  postId: string,
  voteType: string,
  setErrors: Dispatch<SetStateAction<string[]>>
): Promise<undefined|("create" | "update" | "delete")> {
  const response = await axios.request({...axiosConfig, ...{
    url: "voting/vote", 
    data: new URLSearchParams({ postId, voteType }),
    headers: { "Authorization": `Bearer ${token}` }
  }}).then(response => response.data).catch(e => {
    setErrors(prevErrors => [...prevErrors, String(e)]);
  });

  if (!response) {
    return
  }

  if (response.hasOwnProperty("errorMessage")) {
    setErrors(prevErrors => [...prevErrors, response.errorMessage]);
    return;
  }

  return response.action || undefined;
}

export default (token: string, setErrors: Dispatch<SetStateAction<string[]>>): ReturnType => {
  return async (event: MouseEvent<any, any>): Promise<void> => {
    if (!token) {
      setErrors(prevErrors => [...prevErrors, "Log In or Sing Up to vote"]);
      return;
    }

    const postId = event.currentTarget.getAttribute("data-post-id"),
          voteType = event.currentTarget.getAttribute("data-vote-type"),
          score = document.getElementById(`post_${postId}_score`),
          voteColor = parseInt(voteType) ? "green" : "red",
          result = await vote(token, postId, voteType, setErrors);
      
    if (!result) {
      return;
    }

    const response = await axios.request({...axiosConfig, ...{
      url: "voting/voteCount", 
      data: new URLSearchParams({ postId }),
      headers: { "Authorization": `Bearer ${token}` }
    }}).then(response => response.data).catch(e => {
      setErrors(prevErrors => [...prevErrors, String(e)]);
    });

    score.innerHTML = response.total;
    score.style.color = result == "delete" ? "#f9f4e6" : voteColor;
  }
}