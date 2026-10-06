// Her tar vi i mot requesten
// Her kan vi hente ut bruker fra context og jobbe med den
// (i tilfelle vi vil sende deg ut med 401 eller 403 med en gang)

// Her validerer vi at minium med required data er oppfylt (eks. tittel > 10)
// Her sender vi en Response tilbake med et gitt format {ok: true, data: }
// eller {ok: false: error: {}}

// Her importerer vi service og sender data videre til den

export interface TaskController {
  list(): Promise<any>;
  get(): Promise<any>;
  create(): Promise<any>;
  update(): Promise<any>;
  action(): Promise<any>;
  remove(): Promise<any>;
}

export function createTaskController(service: any): TaskController {
  return {
    async list() {
      // Her vil jeg gjøre en enkel validering
      // Her vil jeg kalle service.list() med nødvendig parametre
      // Her vil jeg returnere en response
    },
    async get() {},
    async create() {},
    async update() {},
    async remove() {},
    async action() {},
  };
}

export const taskController = createTaskController();
