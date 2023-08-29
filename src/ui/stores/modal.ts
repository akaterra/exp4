import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';

export const CLOSE = Symbol('close');

export class ModalStore {
  @observable initialOpts: {
    buttons?: {
      action: string;
      onSelect?: (action?: string) => void;
      title: string;
      type: 'active' | null;
    }[];
    content?: React.Component | React.FunctionComponent | string | undefined;
    props?: Record<string, any>;
    onClose?: () => void | undefined;
    onSelect?: ((action?: string) => void) | undefined;
    title: React.Component | React.FunctionComponent | string;
    withClose?: boolean;
  } | undefined;
  @observable selectedAction: string | undefined;

  @computed
  get isShow(): boolean {
    return !!this.initialOpts;
  }

  private opts: ModalStore['initialOpts'];
  private onSelectPromiseResolve: ((action?: string) => void) | undefined;

  constructor() {
    makeObservable(this);
  }

  close() {
    this.select(CLOSE);
  }

  hide() {
    this.select(undefined);
  }

  select(action?: typeof CLOSE | string) {
    this.initialOpts = undefined;
    const isCloseAction = action === CLOSE;
    this.selectedAction = isCloseAction ? null : action;

    if (this.onSelectPromiseResolve) {
      this.onSelectPromiseResolve(this.selectedAction);
    }

    if (isCloseAction) {
      if (this.opts.onClose) {
        this.opts.onClose();
      }

      return;
    }

    if (action && this?.opts?.buttons) {
      const button = this.opts.buttons.find((button) => button.action === this.selectedAction);

      if (button?.onSelect) {
        button.onSelect(this.selectedAction);

        return;
      }
    }

    if (this.opts?.onSelect) {
      this.opts.onSelect(this.selectedAction);
    }
  }

  show(opts: ModalStore['initialOpts']) {
    this.opts = opts;
    this.initialOpts = {
      ...opts,
      props: { ...opts.props, storage: this },
      onClose: opts.onClose || opts.withClose ? this.close.bind(this) : null,
      onSelect: this.select.bind(this),
    };

    if (this.initialOpts?.buttons) {
      this.initialOpts.buttons = this.initialOpts.buttons.map((button) => ({ ...button, onSelect: this.select.bind(this) }));
    }

    return new Promise<string | undefined>((resolve) => {
      this.onSelectPromiseResolve = resolve;
    });
  }
}
