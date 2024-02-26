import { MouseEvent, useEffect, useState } from "react";

import { errorsAtom } from "../../components/common/errors";
import useRequest from "./use_request";

export default function useVote(postId: number): { callback: (event: MouseEvent<unknown, unknown>) => void } {
  const vote = useRequest<{ success: true, action: "create" | "update" | "delete" }>({
    url: "/voting/vote",
    data: { postId },
    errorsAtom
  });
  const voteCount = useRequest({ url: "voting/voteCount", data: { postId }, errorsAtom});
  const [ voteType, setVoteType ] = useState<string | null>(null);

  useEffect(() => {
    // For some reason the invalid_token error is triggered twice if I combine these two if`s
    //? The invalid_token error will occur if the user doesn't have a token or it's invalid
    // TODO: investigate
    if (vote.error || voteCount.error) {
      return;
    }

    //? Do nothing if neither voteCount nor vote has a result
    //? Fire voteCount, if only the vote has a result, for the user's interaction with the voting to take effect
    if (!voteCount.result || !vote.result) {
      if (!voteCount.result && vote.result) {
        voteCount.request();
      }
      return;
    }

    //? This may look wrong, but for the code, these elements with the same id are actually the same thing
    const scores = document.querySelectorAll<HTMLElement>(`#post_${postId}_score`);
    const voteColor = parseInt(voteType || "0") ? "green" : "red";

    scores.forEach(score => {
      score.innerHTML = voteCount.result.total;
      score.style.color = vote.result?.action == "delete" ? "#f9f4e6" : voteColor;
    });
  }, [voteCount.result, vote.result]);

  return {
    callback: (event: MouseEvent<unknown, unknown>): void => {
      const voteType = (event.currentTarget as HTMLElement).getAttribute("data-vote-type");

      vote.setResult(undefined);
      vote.request({ voteType });

      voteCount.setResult(undefined);
    
      setVoteType(voteType);
    }
  };
}