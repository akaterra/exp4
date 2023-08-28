import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { DetailsPanel as DetailsPanelAtom } from "../atoms/details-panel";

export const detailsPanelStore = new ModalStore();

export const DetailsPanel = observer(({ store }: { store?: ModalStore }) => {
  if (!store?.initialOpts) {
    return null;
  }

  const TitleComponent: React.Component | React.FunctionComponent | undefined = typeof store?.initialOpts?.title === 'string'
    ? (props?) => <span>{ store?.initialOpts?.title as string }</span>
    : store?.initialOpts?.title;
  const ContentComponent: React.Component | React.FunctionComponent | undefined = typeof store?.initialOpts?.content === 'string'
    ? (props?) => <span>{ store?.initialOpts?.content as string }</span>
    : store?.initialOpts?.content;

  return <DetailsPanelAtom
    // buttons={ modalStore?.initialOpts?.buttons }
    title={ TitleComponent && <TitleComponent { ...store.initialOpts?.props } /> }
    onClose={ store?.initialOpts?.onClose }
  >
    {
      ContentComponent && <ContentComponent { ...store.initialOpts?.props } />
    }
  </DetailsPanelAtom>;
});

export const GlobalDetailsPanel = observer(() => {
  return <DetailsPanel store={ detailsPanelStore } />;
});
