export type CatalogLoadGuard = {
  startLoad: () => boolean;
  endLoad: () => void;
};
