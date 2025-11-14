export interface IikoAccessTokenPayload {
  apiLogin: string;
}

export interface IikoAccessTokenResponse {
  correlationId: string;
  token: string;
}

export interface IikoExternalMenu {
  id: string;
  name: string;
}

export interface IikoExternalMenusResponse {
  correlationId: string;
  externalMenus: IikoExternalMenu[];
  priceCategories: any[]; // Adjust if specific structure is known
}

export interface IikoOrganization {
  responseType: string;
  id: string;
  name: string;
  code: string;
}

export interface IikoOrganizationsResponse {
  correlationId: string;
  organizations: IikoOrganization[];
}

export interface IikoMenuByIdPayload {
  externalMenuId: string;
  organizationIds: string[];
}

export interface IikoProductCategory {
  id: string;
  name: string;
  isDeleted: boolean;
}

export interface IikoItemSizePrice {
  organizationId: string;
  price: number;
}

export interface IikoItemSizeNutrition {
  fats: number;
  proteins: number;
  carbs: number;
  energy: number;
  organizations: string[];
  saturatedFattyAcid: number | null;
  salt: number | null;
  sugar: number | null;
}

export interface IikoItemSize {
  sku: string;
  sizeCode: string;
  sizeName: string;
  isDefault: boolean;
  portionWeightGrams: number;
  itemModifierGroups: any[]; // Adjust if specific structure is known
  sizeId: string | null;
  nutritionPerHundredGrams: IikoItemSizeNutrition;
  prices: IikoItemSizePrice[];
  nutritions: IikoItemSizeNutrition[];
  isHidden: boolean;
  measureUnitType: string;
  buttonImageUrl: string | null;
}

export interface IikoItem {
  sku: string;
  name: string;
  description: string;
  allergens: any[]; // Adjust if specific structure is known
  tags: any[]; // Adjust if specific structure is known
  labels: any[]; // Adjust if specific structure is known
  itemSizes: IikoItemSize[];
  itemId: string;
  modifierSchemaId: string | null;
  taxCategory: {
    id: string;
    name: string;
    percentage: number;
  } | null;
  modifierSchemaName: string;
  type: string;
  canBeDivided: boolean;
  canSetOpenPrice: boolean;
  useBalanceForSell: boolean;
  measureUnit: string;
  productCategoryId: string;
  customerTagGroups: any[]; // Adjust if specific structure is known
  paymentSubject: string;
  paymentSubjectCode: string;
  outerEanCode: string | null;
  isMarked: boolean;
  isHidden: boolean;
  barcodes: any | null; // Adjust if specific structure is known
  orderItemType: string;
}

export interface IikoItemCategory {
  id: string;
  name: string;
  description: string;
  buttonImageUrl: string | null;
  headerImageUrl: string | null;
  iikoGroupId: string;
  items: IikoItem[];
  scheduleId: string | null;
  scheduleName: string | null;
  schedules: any[]; // Adjust if specific structure is known
  isHidden: boolean;
  tags: any[]; // Adjust if specific structure is known
  labels: any[]; // Adjust if specific structure is known
}

export interface IikoMenuByIdResponse {
  productCategories: IikoProductCategory[];
  customerTagGroups: any[]; // Adjust if specific structure is known
  revision: number;
  formatVersion: number;
  id: number;
  name: string;
  description: string;
  buttonImageUrl: string;
  intervals: any[]; // Adjust if specific structure is known
  itemCategories: IikoItemCategory[];
  comboCategories: any[]; // Adjust if specific structure is known
}

export interface GetIikoMenuPayload {
  restaurant_ids: number[];
}

export interface IikoMenuResponse {
  restaurant_id: number;
  menu: IikoMenuByIdResponse | null;
  error?: string;
}
