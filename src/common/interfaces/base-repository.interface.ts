export interface IBaseRepository<TModel> {
  findAll(filter?: any, options?: any): Promise<TModel[]>;
  findOne(id: string): Promise<TModel | null>;
  create(data: Partial<TModel>): Promise<TModel>;
  update(id: string, data: Partial<TModel>): Promise<TModel>;
  remove(id: string): Promise<void>;
}
