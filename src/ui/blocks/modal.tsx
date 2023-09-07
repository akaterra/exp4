import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { Modal as ModalAtom } from "../atoms/modal";

export const modalStore = new ModalStore();

export const Modal = observer(({ store }: { store?: ModalStore }) => {
  if (!store?.optsState) {
    return null;
  }

  const TitleComponent: React.Component | React.FunctionComponent | undefined = typeof store?.optsState?.title === 'string'
    ? () => <span>{ store?.optsState?.title as string }</span>
    : store?.optsState?.title;
  const ContentComponent: React.Component | React.FunctionComponent | undefined = typeof store?.optsState?.content === 'string'
    ? () => <span>{ store?.optsState?.content as string }</span>
    : store?.optsState?.content;

  return <ModalAtom
    buttons={ store?.optsState?.buttons }
    title={ TitleComponent ? <TitleComponent { ...store.optsState?.props } store={ store } /> : undefined }
    onClose={ store?.optsState?.onClose }
    onSelect={ store?.optsState?.onSelect }
  >
    {
      ContentComponent && <ContentComponent { ...store.optsState?.props } store={ store } />
    }
  </ModalAtom>;
});

export const GlobalModal = observer(() => {
  return <Modal store={ modalStore } />;
});
