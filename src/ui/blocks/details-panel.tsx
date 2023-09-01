import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { DetailsPanel as DetailsPanelAtom } from "../atoms/details-panel";

export const detailsPanelStore = new ModalStore();

export const DetailsPanel = observer(({ store }: { store?: ModalStore }) => {
  if (!store?.optsState) {
    return null;
  }

  const TitleComponent: React.Component | React.FunctionComponent | undefined = typeof store?.optsState?.title === 'string'
    ? (props?) => <span>{ store?.optsState?.title as string }</span>
    : store?.optsState?.title;
  const ContentComponent: React.Component | React.FunctionComponent | undefined = typeof store?.optsState?.content === 'string'
    ? (props?) => <span>{ store?.optsState?.content as string }</span>
    : store?.optsState?.content;

  return <DetailsPanelAtom
    // buttons={ modalStore?.initialOpts?.buttons }
    title={ TitleComponent && <TitleComponent { ...store.optsState?.props } /> }
    onClose={ store?.optsState?.onClose }
  >
    {
      ContentComponent && <ContentComponent { ...store.optsState?.props } />
    }
  </DetailsPanelAtom>;
});

export const GlobalDetailsPanel = observer(() => {
  return <DetailsPanel store={ detailsPanelStore } />;
});
