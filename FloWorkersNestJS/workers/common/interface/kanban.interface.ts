export type TKanban = {
  user_id: number;
  email: string;
  kanban_ids: number[];
};

export type TSystemKanban = {
  user_id: number;
  email: string;
  collection_id: number;
  is_migrate: boolean;
};