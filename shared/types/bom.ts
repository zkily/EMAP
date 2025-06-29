/**
 * BOM（部品構成）関連の型定義
 */

// BOM一覧表示用
export interface BomItem {
  id?: number;
  product_id: number;
  product_cd?: string;
  product_name?: string;
  component_id: number;
  component_cd?: string;
  component_name?: string;
  quantity: number;
  unit_price?: number | null;
  note?: string | null;
}

// BOM登録・更新用パラメータ
export interface BomCreateParams {
  product_id: number;
  component_id: number;
  quantity: number;
  unit_price?: number | null;
  note?: string | null;
}

// BOM一覧検索用パラメータ
export interface BomSearchParams {
  product_cd?: string;
  product_name?: string;
  page?: number;
  pageSize?: number;
}

// BOM展開ツリー用
export interface BomTreeNode {
  id: number;
  component_id: number;
  component_name: string;
  quantity: number;
  unit_price: number | null;
  level: number;
  children?: BomTreeNode[];
}

// BOM逆展開用
export interface BomReverseItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  level: number;
  path: string;
}

// 製品選択肢
export interface ProductOption {
  id: number;
  product_cd: string;
  product_name: string;
}

// 部品選択肢
export interface ComponentOption {
  id: number;
  component_cd: string;
  component_name: string;
}
