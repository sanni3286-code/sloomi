import { create } from 'zustand';
import { db } from '../lib/db';
import { createId } from '../lib/id';
import type { TodoItem, Weekday } from '../types/models';

export interface TodoInput {
  title: string;
  durationSeconds: number;
  color: string;
  icon: string;
  weekday: Weekday | null;
}

interface TodosState {
  todos: TodoItem[];
  hydrated: boolean;
  init: () => Promise<void>;
  addTodo: (input: TodoInput) => Promise<TodoItem>;
  updateTodo: (id: string, input: TodoInput) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
}

export const useTodosStore = create<TodosState>((set, get) => ({
  todos: [],
  hydrated: false,

  init: async () => {
    const todos = await db.todos.toArray();
    todos.sort((a, b) => b.createdAt - a.createdAt);
    set({ todos, hydrated: true });
  },

  addTodo: async (input) => {
    const now = Date.now();
    const todo: TodoItem = { ...input, id: createId(), completed: false, createdAt: now, updatedAt: now };
    await db.todos.put(todo);
    set({ todos: [todo, ...get().todos] });
    return todo;
  },

  updateTodo: async (id, input) => {
    const existing = get().todos.find((t) => t.id === id);
    if (!existing) return;
    const updated: TodoItem = { ...existing, ...input, updatedAt: Date.now() };
    await db.todos.put(updated);
    set({ todos: get().todos.map((t) => (t.id === id ? updated : t)) });
  },

  removeTodo: async (id) => {
    await db.todos.delete(id);
    set({ todos: get().todos.filter((t) => t.id !== id) });
  },

  toggleCompleted: async (id) => {
    const existing = get().todos.find((t) => t.id === id);
    if (!existing) return;
    const updated: TodoItem = { ...existing, completed: !existing.completed, updatedAt: Date.now() };
    await db.todos.put(updated);
    set({ todos: get().todos.map((t) => (t.id === id ? updated : t)) });
  },
}));
