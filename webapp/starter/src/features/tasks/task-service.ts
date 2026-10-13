// Her kommer bedriftslogikken vår
// Her importerer vi Repository
// Her validerer vi mot "Task" spesifikk logikk
// Her sjekker vi om du får lov til det du prøver å gjøre
// Her mapper vi muligens data for å ha en konsistent struktur
// Her tilgjengeligjør vi funksjonalitet som "actions.ts" og "controller" trenger

import { taskRepository, type TaskRepository } from "./task-repository";

export interface TaskService {
  list(user: any): Promise<any>;
  get(user: any, id: string): Promise<any>;
  create(user: any, input: any): Promise<any>;
  update(user: any, id: string, input: any): Promise<any>;
  remove(user: any, id: string): Promise<any>;
}

export function createTaskService(repository: TaskRepository): TaskService {
  return {
    async list(user) {
      // Her parser vi kanskje noen query params som vi har fått inn som data
      // Her sjekker vi kanskje rolle
      // Her kaller vi repository.findMany()
      // Her returnerer vi resultatet av det vi fikk fra repository
    },
  };
}

export const taskService = createTaskService(taskRepository);
