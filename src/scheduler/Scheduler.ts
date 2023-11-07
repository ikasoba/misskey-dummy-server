import { basename } from "path/mod.ts";

export type TasksType = Record<string, (...a: any[]) => any>;

export type ScheduledTask<Tasks extends TasksType, EventName extends string> = {
  [K in keyof Tasks]: {
    type: K;
    on: EventName;
    args: Parameters<Tasks[K]>;
  };
}[keyof Tasks];

export type ScheduledTasks<Tasks extends TasksType, EventName extends string> =
  {
    [E in EventName]?: ScheduledTask<Tasks, E>[];
  };

export class Scheduler<
  Tasks extends TasksType,
  EventName extends string = never,
> {
  private scheduledTasks: ScheduledTasks<Tasks, EventName>;

  constructor(
    private tasksFilePath: string,
    private tasks: Tasks,
  ) {
    try {
      Deno.mkdirSync(basename(tasksFilePath), { recursive: true });
    } catch {}

    try {
      this.scheduledTasks = JSON.parse(
        Deno.readTextFileSync(this.tasksFilePath),
      );
    } catch {
      this.scheduledTasks = {};
    }
  }

  private async syncScheduledTasks() {
    await Deno.writeTextFile(
      this.tasksFilePath,
      JSON.stringify(this.scheduledTasks),
    );
  }

  defineEvent<N extends string>(
    ..._: N[]
  ): Scheduler<Tasks, EventName | N> {
    return this as any;
  }

  defineTask<N extends string, F extends TasksType[string]>(
    name: N,
    fn: F,
  ): Scheduler<Tasks & { [_ in N]: F }, EventName> {
    const self = this as any as Scheduler<Tasks & { [_ in N]: F }, EventName>;

    self.tasks[name] = fn as any;

    return self;
  }

  async dispatch(eventName: EventName): Promise<void> {
    const tasks = this.scheduledTasks[eventName] ?? [];
    this.scheduledTasks[eventName] = [];

    console.log("[scheduler]", "dispatch event", JSON.stringify(eventName));

    for (const task of tasks) {
      if (task.on == eventName) {
        const fn = this.tasks[task.type];

        fn(...task.args);

        continue;
      }
    }

    await this.syncScheduledTasks();
  }

  async schedule<K extends keyof Tasks, E extends EventName>(
    taskName: K,
    eventName: E,
    ...args: Parameters<Tasks[K]>
  ): Promise<void> {
    const tasks = this.scheduledTasks[eventName] ?? [];

    console.log(
      "[scheduler]",
      "schedule task",
      JSON.stringify(taskName),
      "on",
      JSON.stringify(eventName),
    );
    tasks.push({
      type: taskName,
      on: eventName,
      args: args,
    });

    this.scheduledTasks[eventName] = tasks;

    await this.syncScheduledTasks();
  }
}
