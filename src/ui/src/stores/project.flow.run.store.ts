import { IProjectFlow, IProjectTarget, IProjectTargetStream } from './dto/project';
import { FormStore } from './form';
import { ProjectStore } from './project';

export class ProjectFlowParamsStore extends FormStore {
  projectFlow: IProjectFlow;
  projectTarget: IProjectTarget;
  projectTargetStreams: { id: IProjectTargetStream['id']; title: IProjectTargetStream['title']; isSelected: boolean }[];

  get streamIds() {
    return this.projectTargetStreams.filter((stream) => stream.isSelected).map((stream) => stream.id);
  }

  constructor(
    public projectStore: ProjectStore,
    public flowId?: IProjectFlow['id'],
    public targetId?: string,
    public selectedStreamIds?: IProjectTargetStream['id'][],
  ) {
    const projectFlow = flowId ? projectStore.project?.flows[flowId] : Object
      .values(projectStore.project?.flows)
      .find((flow) => flow.targets.includes(targetId));

    super(projectFlow.params ?? {});

    this.projectFlow = projectFlow;
    this.projectTarget = projectStore.getTargetByTargetId(targetId),
    this.projectTargetStreams = Object.values(this.projectTarget.streams)
      .filter((stream) => !selectedStreamIds || selectedStreamIds?.includes(stream.id))
      .map((stream) => ({ id: stream.id, title: stream.title, isSelected: true }));
  }

  useAllTargetStreams() {
    Object.values(this.projectTarget.streams).forEach((stream) => {
      if (!this.projectTargetStreams.find((s) => s.id === stream.id)) {
        this.projectTargetStreams.push({ id: stream.id, title: stream.title, isSelected: false });
      }
    });

    return this;
  }
}
