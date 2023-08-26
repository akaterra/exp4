import * as React from 'react-dom';
import { makeObservable, observable } from 'mobx';

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
    onSelect?: ((action?: string) => void) | undefined;
    title: React.Component | React.FunctionComponent | string;
  } | undefined;
  @observable selectedAction: string | undefined;

  private opts: ModalStore['initialOpts'];
  private onSelectPromiseResolve: ((action?: string) => void) | undefined;

  constructor() {
    makeObservable(this);
  }

  hide() {
    this.select(undefined);
  }

  select(action?: string) {
    this.initialOpts = undefined;
    this.selectedAction = action;

    if (this.onSelectPromiseResolve) {
      this.onSelectPromiseResolve(action);
    }

    if (action && this?.opts?.buttons) {
      const button = this.opts.buttons.find((button) => button.action === action);

      if (button?.onSelect) {
        button.onSelect(action);

        return;
      }
    }

    if (this.opts?.onSelect) {
      this.opts.onSelect(action);
    }
  }

  show(opts: ModalStore['initialOpts']) {
    this.opts = opts;
    this.initialOpts = { ...opts, onSelect: this.select.bind(this) };

    if (this.initialOpts?.buttons) {
      this.initialOpts.buttons = this.initialOpts.buttons.map((button) => ({ ...button, onSelect: this.select.bind(this) }));
    }

    return new Promise<string | undefined>((resolve) => {
      this.onSelectPromiseResolve = resolve;
    });
  }
}
