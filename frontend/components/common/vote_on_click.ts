import axios from "axios";
import { Dispatch, MouseEvent, SetStateAction } from "react";
import axiosConfig from "../../axios.config";

type ReturnType = (event: MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<void>;

async function vote(postId: string, voteType: string, token: string, body: URLSearchParams): Promise<string[]> {
  const errors = [];

  const response = await axios.request({...axiosConfig, ...{
    url: "voting/vote", 
    data: body,
    headers: { "Authorization": `Bearer ${token}` }
  }}).then(response => response.data).catch(e => {
    errors.push(String(e));
  });

  if (!response) {
    return errors;
  }

  if ("errorType" in response && "errorMessage" in response) {
    errors.push(response.errorMessage);
    return errors;
  }
}

export default (token: string, setErrors: Dispatch<SetStateAction<string[]>>): ReturnType => {
  return async (event: MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> => {
    if (!token) {
      setErrors(prevErrors => [...prevErrors, "Log In or Sing Up to vote, please"]);
      return;
    }

    const postId = event.currentTarget.getAttribute("data-post-id"),
          voteType = event.currentTarget.getAttribute("data-vote-type"),
          score = document.getElementById("post_" + postId + "_score"),
          voteInt = parseInt(voteType) ? 1 : -1,
          voteColor = parseInt(voteType) ? "green" : "red",
          body = new URLSearchParams({
            postId: postId,
            voteType: voteType
          });

    const voteErrors = await vote(postId, voteType, token, body);
    if (voteErrors) {
      setErrors(prevErrors => [...prevErrors, ...voteErrors]);
      return;
    }

    score.innerHTML = String(parseInt(score.innerHTML) + voteInt);
    score.style.color = voteColor;
  }
}