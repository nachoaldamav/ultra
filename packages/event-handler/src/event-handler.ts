import events from 'node:events';

type ResolveDepInfo = {
  name: string;
  version: string;
  parentPath?: string;
  path: string;
  cachePath: string;
  tarball: string;
  sha: string;
  type: string;
  alias?: string;
};

export enum EventType {
  ResolvedDep = 'resolved-dep',
  LinkDep = 'link-dep',
}

export class EventHandler extends events.EventEmitter {
  constructor() {
    super();
  }

  captureRejections = true;

  async addResolvedDep(info: ResolveDepInfo) {
    this.emit(EventType.ResolvedDep, info);
  }

  // Wait for all events to finish
  async wait(event: EventType) {
    return new Promise((resolve) => {
      while (this.listenerCount(event) === 0) {
        setTimeout(() => {}, 100);
      }
    });
  }
}

export const eventHandler = new EventHandler();
