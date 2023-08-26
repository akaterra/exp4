import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { Modal as ModalAtom } from "../atoms/modal";

export const modalStore = new ModalStore();

export const Modal = observer(({ modalStore }: { modalStore?: ModalStore }) => {
  if (!modalStore?.initialOpts) {
    return null;
  }

  const TitleComponent: React.Component | React.FunctionComponent | undefined = typeof modalStore?.initialOpts?.title === 'string'
    ? (props?) => <span>{ modalStore?.initialOpts?.title as string }</span>
    : modalStore?.initialOpts?.title;
  const ContentComponent: React.Component | React.FunctionComponent | undefined = typeof modalStore?.initialOpts?.content === 'string'
    ? (props?) => <span>{ modalStore?.initialOpts?.content as string }</span>
    : modalStore?.initialOpts?.content;

  return <ModalAtom
    buttons={ modalStore?.initialOpts?.buttons }
    title={ TitleComponent && <TitleComponent { ...modalStore.initialOpts?.props } /> }
    onSelect={ modalStore?.initialOpts?.onSelect }
  >
    {
      ContentComponent && <ContentComponent { ...modalStore.initialOpts?.props } />
    }
  </ModalAtom>;
});

export const GlobalModal = observer(() => {
  return <Modal modalStore={ modalStore } />;
});
