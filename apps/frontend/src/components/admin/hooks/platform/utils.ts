import { toIsoIfPossible } from "../../utils";
import { BlockItem } from "../../types";

export type PlatformLoadGuard = {
  startLoad: () => boolean;
  endLoad: () => void;
};

export function buildBlockPayload(payload: Partial<BlockItem>) {
  return {
    ...payload,
    startTime: payload.startTime ? toIsoIfPossible(payload.startTime) : undefined,
    endTime: payload.endTime ? toIsoIfPossible(payload.endTime) : undefined
  };
}
