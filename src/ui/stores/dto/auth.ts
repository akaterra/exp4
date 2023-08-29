export interface IAuthStrategyMethod {
  id: string;
  type: string;

  title?: string;
  description?: string;

  actions: Record<string, any>;
}
