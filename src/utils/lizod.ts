export type AccessPath = Array<(string | symbol | number)>;
export type ValidatorContext = {
  errors: Array<AccessPath>;
};
