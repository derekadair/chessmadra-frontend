import {
  Accessor,
  createEffect,
  createMemo,
  For,
  JSXElement,
  Show,
} from "solid-js";

// Use the For component, but if the index isn't the last one, insert another element at the end
export const Intersperse = <T,>(props: {
  each: Accessor<T[]>;
  separator: () => JSXElement;
  children: (item: T, index: Accessor<number>) => JSXElement;
}): JSXElement => {
  const length = () => props.each().length;
  return (
    <For each={props.each()}>
      {(item, index) => (
        <>
          {props.children(item, index)}
          <Show when={index() !== length() - 1}>{props.separator()}</Show>
        </>
      )}
    </For>
  );
};
