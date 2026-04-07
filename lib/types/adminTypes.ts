export type ApiTask = {
  id: string;
  name: string;
};

export type ApiCategory = {
  id: string;
  name: string;
  tasks: ApiTask[];
  category: Category;
};

export type ApiTemplate = {
  id: string;
  name: string;
  categories: ApiCategory[];
};

export type Task = { id: string; name: string };
export type Category = { id: string; name: string; tasks: Task[] };
export type Template = { id: string; name: string; categories: Category[] };
