import axios from "axios";
import { Dispatch, MutableRefObject, SetStateAction } from "react";

import { DetailedPosts } from "../../../backend/db/models/post";
import axiosConfig from "../../axios.config";

export default class FetchPosts {
  private body = new URLSearchParams();
  private requestUrl: string;

  constructor(
    public afterCursor: string | null,
    public setErrors: Dispatch<SetStateAction<string[]>>,
    public setAfterCursor: Dispatch<SetStateAction<string | null>>,
    public token?: string | undefined,
    public username?: string,
    public tags?: string,
    public query?: string,
  ) {
    this.requestUrl = this.token ? "recommendation/recommend" : "recommendation/globalRecommend";

    if (this.afterCursor) {
      this.body.append("afterCursor", this.afterCursor);
    }

    if (this.username) {
      this.requestUrl = "post/getUserPosts";
      this.body.append("username", this.username);
    }

    if (this.tags || this.query) {
      this.requestUrl = "post/search";
      
      if (this.tags) {
        this.body.append("tags", this.tags);
      }
      if (this.query) {
        this.body.append("query", this.query);
      }
    }
  }

  async request(posts: MutableRefObject<DetailedPosts["results"]>, ignoreAfterCursor?: boolean): Promise<void> {
    if (!this.afterCursor && !ignoreAfterCursor) {
      return;
    }

    const response = await axios.request({...axiosConfig, ...{
      url: this.requestUrl,
      data: this.body,
      headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {}
    }}).then(response => response.data).catch(() => {
      this.setErrors(prevErrors => [...prevErrors, "Failed to fetch user posts"]);
    });

    if (!response) {
      return;
    }

    if (response.hasOwnProperty("errorMessage")) {
      this.setErrors(prevErrors => [...prevErrors, `${response.errorType}: ${response.errorMessage}`]);
      return;
    }

    posts.current = [...posts.current, ...response.results];
    this.setAfterCursor(response.endCursor);
  }
}