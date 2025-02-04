import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { getAppState, useUserState, quick } from "~/utils/app_state";
import { cloneDeep, find, last } from "lodash-es";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  BoardThemeId,
  BOARD_THEMES_BY_ID,
  combinedThemes,
} from "~/utils/theming";
import { compareFloats } from "~/utils/utils";
import { SidebarSelectOneOf } from "./SidebarSelectOneOf";
import { UserFlag } from "~/utils/models";
import { SidebarActions } from "./SidebarActions";
import { getExpectedNumMovesBetween } from "~/utils/repertoire_state";
import { RatingSelection } from "./RatingSelection";
import { initTooltip } from "./Tooltip";
import { renderThreshold } from "~/utils/threshold";

type ThresholdOption = {
  name: string;
  value: number;
};

const THRESHOLD_OPTIONS: ThresholdOption[] = [
  {
    name: "Basic",
    value: 1 / 75,
  },
  {
    name: "Starter",
    value: 1 / 100,
  },
  {
    name: "Intermediate",
    value: 1 / 150,
  },
  {
    name: "Advanced",
    value: 1 / 200,
  },
  {
    name: "Tournament ready",
    value: 1 / 300,
  },
  {
    name: "Bulletproof",
    value: 1 / 400,
  },
];

export const CoverageSettings = (props: {}) => {
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
  const selected = () =>
    find(THRESHOLD_OPTIONS, (o) => compareFloats(o.value, missThreshold()));
  const onSelect = (t: ThresholdOption) => {
    quick((s) => {
      s.userState.setTargetDepth(t.value);
    });
  };
  // @ts-ignore
  const recommendedDepth = () => getRecommendedMissThreshold(user()?.eloRange);
  const thresholdOptions = cloneDeep(THRESHOLD_OPTIONS);
  const getExpectedMoves = (threshold: number) => {
    return getExpectedNumMovesBetween(1, threshold, "white", false);
  };
  const maxMoves = getExpectedMoves(last(thresholdOptions)!.value);
  return (
    <SidebarTemplate
      actions={[]}
      header={"What type of repertoire do you want to create?"}
    >
      <div class="row items-center border-0 border-b border-border border-solid  text-tertiary font-semibold pb-2 md:pb-3 pr-4 md:pr-6 text-xs text-right">
        <div class="grow" />
        <div class="w-26 lg:w-28 mr-6 ">Coverage goal</div>
        <div class="w-24 md:w-30 shrink-0 ">Size/study time</div>
        <div class="w-6" />
        {/*<Show when={r.value === recommendedDepth()}>
                <div
                  class={clsx(
                    "pl-2 text-xs",
                    active ? "text-primary" : "text-tertiary",
                  )}
                >
                  Recommended for your level
                </div>
              </Show>*/}
      </div>
      <SidebarSelectOneOf
        description={undefined}
        choices={thresholdOptions}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={selected()}
        onSelect={onSelect}
        equality={(choice: ThresholdOption, activeChoice?: ThresholdOption) => {
          if (!activeChoice) return false;
          return compareFloats(choice.value, activeChoice.value);
        }}
        renderChoice={(r: ThresholdOption, active: boolean) => {
          const moves = getExpectedMoves(r.value);
          return (
            <div class="row items-center">
              <div class="grow whitespace-nowrap text-xs lg:text-sm">
                {r.name}
              </div>
              <div
                class="w-26 lg:w-32 mr-6 text-xs lg:text-sm text-right"
                ref={(x) => {
                  initTooltip({
                    ref: x,
                    maxWidth: 200,
                    content: () => (
                      <p>
                        Your repertoire will be complete when you have a
                        response to all moves you’ll see in at least{" "}
                        <b>{renderThreshold(r.value)} games</b> at your level
                      </p>
                    ),
                  });
                }}
              >{`1 in ${Math.round(1 / r.value)} games`}</div>
              <div
                class="w-24 md:w-30  shrink-0 h-1 rounded overflow-hidden"
                ref={(x) => {
                  initTooltip({
                    ref: x,
                    maxWidth: 200,
                    content: () => (
                      <p>
                        A complete repertoire will have around{" "}
                        <b>{Math.round(moves / 100) * 100} moves</b>
                      </p>
                    ),
                  });
                }}
              >
                <div
                  class={"bg-purple-55 h-full rounded"}
                  style={{ width: `${(moves / maxMoves) * 100}%` }}
                />
              </div>
              {/*<Show when={r.value === recommendedDepth()}>
                <div
                  class={clsx(
                    `pl-2 text-xs`,
                    active ? "text-primary" : "text-tertiary",
                  )}
                >
                  Recommended for your level
                </div>
              </Show>*/}
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};
export const RatingSettings = (props: {}) => {
  return (
    <SidebarTemplate actions={[]} header={"Your rating"} bodyPadding={true}>
      <CMText style={s()} class={"text-secondary"}>
        This is used to determine which moves your opponents are likely to play.
      </CMText>
      <Spacer height={24} />
      <RatingSelection />
    </SidebarTemplate>
  );
};

export const ThemeSettings = (props: {}) => {
  const user = () => getAppState().userState?.user;
  const height = 24;
  return (
    <SidebarTemplate header={"Board appearance"} actions={[]}>
      <SidebarSelectOneOf
        choices={combinedThemes.map((t) => t.boardTheme)}
        // cellStyles={s(c.bg(c.gray[15]))}
        // horizontal={true}
        activeChoice={user()?.theme ?? "default"}
        onSelect={(boardThemeId: BoardThemeId) => {
          quick((s) => {
            const theme = find(
              combinedThemes,
              (t) => t.boardTheme === boardThemeId,
            );
            console.log("selected", boardThemeId, theme);
            s.userState.updateUserSettings({
              theme: theme!.boardTheme,
              pieceSet: theme!.pieceSet,
            });
          });
        }}
        renderChoice={(boardThemeId: BoardThemeId) => {
          const theme = find(
            combinedThemes,
            (t) => t.boardTheme === boardThemeId,
          );
          const boardTheme = BOARD_THEMES_BY_ID[boardThemeId];
          return (
            <div style={s(c.row, c.center)}>
              <CMText style={s(c.weightSemiBold, c.fontSize(14))}>
                {theme!.name}
              </CMText>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};

export const BetaFeaturesSettings = (props: {}) => {
  const userState = () => getAppState().userState;
  const features = [
    {
      flag: "quiz_plans" as UserFlag,
      name: "Quiz plans",
      description:
        "Practice the middlegame plans in your repertoire, during review",
    },
  ];
  return (
    <SidebarTemplate header={"Beta features"} actions={[]}>
      <SidebarActions
        actions={features.map((feature) => {
          const enabled = () => userState().flagEnabled(feature.flag);
          console.log("enabled", enabled());
          return {
            text: feature.name,
            style: enabled() ? "focus" : "primary",
            right: enabled() ? "Enabled" : "Disabled",
            subtext: feature.description,
            onPress: () => {
              quick((s) => {
                s.userState.setFlag(feature.flag, !enabled);
              });
            },
          };
        })}
      />
    </SidebarTemplate>
  );
};
