import {
  GameResultsDistribution,
  PositionReport,
  SuggestedMove,
} from "~/utils/models";
import { isNil } from "lodash-es";
import { Side } from "./repertoire";

export function getTotalGames(results: GameResultsDistribution) {
  if (!results) {
    return null;
  }
  return results.draw + results.black + results.white;
}

export const formatPlayPercentage = (x: number) => {
  return `${(x * 100).toFixed(0)}%`;
};

export const formatWinPercentage = (x: number) => {
  return `${(x * 100).toFixed(0)}`;
};

export function getWinRate(x: GameResultsDistribution, side: string) {
  return x[side] / getTotalGames(x);
}

export function getDrawAdjustedWinRate(x: GameResultsDistribution, side: Side) {
  return (x[side] + x.draw / 2) / getTotalGames(x);
}

export function getWinRateRange(
  x: GameResultsDistribution,
  side: string
): [number, number, number] {
  const w = x[side];
  const n = getTotalGames(x);
  const p = w / n;
  const range = 2.5 * Math.sqrt((p * (1 - p)) / n);
  return [w / n - range, w / n + range, range * 2];
}

export const getPlayRate = (
  m: SuggestedMove,
  report: PositionReport,
  masters?: boolean
): number => {
  const k = masters ? "masterResults" : "results";
  const total = getTotalGames(report[k]);
  const divisor = getTotalGames(m[k]);
  if (isNil(total) || isNil(divisor) || total === 0) {
    return null;
  }
  return divisor / total;
};

export const isNegligiblePlayrate = (playRate: number) => {
  return (
    !playRate || isNaN(playRate) || formatPlayPercentage(playRate) === "0%"
  );
};
