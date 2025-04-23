import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';

export const CLOSE = Symbol('close');

export class ModalStore {
  @observable
    isShowing?: boolean;
  @observable
    optsState?: ModalStore['opts'];
  @observable
    selectedAction?: string;

  @computed
  get isShown(): boolean {
    return !!this.optsState;
  }

  private opts: {
    buttons?: Record<string, {
      action?: string;
      disabled?: boolean;
      onBeforeSelect?: ((action?: string) => boolean);
      onSelect?: (action?: string) => void;
      title: string;
      type?: 'active' | null;
    }>;
    content?: React.Component | React.FunctionComponent | string;
    props?: Record<string, any>;
    onBeforeSelect?: ((action?: string) => boolean);
    onClose?: () => void;
    onSelect?: ((action?: string) => void);
    title: React.Component | React.FunctionComponent | string;
    withClose?: boolean;
  };
  private onSelectPromiseResolve: ((action?: string) => void) | undefined;

  constructor(private onShow?: (isShown?: boolean) => void) {
    makeObservable(this);
  }

  close() {
    if (this.onShow) {
      this.onShow(false);
    }

    this.select(CLOSE);
  }

  hide() {
    if (this.onShow) {
      this.onShow(false);
    }

    this.select(undefined);
  }

  select(action?: typeof CLOSE | string) {
    const isCloseAction = action === CLOSE;
    this.selectedAction = isCloseAction ? undefined : action;
    const button = action && this?.opts?.buttons && this.selectedAction
      ? Object.values(this.opts.buttons).find((button) => button.action === this.selectedAction)
      : null;

    if (this.opts?.onBeforeSelect && !this.opts?.onBeforeSelect(this.selectedAction)) {
      return;
    }

    if (button) {
      if (button.onBeforeSelect) {
        if (!button.onBeforeSelect(this.selectedAction)) {
          return;
        }
      }
    }

    this.isShowing = false;
    // this.optsState = undefined;

    if (this.onSelectPromiseResolve) {
      this.onSelectPromiseResolve(this.selectedAction);
    }

    if (isCloseAction) {
      if (this.opts.onClose) {
        this.opts.onClose();
      }

      return;
    }

    if (button) {
      if (button.onSelect) {
        button.onSelect(this.selectedAction);

        return;
      }
    }

    if (this.opts?.onSelect) {
      this.opts.onSelect(this.selectedAction);
    }
  }

  show(opts: ModalStore['opts']) {
    if (this.onShow) {
      this.onShow(true);
    }

    this.isShowing = true;

    if (!opts.buttons) {
      opts.buttons = {
        cancel: { action: 'cancel', title: 'Cancel' },
        ok: { action: 'ok', title: 'OK', type: 'active' },
      };
    }

    this.opts = opts;
    this.optsState = {
      ...opts,
      props: { ...opts.props, storage: this },
      onClose: opts.onClose || opts.withClose ? this.close.bind(this) : null,
      onSelect: this.select.bind(this),
    };

    if (this.optsState?.buttons) {
      this.optsState.buttons = Object
        .entries(this.optsState.buttons)
        .reduce((acc, [ key, button ]) => {
          acc[key] = { ...button, onSelect: this.select.bind(this) };

          return acc;
        }, {});
    }

    return new Promise<string | undefined>((resolve) => {
      this.onSelectPromiseResolve = resolve;
    });
  }

  updateButtonState(id, opts: { disabled?: boolean }) {
    if (this.optsState?.buttons?.[id]) {
      this.optsState.buttons[id] = { ...this.optsState.buttons[id], ...opts };
      this.optsState = { ...this.optsState };
    }
  }

  onTransitionEnd() {
    if (!this.isShowing) {
      this.optsState = undefined;
    }
  }
}
