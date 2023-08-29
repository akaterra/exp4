import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { Modal as ModalAtom } from "../atoms/modal";

export const modalStore = new ModalStore();

export const Modal = observer(({ store }: { store?: ModalStore }) => {
  if (!store?.initialOpts) {
    return null;
  }

  const TitleComponent: React.Component | React.FunctionComponent | undefined = typeof store?.initialOpts?.title === 'string'
    ? (props?) => <span>{ store?.initialOpts?.title as string }</span>
    : store?.initialOpts?.title;
  const ContentComponent: React.Component | React.FunctionComponent | undefined = typeof store?.initialOpts?.content === 'string'
    ? (props?) => <span>{ store?.initialOpts?.content as string }</span>
    : store?.initialOpts?.content;

  return <ModalAtom
    buttons={ store?.initialOpts?.buttons }
    title={ TitleComponent && <TitleComponent { ...store.initialOpts?.props } store={ store } /> }
    onClose={ store?.initialOpts?.onClose }
    onSelect={ store?.initialOpts?.onSelect }
  >
    {
      ContentComponent && <ContentComponent { ...store.initialOpts?.props } store={ store } />
    }
  </ModalAtom>;
});

export const GlobalModal = observer(() => {
  return <Modal store={ modalStore } />;
});
