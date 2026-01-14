export interface IImageOperation<P> {
  execute(buffer: Buffer, params: P): Promise<Buffer>;
}
