import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { Spacer } from "~/components/Space";
import { getRecommendedMissThreshold } from "~/utils/user_state";
import { getAppState, useUserState, quick } from "~/utils/app_state";
import { useResponsive } from "~/utils/useResponsive";
import { cloneDeep, keys, upperFirst } from "lodash-es";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import {
  BoardThemeId,
  BOARD_THEMES_BY_ID,
  PieceSetId,
  PIECE_SETS,
} from "~/utils/theming";
import { PieceView } from "./chessboard/Chessboard";
import { PieceSymbol } from "@lubert/chess.ts";
import { Component, For, Show } from "solid-js";
import { clsx } from "~/utils/classes";

export const SidebarSetting = () => {
  return (
    <SidebarTemplate actions={[]} header={"Settings"}>
      <Spacer height={24} />
      <CoverageSettings />
    </SidebarTemplate>
  );
};
type SidebarSettingView = "rating" | "coverage";

export const SidebarSelectOneOf: Component<{
  title: string;
  description: string;
  choices: any[];
  activeChoice: any;
  onSelect: (_: any, i?: number) => void;
  renderChoice: (x: any, active: boolean) => Component;
  // todo: typing is hard
}> = (props) => {
  const responsive = useResponsive();
  const actions = () =>
    props.choices.map((choice, i) => {
      const active = choice === props.activeChoice;
      console.log("active", active, choice, props.activeChoice);
      return {
        style: "secondary" as SidebarAction["style"],
        text: props.renderChoice(choice, active),
        class: active && "bg-gray-24 &hover:bg-gray-32 text-primary",
        onPress: () => props.onSelect(choice, i),
        right: () =>
          active && (
            <i class={`fa fa-check`} style={s(c.fg(c.colors.textPrimary))} />
          ),
      };
    });
  return (
    <div style={s(c.column, c.fullWidth)}>
      <Show when={props.title}>
        <>
          <CMText
            style={s(
              c.fontSize(16),
              c.weightSemiBold,
              c.fg(c.colors.textPrimary),
              c.px(c.getSidebarPadding(responsive))
            )}
          >
            {props.title}
          </CMText>
          <Spacer height={12} />
        </>
      </Show>
      <Show when={props.description}>
        <>
          <CMText
            style={s(
              c.fontSize(12),
              c.lineHeight("1.5rem"),
              c.fg(c.colors.textSecondary),
              c.px(c.getSidebarPadding(responsive))
            )}
          >
            {props.description}
          </CMText>
          <Spacer height={12} />
        </>
      </Show>
      <div style={s(c.fullWidth)}>
        <For each={actions()}>
          {(action, i) => {
            return <SidebarFullWidthButton action={action} />;
          }}
        </For>
      </div>
    </div>
  );
};

export const THRESHOLD_OPTIONS = [4, 2, 1, 0.8, 0.5].map((x) => x / 100);

export const CoverageSettings = ({}: {}) => {
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
  const selected = () => missThreshold();
  const onSelect = (t: number) => {
    quick((s) => {
      s.userState.setTargetDepth(t);
    });
  };
  const recommendedDepth = () => getRecommendedMissThreshold(user()?.eloRange);
  const thresholdOptions = cloneDeep(THRESHOLD_OPTIONS);
  if (user().isAdmin) {
    thresholdOptions.push(0.25 / 100, 1 / 600);
  }
  return (
    <SidebarTemplate actions={[]} header={"Coverage goal"}>
      <Spacer height={12} />
      <SidebarSelectOneOf
        description={`Your repertoire will be complete when you cover all lines seen in`}
        choices={thresholdOptions}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={selected()}
        onSelect={onSelect}
        renderChoice={(r: number, active: boolean) => {
          return (
            <div class="">
              {`1 in ${Math.round(1 / r)} games`}
              <Show when={r === recommendedDepth()}>
                <div
                  class={clsx(
                    "border-1-white rounded-sm pt-1 text-xs",
                    active ? "text-secondary" : "text-tertiary"
                  )}
                >
                  Recommended for your level
                </div>
              </Show>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};
export const RatingSettings = ({}: {}) => {
  const [user, missThreshold] = useUserState((s) => [
    s.user,
    s.getCurrentThreshold(),
  ]);
  const selected = missThreshold;
  const onSelect = (t: string) => {
    quick((s) => {
      getAppState().userState.setRatingRange(t);
    });
  };
  const responsive = useResponsive();
  const thresholdOptions = cloneDeep(THRESHOLD_OPTIONS);
  if (user.isAdmin) {
    thresholdOptions.push(0.25 / 100, 1 / 600);
  }
  return (
    <SidebarTemplate actions={[]} header={"Your rating"}>
      <CMText style={s(c.px(c.getSidebarPadding(responsive)))}>
        Used to determine common moves and their win rates at your level
      </CMText>
      <Spacer height={24} />
      <SidebarSelectOneOf
        title="Elo range"
        choices={[
          "0-1100",
          "1100-1300",
          "1300-1500",
          "1500-1700",
          "1700-1900",
          "1900+",
        ]}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={user()?.ratingRange}
        onSelect={onSelect}
        renderChoice={(r: string) => {
          return r;
        }}
      />
      <Spacer height={24} />
      <SidebarSelectOneOf
        title="Rating system"
        choices={["Lichess", "Chess.com", "FIDE", "USCF"]}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={user()?.ratingSystem}
        onSelect={(t) => {
          quick((s) => {
            getAppState().userState.setRatingSystem(t);
          });
        }}
        renderChoice={(r: string) => {
          return r;
        }}
      />
    </SidebarTemplate>
  );
};

export const ThemeSettings = ({}: {}) => {
  const user = () => getAppState().userState?.user;
  const height = 24;
  return (
    <SidebarTemplate actions={[]} header={null}>
      <Spacer height={12} />
      <SidebarSelectOneOf
        description={null}
        title={"Tiles"}
        choices={keys(BOARD_THEMES_BY_ID) as BoardThemeId[]}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={user()?.theme}
        onSelect={(t: BoardThemeId) => {
          quick((s) => {
            const params: any = { theme: t };
            if (t === "low-contrast") {
              params.pieceSet = "monochrome";
            }
            s.userState.updateUserSettings(params);
          });
        }}
        renderChoice={(themeId: BoardThemeId) => {
          const theme = BOARD_THEMES_BY_ID[themeId];
          console.log(theme, themeId);
          return (
            <div style={s(c.row, c.center, c.height(height))}>
              <div style={s(c.row)}>
                <div
                  style={s(
                    c.size(22),
                    c.bg(theme.light.color),
                    theme.light.styles
                  )}
                ></div>
                <div
                  style={s(
                    c.size(22),
                    c.bg(theme.dark.color),
                    theme.dark.styles
                  )}
                ></div>
              </div>
              <Spacer width={22} />
              <CMText style={s(c.weightSemiBold, c.fontSize(14))}>
                {theme.name}
              </CMText>
            </div>
          );
        }}
      />
      <Spacer height={24} />

      <SidebarSelectOneOf
        description={null}
        title={"Pieces"}
        choices={PIECE_SETS}
        activeChoice={user()?.pieceSet}
        onSelect={(t: PieceSetId) => {
          quick((s) => {
            s.userState.updateUserSettings({ pieceSet: t });
          });
        }}
        renderChoice={(pieceSet: PieceSetId) => {
          return (
            <div style={s(c.row, c.center, c.height(height))}>
              {["q", "k"].map((p: PieceSymbol) => {
                return (
                  <div style={s(c.size(24), c.mr(4))}>
                    <PieceView
                      pieceSet={pieceSet}
                      piece={{ color: "w", type: p }}
                    />
                  </div>
                );
              })}
              <Spacer width={12} />
              <CMText style={s(c.weightSemiBold, c.fontSize(14))}>
                {upperFirst(pieceSet)}
              </CMText>
            </div>
          );
        }}
      />
    </SidebarTemplate>
  );
};
