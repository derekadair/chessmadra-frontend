// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { capitalize, isNil } from "lodash-es";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  quick,
  useSidebarState,
  getAppState,
} from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { lineToPgn, pgnToLine, Side } from "~/utils/repertoire";
import { SidebarTemplate } from "./SidebarTemplate";
import { CoverageBar } from "./CoverageBar";
import { ReviewText } from "./ReviewText";
import { START_EPD } from "~/utils/chess";
import { useResponsive } from "~/utils/useResponsive";
import { BrowsingMode } from "~/utils/browsing_state";
import { ConfirmDeleteRepertoire } from "./ConfirmDeleteRepertoire";
import { Component, createSignal, For, Show } from "solid-js";
import { Pressable } from "./Pressable";
import { useHovering } from "~/mocks";

export const RepertoireOverview = (props: {}) => {
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  const textStyles = s(c.fg(c.colors.textPrimary), c.weightSemiBold);
  const appState = getAppState();
  const { repertoireState, userState } = appState;
  const { browsingState } = repertoireState;
  const progressState = () => browsingState.repertoireProgressState[side()];
  const biggestMiss = () =>
    repertoireState.repertoireGrades[side()]?.biggestMiss;
  const numMoves = () => repertoireState.getLineCount(side());
  const numMovesDueFromHere = () =>
    repertoireState.numMovesDueFromEpd[side()][START_EPD];
  const earliestDueDate = () =>
    repertoireState.earliestReviewDueFromEpd[side()][START_EPD];

  const empty = () => numMoves() === 0;
  const responsive = useResponsive();
  const startBrowsing = (mode: BrowsingMode, skipAnimation?: boolean) => {
    quick((s) => {
      if (skipAnimation) {
        s.repertoireState.startBrowsing(side(), mode);
      } else {
        s.repertoireState.animateChessboardShown(true, responsive, () => {
          quick((s) => {
            s.repertoireState.startBrowsing(side(), mode);
          });
        });
      }
    });
  };
  const buildOptions = () => [
    {
      hidden: empty() || isNil(biggestMiss()),
      onPress: () => {
        quick((s) => {
          trackEvent("side_overview.go_to_biggest_gap");
          const line = pgnToLine(biggestMiss().lines[0]);
          s.repertoireState.animateChessboardShown(true, responsive, () => {
            quick((s) => {
              s.repertoireState.startBrowsing(side() as Side, "build", {
                pgnToPlay: lineToPgn(line),
              });
            });
          });
        });
      },
      left: <CMText style={s(textStyles)}>{"Go to biggest gap"}</CMText>,
      right: null,
      icon: empty() && "fa-sharp fa-plus",
    },
    {
      hidden: empty(),
      right: (
        <div style={s(c.height(4), c.row)}>
          <CoverageAndBar home={false} side={side()} />
        </div>
      ),

      onPress: () => {
        quick((s) => {
          trackEvent("side_overview.browse_add_lines");
          s.repertoireState.browsingState.moveSidebarState("right");
          startBrowsing("build", empty());
        });
      },
      left: <CMText style={s(textStyles)}>Browse / add new line</CMText>,
    },
  ];
  const reviewTimer = () => {
    let reviewTimer = null;
    if (numMovesDueFromHere() !== 0) {
      // reviewStatus = "You have no moves due for review";
      reviewTimer = (
        <ReviewText
          date={earliestDueDate()}
          numDue={numMovesDueFromHere()}
          overview={true}
        />
      );
    }
    return reviewTimer;
  };
  const reviewOptions = () => [
    {
      hidden: numMovesDueFromHere() === 0,
      onPress: () => {
        quick((s) => {
          trackEvent("side_overview.start_review");
          s.repertoireState.animateChessboardShown(true, responsive, () => {
            quick((s) => {
              s.repertoireState.reviewState.startReview(side(), {
                side: side(),
              });
            });
          });
        });
      },
      right: reviewTimer,
      left: (
        <CMText style={s(textStyles)}>Practice all moves due for review</CMText>
      ),
    },
    {
      hidden: numMovesDueFromHere() > 0,
      onPress: () => {
        trackEvent("side_overview.practice_all_lines");
        quick((s) => {
          s.repertoireState.animateChessboardShown(true, responsive, () => {
            quick((s) => {
              s.repertoireState.reviewState.startReview(side(), {
                side: side(),
                cram: true,
              });
            });
          });
        });
      },
      left: <CMText style={s(textStyles)}>Practice all moves</CMText>,
    },
    {
      hidden: empty(),
      onPress: () => {
        trackEvent("side_overview.choose_line_to_practice");
        quick((s) => {
          s.repertoireState.browsingState.moveSidebarState("right");
          startBrowsing("browse");
        });
      },
      left: (
        <CMText style={s(textStyles)}>
          Choose a specific opening to practice
        </CMText>
      ),
      right: (
        <i
          style={s(c.fg(c.colors.textTertiary), c.fontSize(14))}
          class={"fa fa-arrow-right"}
        />
      ),
    },
  ];
  const options = () =>
    [
      {
        hidden: !empty(),
        onPress: () => {
          trackEvent("side_overview.start_building");
          quick((s) => {
            s.repertoireState.animateChessboardShown(true, responsive, () => {
              quick((s) => {
                s.repertoireState.startBrowsing(side() as Side, "build");
              });
            });
            trackEvent("side_overview.start_building");
          });
        },
        left: <CMText style={s(textStyles)}>{"Start building"}</CMText>,
        right: null,
        icon: empty() && "fa-sharp fa-plus",
      },
      {
        onPress: () => {
          trackEvent("side_overview.import");
          quick((s) => {
            s.repertoireState.startImporting(side());
          });
        },
        left: <CMText style={s(textStyles)}>Import lines</CMText>,
        icon: "fa-sharp fa-file-import",
        right: null,
      },
      {
        onPress: () => {
          quick((s) => {
            trackEvent("side_overview.export");
            s.repertoireState.exportPgn(side());
          });
        },
        hidden: empty(),
        left: <CMText style={s(textStyles)}>Export repertoire</CMText>,
        icon: "fa-sharp fa-arrow-down-to-line",
        right: null,
      },
      {
        hidden: empty(),
        onPress: () => {
          quick((s) => {
            trackEvent("side_overview.delete_repertoire");
            s.repertoireState.browsingState.replaceView(
              <ConfirmDeleteRepertoire />,
              "right"
            );
          });
        },
        left: <CMText style={s(textStyles)}>Delete repertoire</CMText>,
        icon: "fa-sharp fa-trash",
        right: null,
      },
    ].filter((o) => {
      if (o.hidden) return false;
      return empty() || expanded();
    });
  const [expanded, setExpanded] = createSignal(false);
  // let reviewStatus = `You have ${pluralize(
  //   numMovesDueFromHere,
  //   "move"
  // )} due for review`;
  const repertoireStatus = () => {
    if (empty()) {
      return `Your repertoire is empty`;
    }
    return `Your repertoire is ${Math.round(
      progressState().percentComplete
    )}% complete`;
  };
  return (
    <SidebarTemplate
      header={`${capitalize(side())} Repertoire`}
      actions={[]}
      bodyPadding={false}
    >
      <Spacer height={24} />

      <Show when={!empty()}>
        <div style={s(c.borderTop(`1px solid ${c.colors.border}`))}>
          <For
            each={[...buildOptions(), ...reviewOptions()].filter(
              (opt) => !opt.hidden
            )}
          >
            {(opt) => {
              return <Option option={opt} />;
            }}
          </For>
        </div>
      </Show>
      <For each={options()}>
        {(opt) => {
          return <Option option={opt} />;
        }}
      </For>
      <div style={s(c.row, c.px(c.getSidebarPadding(responsive)), c.pt(8))}>
        <Show when={!empty()}>
          <Pressable
            style={s(c.pb(2))}
            onPress={() => {
              trackEvent("side_overview.go_to_biggest_gap");
              setExpanded(!expanded());
            }}
          >
            <CMText
              style={s(
                c.fontSize(12),
                c.fg(c.colors.textTertiary),
                c.weightSemiBold
              )}
            >
              {!expanded() ? "More options..." : "Hide "}
            </CMText>
          </Pressable>
        </Show>
      </div>
    </SidebarTemplate>
  );
};

const Option = ({
  option,
}: {
  option: {
    onPress: () => void;
    right?: Component;
    left?: Component;
    core?: boolean;
    icon?: string;
    disabled?: boolean;
  };
}) => {
  const responsive = useResponsive();
  const styles = s(
    c.py(12),
    c.px(c.getSidebarPadding(responsive)),
    c.center,
    c.row,
    c.justifyBetween
  );
  const { hovering, hoveringProps } = useHovering();
  return (
    <Pressable
      {...hoveringProps}
      style={s(
        styles,
        option.disabled && c.noPointerEvents,
        c.borderBottom(`1px solid ${c.colors.border}`),
        s(hovering() && !option.disabled && c.bg(c.grays[18]))
      )}
      onPress={() => {
        if (!option.disabled) {
          option.onPress();
        }
      }}
    >
      {option.left}
      {option.right}
    </Pressable>
  );
};

export const CoverageAndBar = (props: {
  side: Side;
  home: boolean;
  hideBar?: boolean;
}) => {
  const inverse = () => props.home && props.side === "white";
  const textStyles = () =>
    s(
      c.fg(inverse() ? c.colors.textInverse : c.colors.textSecondary),
      !props.home && c.fg(c.colors.textSecondary),
      c.weightSemiBold,
      c.fontSize(12)
    );
  const [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[props.side],
  ]);

  return (
    <div style={s(c.row, c.alignCenter)}>
      <CMText style={s(textStyles())}>
        {progressState().completed ? (
          <>Completed</>
        ) : (
          <>{Math.round(progressState().percentComplete)}% complete</>
        )}
      </CMText>
      <Show when={!props.hideBar}>
        <>
          <Spacer width={8} />
          <div
            style={s(
              c.height(props.home ? 4 : 4),
              c.width(props.home ? 100 : 80),
              c.row
            )}
          >
            <CoverageBar isInSidebar={!props.home} side={props.side} />
          </div>
        </>
      </Show>
    </div>
  );
};
