
export default interface Executor {
    setCommand(command: string): this;
    setArgs(args: Map<string, string>): this;
    run<T>(): Promise<T>;
}
