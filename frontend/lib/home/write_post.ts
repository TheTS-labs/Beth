import axios from "axios";
import { Dispatch, SetStateAction } from "react";

import axiosConfig from "../../axios.config";

export default class WritePost {
  private body = new URLSearchParams();

  constructor(
    public setErrors: Dispatch<SetStateAction<string[]>>,
    public token: string,
    public replyTo?: number
  ) {
    if (this.replyTo) {
      this.body.append("replyTo", String(this.replyTo));
    }
  }

  async request(text: string): Promise<boolean> {
    this.body.append("text", text);
  
    const response = await axios.request({...axiosConfig, ...{
      url: "post/create",
      data: this.body,
      headers: { "Authorization": `Bearer ${this.token}` }
    }}).then(response => response.data).catch(e => {
      this.setErrors(prevErrors => [...prevErrors, String(e)]);
    });
  
    if (!response) {
      return false;
    }
  
    if (response.hasOwnProperty("errorMessage")) {
      this.setErrors(prevErrors => [...prevErrors, response.errorMessage]);
      return false;
    }
  
    return response.success;
  }
}