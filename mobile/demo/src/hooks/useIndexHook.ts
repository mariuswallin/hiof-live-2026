import { TASKS } from "@/data/tasks";
import type { Task } from "@/utils/task-schema";
import { useEffect, useState } from "react";

export function useIndexHook() {
  const [allMyTasks, setAllMyTasks] = useState<Task[]>(TASKS);

  const myAwesomeFunction = (data: { message: string; id: number }) => {
    console.log("Hello from Index.tsx");
    console.log(data);
  };

  // function myAwesomeFunction() {
  //   console.log("Hello from Index.tsx");
  // }

  function toggle(id: string) {
    // const updatedTasks = allMyTasks.map((task) =>
    //   task.id === id ? { ...task, done: !task.done } : task,
    // );

    // setAllMyTasks(updatedTasks);

    console.log(id);

    setAllMyTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function handleRegisterTask(taskName: string) {
    const newTask = {
      id: (allMyTasks.length + 1).toString(),
      title: taskName,
      done: false, // Randomly set done status for demonstration
    };

    setAllMyTasks((prevTasks) => [...prevTasks, newTask]);
  }

  useEffect(() => {
    // TODO: Fetch tasks from an API

    const fetchTasksFromApi = async () => {
      try {
        const response = await fetch("https://api.example.com/tasks");
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data: Task[] = await response.json();
        setAllMyTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasksFromApi();

    console.log("Current tasks:", allMyTasks);
  }, []);

  return {
    tasks: allMyTasks,
    toggle,
    add: handleRegisterTask,
  };
}
